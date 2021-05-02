import { FollowPoint, ScheduleAction } from "@aws-sdk/client-medialive";
import { VideoBroadcastBlob } from "@clowdr-app/shared-types/build/content";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan/dist";
import AmazonS3URI from "amazon-s3-uri";
import { add } from "date-fns";
import * as R from "ramda";
import { MediaLiveService } from "../../aws/medialive/medialive.service";
import { RoomMode_Enum, RtmpInput_Enum } from "../../generated/graphql";
import { GraphQlService } from "../../hasura-data/graphql/graphql.service";
import {
    LocalSchedule,
    LocalScheduleAction,
    LocalScheduleService,
} from "../../hasura-data/local-schedule/local-schedule.service";
import { ChannelStackDetails } from "../../hasura-data/media-live-channel/channel-stack-details";
import { MediaLiveChannelService } from "../../hasura-data/media-live-channel/media-live-channel.service";
import {
    EventAction,
    InvalidAction,
    RemoteSchedule,
    RemoteScheduleAction,
    RemoteScheduleService,
} from "../remote-schedule/remote-schedule.service";

export class ScheduleSyncService {
    private readonly logger: Bunyan;
    constructor(
        @RootLogger() logger: Bunyan,
        private graphQlService: GraphQlService,
        private mediaLiveService: MediaLiveService,
        private mediaLiveChannelService: MediaLiveChannelService,
        private localScheduleService: LocalScheduleService,
        private remoteScheduleService: RemoteScheduleService
    ) {
        this.logger = logger.child({ component: this.constructor.name });
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
    }

    public async syncChannelSchedule(roomId: string): Promise<void> {
        this.logger.info({ roomId }, "Syncing channel schedule");

        const channelDetails = await this.mediaLiveChannelService.getChannelStackDetails(roomId);

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
                this.convertLocalEventToScheduleActions(action, channelDetails, syncCutoffTime)
            )
        );

        return { adds, deletes };
    }

    public convertLocalEventToScheduleActions(
        localAction: LocalScheduleAction,
        channelStackDetails: ChannelStackDetails,
        syncCutoffTime: number
    ): ScheduleAction[] {
        if (localAction.startTime <= syncCutoffTime) {
            return [];
        }

        if (this.localScheduleService.isLive(localAction.roomModeName)) {
            return [
                {
                    ActionName: `e/${localAction.eventId}`,
                    ScheduleActionStartSettings: {
                        FixedModeScheduleActionStartSettings: {
                            Time: new Date(localAction.startTime).toISOString(),
                        },
                    },
                    ScheduleActionSettings: {
                        InputSwitchSettings: {
                            InputAttachmentNameReference:
                                localAction.rtmpInputName === RtmpInput_Enum.RtmpB
                                    ? channelStackDetails.rtmpBInputAttachmentName ??
                                      channelStackDetails.rtmpAInputAttachmentName
                                    : channelStackDetails.rtmpAInputAttachmentName,
                        },
                    },
                },
            ];
        }

        if (localAction.roomModeName === RoomMode_Enum.Prerecorded) {
            const videoKey = localAction.videoData ? this.getVideoKey(localAction.videoData) : null;
            if (!videoKey) {
                this.logger.warn(
                    { eventId: localAction.eventId },
                    "Could not generate an action for prerecorded event because no video key was found"
                );
            } else {
                return [
                    {
                        ActionName: `e/${localAction.eventId}`,
                        ScheduleActionStartSettings: {
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
        const videosMatch = !!localAction.videoData && this.getVideoKey(localAction.videoData) === remoteAction.s3Key;
        const timesMatch = remoteAction.startTime === localAction.startTime;

        return (
            remoteAction.eventId === localAction.eventId && modesMatch && rtmpInputsMatch && videosMatch && timesMatch
        );
    }

    public getVideoKey(videoBroadcastData: VideoBroadcastBlob): string | null {
        if (videoBroadcastData.broadcastTranscode?.s3Url) {
            try {
                const { key } = new AmazonS3URI(videoBroadcastData.broadcastTranscode.s3Url);
                if (!key) {
                    throw new Error("Key in S3 URL was empty");
                }
                return key;
            } catch (err) {
                this.logger.warn(
                    { err, s3Url: videoBroadcastData.broadcastTranscode.s3Url },
                    "Could not parse S3 URL of broadcast transcode."
                );
            }
        }
        if (videoBroadcastData.transcode?.s3Url) {
            try {
                const { key } = new AmazonS3URI(videoBroadcastData.transcode.s3Url);
                if (!key) {
                    throw new Error("Key in S3 URL was empty");
                }
                return key;
            } catch (err) {
                this.logger.warn(
                    { err, s3Url: videoBroadcastData.transcode.s3Url },
                    "Could not parse S3 URL of preview transcode."
                );
            }
        }
        if (videoBroadcastData.s3Url) {
            try {
                const { key } = new AmazonS3URI(videoBroadcastData.s3Url);
                if (!key) {
                    throw new Error("Key in S3 URL was empty");
                }
                return key;
            } catch (err) {
                this.logger.warn(
                    { err, s3Url: videoBroadcastData.s3Url },
                    "Could not parse S3 URL of original upload."
                );
            }
        }
        return null;
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
        await this.mediaLiveService.updateSchedule(channelId, actionsToRemove, []);
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
}
