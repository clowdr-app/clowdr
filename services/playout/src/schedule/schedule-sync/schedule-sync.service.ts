import { ChannelState, FollowPoint, ScheduleAction } from "@aws-sdk/client-medialive";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan/dist";
import { add } from "date-fns";
import * as R from "ramda";
import { v4 as uuidv4 } from "uuid";
import { MediaLiveService } from "../../aws/medialive/medialive.service";
import { Room_Mode_Enum, Video_RtmpInput_Enum } from "../../generated/graphql";
import { ChannelStackDetails } from "../../hasura-data/channel-stack/channel-stack-details";
import { ChannelStackDataService } from "../../hasura-data/channel-stack/channel-stack.service";
import { ContentElementDataService } from "../../hasura-data/content/content-element.service";
import {
    LocalSchedule,
    LocalScheduleAction,
    LocalScheduleService,
    Room,
} from "../../hasura-data/local-schedule/local-schedule.service";
import {
    EventAction,
    InvalidAction,
    RemoteSchedule,
    RemoteScheduleAction,
    RemoteScheduleService,
} from "../remote-schedule/remote-schedule.service";
import { VonageService } from "../vonage/vonage.service";

export class ScheduleSyncService {
    private readonly logger: Bunyan;
    constructor(
        @RootLogger() logger: Bunyan,
        private mediaLiveService: MediaLiveService,
        private channelStackDataService: ChannelStackDataService,
        private localScheduleService: LocalScheduleService,
        private remoteScheduleService: RemoteScheduleService,
        private vonageService: VonageService,
        private contentElementDataService: ContentElementDataService
    ) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    public async syncChannelOnStartup(mediaLiveChannelId: string): Promise<void> {
        const {
            eventId,
            roomId,
            conferenceId,
        } = await this.channelStackDataService.getCurrentOrUpcomingEventByMediaLiveChannelId(mediaLiveChannelId);

        if (!roomId) {
            this.logger.error(
                { mediaLiveChannelId },
                "Could not find any room associated with the MediaLive channel, ignoring"
            );
            return;
        }

        if (!conferenceId) {
            this.logger.error(
                { mediaLiveChannelId },
                "Could not find any conference associated with the MediaLive channel, ignoring"
            );
            return;
        }

        const channelStackDetails = await this.channelStackDataService.getChannelStackDetails(roomId);

        if (!channelStackDetails) {
            this.logger.error(
                { mediaLiveChannelId },
                "Could not retrieve details of the channel stack for this MediaLive channel"
            );
            return;
        }

        if (eventId) {
            this.logger.info({ eventId, mediaLiveChannelId }, "Found event to play on channel startup");
            const localScheduleAction = await this.localScheduleService.getEventScheduleData(eventId);

            if (!localScheduleAction) {
                this.logger.error({ eventId, mediaLiveChannelId }, "Could not retrieve details of event, ignoring");
                return;
            }

            const scheduleActions = this.convertLocalEventToScheduleActions(
                localScheduleAction,
                channelStackDetails,
                0,
                true
            );
            await this.mediaLiveService.updateSchedule(mediaLiveChannelId, [], scheduleActions);
        } else {
            this.logger.info("No event found to play on channel startup, playing filler video.");
            const fillerVideoKey = await this.channelStackDataService.getFillerVideoKey(conferenceId);

            if (!fillerVideoKey) {
                this.logger.warn(
                    { mediaLiveChannelId, conferenceId },
                    "Conference does not have a filler video, skipping"
                );
                return;
            }

            const scheduleActions = [
                {
                    ActionName: `i/${uuidv4()}`,
                    ScheduleActionSettings: {
                        InputSwitchSettings: {
                            InputAttachmentNameReference: channelStackDetails.loopingMp4InputAttachmentName,
                            UrlPath: [fillerVideoKey],
                        },
                    },
                    ScheduleActionStartSettings: {
                        ImmediateModeScheduleActionStartSettings: {},
                    },
                },
            ];

            await this.mediaLiveService.updateSchedule(mediaLiveChannelId, [], scheduleActions);
        }
    }

    public async fullScheduleSync(): Promise<void> {
        this.logger.info("Fully syncing channel schedules");

        const roomIds = await this.localScheduleService.getRoomsWithBroadcastEvents();

        this.logger.info(`Found ${roomIds.length} channel(s) with broadcast events. Commencing sync.`);

        for (const roomId of roomIds) {
            try {
                await this.syncChannelSchedule(roomId);
            } catch (err) {
                this.logger.error({ err, roomId }, "Failure while syncing channel schedule");
            }
        }

        const roomsToStart = await this.localScheduleService.getRoomsWithCurrentOrUpcomingEvents();

        for (const room of roomsToStart) {
            try {
                await this.startRoomChannel(room);
            } catch (err) {
                this.logger.error({ err, room: room }, "Failure while ensuring room channel started");
            }
        }

        const roomsToStop = await this.localScheduleService.getRoomsWithoutCurrentOrUpcomingEvents();

        for (const room of roomsToStop) {
            try {
                await this.stopRoomChannel(room);
            } catch (err) {
                this.logger.error({ err, room: room }, "Failure while ensuring room channel stopped");
            }
        }

        try {
            await this.vonageService.createMissingEventVonageSessions();
        } catch (err) {
            this.logger.error({ err }, "Failed to create missing event Vonage sessions");
        }
    }

    public async syncChannelSchedule(roomId: string): Promise<void> {
        this.logger.info({ roomId }, "Syncing channel schedule");

        const channelDetails = await this.channelStackDataService.getChannelStackDetails(roomId);

        if (!channelDetails) {
            this.logger.warn({ roomId }, "No MediaLive channel found for room. Skipping schedule sync.");
            return;
        }

        const channelStatus = await this.mediaLiveService.getChannelState(channelDetails.mediaLiveChannelId);

        if (!channelStatus) {
            this.logger.warn(
                { roomId, mediaLiveChannelId: channelDetails.mediaLiveChannelId },
                "Could not retrieve status of MediaLive channel. Skipping schedule sync."
            );
            return;
        }

        if (!["IDLE", "RUNNING"].includes(channelStatus)) {
            this.logger.warn(
                { roomId, mediaLiveChannelId: channelDetails.mediaLiveChannelId, channelStatus },
                "Channel status precludes schedule sync. Skipping schedule sync."
            );
        }

        const now = Date.now();
        const syncCutoffTime = add(now, { seconds: 20 }).getTime();

        const remoteSchedule = await this.remoteScheduleService.getRemoteSchedule(channelDetails.mediaLiveChannelId);

        // Attempt to remove invalid actions from the remote schedule.
        let deletedActions: string[] = [];
        try {
            deletedActions = await this.deleteInvalidActions(
                channelDetails.mediaLiveChannelId,
                remoteSchedule,
                syncCutoffTime
            );
        } catch (err) {
            this.logger.error(
                { err, mediaLiveChannelId: channelDetails.mediaLiveChannelId },
                "Failure while attempting to remove invalid actions from the remote schedule."
            );
        }

        // If items were deleted, filter them out of our local cache of the schedule.
        remoteSchedule.items = remoteSchedule.items.filter(
            (item) => item.actionName && !deletedActions.includes(item.actionName)
        );
        remoteSchedule.rawActions = remoteSchedule.rawActions.filter(
            (item) => item.ActionName && !deletedActions.includes(item.ActionName)
        );

        const localSchedule = await this.computeExpectedSchedule(roomId);
        const { deletes, adds } = this.computeRequiredScheduleChanges(
            localSchedule,
            remoteSchedule,
            channelDetails,
            syncCutoffTime
        );
        this.logger.info(
            {
                deleteCount: deletes.length,
                addCount: adds.length,
                mediaLiveChannelId: channelDetails.mediaLiveChannelId,
                roomId,
            },
            "Computed required schedule changes for channel"
        );
        await this.mediaLiveService.updateSchedule(channelDetails.mediaLiveChannelId, deletes, adds);
        this.logger.info(
            { roomId, mediaLiveChannelId: channelDetails.mediaLiveChannelId },
            "Finished syncing channel schedule"
        );
    }

    public async computeExpectedSchedule(roomId: string): Promise<LocalSchedule> {
        const initialSchedule = await this.localScheduleService.getScheduleData(roomId);
        return await this.localScheduleService.ensureRtmpInputsAlternate(initialSchedule);
    }

    public computeRequiredScheduleChanges(
        localSchedule: LocalSchedule,
        remoteSchedule: RemoteSchedule,
        channelDetails: ChannelStackDetails,
        syncCutoffTime: number
    ): { adds: ScheduleAction[]; deletes: string[] } {
        const deletes: string[] = [];

        // Delete outdated actions
        for (const remoteAction of remoteSchedule.items) {
            switch (remoteAction.type) {
                case "event": {
                    // Identify items in the local schedule matching the item in the remote schedule.
                    const localCandidates = localSchedule.items.filter((item) => item.eventId === remoteAction.eventId);
                    const localMatches = localCandidates.find((candidateAction) =>
                        this.actionsMatch(candidateAction, remoteAction)
                    );
                    // If no matching item is found, and the remote item can be deleted, delete it and its chain.
                    if (!localMatches && this.canRemoveEventAction(remoteAction, syncCutoffTime)) {
                        deletes.push(
                            remoteAction.actionName,
                            ...remoteAction.chainAfter.map((x) => x.ActionName).filter(ScheduleSyncService.notEmpty)
                        );
                    }
                    break;
                }
                case "event-follow":
                    // We pick these up for deletion already when we look through the after-chain of an event.
                    break;
                case "immediate":
                case "invalid":
                case "manual":
                    // At this point, we should have dealt with invalid actions.
                    // And immediate and manual actions are to be left alone once created.
                    break;
            }
        }
        // Create missing actions
        const missingActions: LocalScheduleAction[] = [];
        for (const localAction of localSchedule.items) {
            const remoteCandidates = remoteSchedule.items.filter(
                (item) => item.type === "event" && item.eventId === localAction.eventId
            );
            const remoteMatches = remoteCandidates.filter((candidateAction) =>
                this.actionsMatch(localAction, candidateAction)
            );
            if (remoteMatches.length === 0) {
                missingActions.push(localAction);
            }
        }

        const adds = R.flatten(
            missingActions.map((action) =>
                this.convertLocalEventToScheduleActions(action, channelDetails, syncCutoffTime, false)
            )
        );

        return { adds, deletes };
    }

    public convertLocalEventToScheduleActions(
        localAction: LocalScheduleAction,
        channelStackDetails: ChannelStackDetails,
        syncCutoffTime: number,
        immediate: boolean
    ): ScheduleAction[] {
        if (!immediate && localAction.startTime <= syncCutoffTime) {
            return [];
        }

        if (this.localScheduleService.isLive(localAction.roomModeName)) {
            return [
                {
                    ActionName: immediate ? `i/${uuidv4()}` : `e/${localAction.eventId}`,
                    ScheduleActionStartSettings: immediate
                        ? {
                              ImmediateModeScheduleActionStartSettings: {},
                          }
                        : {
                              FixedModeScheduleActionStartSettings: {
                                  Time: new Date(localAction.startTime).toISOString(),
                              },
                          },
                    ScheduleActionSettings: {
                        InputSwitchSettings: {
                            InputAttachmentNameReference:
                                localAction.rtmpInputName === Video_RtmpInput_Enum.RtmpB
                                    ? channelStackDetails.rtmpBInputAttachmentName ??
                                      channelStackDetails.rtmpAInputAttachmentName
                                    : channelStackDetails.rtmpAInputAttachmentName,
                        },
                    },
                },
            ];
        }

        if (localAction.roomModeName === Room_Mode_Enum.Prerecorded) {
            const videoKey = localAction.videoData
                ? this.contentElementDataService.getVideoKey(localAction.videoData)
                : null;
            if (!videoKey) {
                this.logger.warn(
                    { eventId: localAction.eventId },
                    "Could not generate an action for prerecorded event because no video key was found"
                );
            } else {
                return [
                    {
                        ActionName: immediate ? `i/${uuidv4()}` : `e/${localAction.eventId}`,
                        ScheduleActionStartSettings: immediate
                            ? {
                                  ImmediateModeScheduleActionStartSettings: {},
                              }
                            : {
                                  FixedModeScheduleActionStartSettings: {
                                      Time: new Date(localAction.startTime).toISOString(),
                                  },
                              },
                        ScheduleActionSettings: {
                            InputSwitchSettings: {
                                InputAttachmentNameReference: channelStackDetails.mp4InputAttachmentName,
                                UrlPath: [videoKey],
                            },
                        },
                    },
                    ...(channelStackDetails.fillerVideoKey
                        ? [
                              {
                                  ActionName: `ef/${localAction.eventId}`,
                                  ScheduleActionStartSettings: {
                                      FollowModeScheduleActionStartSettings: {
                                          FollowPoint: FollowPoint.END,
                                          ReferenceActionName: `e/${localAction.eventId}`,
                                      },
                                  },
                                  ScheduleActionSettings: {
                                      InputSwitchSettings: {
                                          InputAttachmentNameReference:
                                              channelStackDetails.loopingMp4InputAttachmentName,
                                          UrlPath: [channelStackDetails.fillerVideoKey],
                                      },
                                  },
                              },
                          ]
                        : []),
                ];
            }
        }
        return [];
    }

    public actionsMatch(localAction: LocalScheduleAction, remoteAction: RemoteScheduleAction): boolean {
        if (remoteAction.type !== "event") {
            return false;
        }

        const modesMatch =
            (remoteAction.mode === "prerecorded" && !!localAction.videoData) ||
            (remoteAction.mode === "live" && !!localAction.rtmpInputName);
        const rtmpInputsMatch = remoteAction.rtmpInputName === localAction.rtmpInputName;
        const videosMatch =
            !!localAction.videoData &&
            this.contentElementDataService.getVideoKey(localAction.videoData) === remoteAction.s3Key;
        const timesMatch = remoteAction.startTime === localAction.startTime;

        return (
            remoteAction.eventId === localAction.eventId && modesMatch && rtmpInputsMatch && videosMatch && timesMatch
        );
    }

    public async deleteInvalidActions(
        channelId: string,
        remoteSchedule: RemoteSchedule,
        syncCutoffTime: number
    ): Promise<string[]> {
        const actionsToRemove = R.uniq(
            R.flatten(
                remoteSchedule.items
                    .filter(
                        (action) => action.type === "invalid" && this.canRemoveInvalidAction(action, syncCutoffTime)
                    )
                    .map((action) => [
                        action.actionName,
                        ...(action.type === "invalid" ? action.chainAfter.map((x) => x.ActionName) : []),
                    ])
            ).filter(ScheduleSyncService.notEmpty)
        );
        if (actionsToRemove.length) {
            this.logger.warn(
                { count: actionsToRemove.length, actionsToRemove, channelId },
                "Removing invalid actions from schedule"
            );
            await this.mediaLiveService.updateSchedule(channelId, actionsToRemove, []);
        }
        return actionsToRemove;
    }

    canRemoveInvalidAction(action: InvalidAction, removalCutoffTime: number): boolean {
        const notInputSwitch = !action.isInputSwitch;
        const inFuture = !!action.startTime && action.startTime > removalCutoffTime;
        // If chainBeforeStartTime is null, implies a follow chain from an immediate action - not safe to attempt removal
        const inUnstartedChain = !!action.chainBeforeStartTime && action.chainBeforeStartTime > removalCutoffTime;
        return notInputSwitch || inFuture || inUnstartedChain;
    }

    canRemoveEventAction(action: EventAction, syncCutoffTime: number): boolean {
        const inFuture = action.startTime > syncCutoffTime;
        return inFuture;
    }

    static notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
        return value !== null && value !== undefined;
    }

    static isString(value: string | any): value is string {
        return typeof value === "string";
    }

    public async startRoomChannel(room: Room): Promise<void> {
        if (room.mediaLiveChannelId && room.channelStackId) {
            const channelState = await this.getChannelStateOrDetach(room.channelStackId, room.mediaLiveChannelId);
            this.logger.debug(
                { roomId: room.roomId, mediaLiveChannelId: room.mediaLiveChannelId, channelState },
                "Retrieved current MediaLive channel state"
            );
            const failStates: (string | null)[] = [
                ChannelState.CREATE_FAILED,
                ChannelState.DELETED,
                ChannelState.DELETING,
                ChannelState.UPDATE_FAILED,
            ];
            if (failStates.includes(channelState)) {
                try {
                    await this.channelStackDataService.detachChannelStack(room.mediaLiveChannelId);
                } catch (e) {
                    this.logger.error(
                        { channelStackId: room.channelStackId, roomId: room.roomId },
                        "Failed to detach channel stack"
                    );
                }
                return;
            }

            const stoppedStates: (string | null)[] = [ChannelState.IDLE, ChannelState.STOPPING];
            if (stoppedStates.includes(channelState)) {
                await this.mediaLiveService.startChannel(room.mediaLiveChannelId);
            }

            const startedStates: (string | null)[] = [ChannelState.RUNNING];
            if (startedStates.includes(channelState)) {
                this.logger.debug({ room, channelState }, "Channel is already running");
            }

            const startingStates: (string | null)[] = [
                ChannelState.STARTING,
                ChannelState.CREATING,
                ChannelState.UPDATING,
            ];
            if (startingStates.includes(channelState)) {
                this.logger.debug({ room, channelState }, "Channel is already in startup");
            }

            if (channelState === ChannelState.RECOVERING) {
                this.logger.debug({ room, channelState }, "Channel is currently recovering");
            }
        } else {
            this.logger.info({ roomId: room.roomId }, "No channel stack available for room yet, skipping startup");
        }
    }

    public async stopRoomChannel(room: Room): Promise<void> {
        if (room.channelStackId && room.mediaLiveChannelId) {
            const channelState = await this.getChannelStateOrDetach(room.channelStackId, room.mediaLiveChannelId);

            if (channelState === ChannelState.RUNNING) {
                this.logger.info({ room }, "Stopping running channel");
                await this.mediaLiveService.stopChannel(room.mediaLiveChannelId);
            }
        }
    }

    public async getChannelStateOrDetach(channelStackId: string, mediaLiveChannelId: string): Promise<string | null> {
        let channelState: string | null = null;
        try {
            channelState = await this.mediaLiveService.getChannelState(mediaLiveChannelId);
        } catch (e) {
            try {
                const channelExists = await this.mediaLiveService.channelExists(mediaLiveChannelId);
                if (!channelExists) {
                    this.logger.info({ channelStackId }, "MediaLive channel does not exist, detaching");
                    await this.channelStackDataService.detachChannelStack(channelStackId);
                }
            } catch (e) {
                this.logger.error({ channelStackId }, "Failed to detach channel stack");
            }
            return null;
        }
        return channelState;
    }
}
