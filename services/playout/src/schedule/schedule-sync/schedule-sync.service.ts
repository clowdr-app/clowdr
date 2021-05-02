import { ScheduleAction } from "@aws-sdk/client-medialive";
import { VideoBroadcastBlob } from "@clowdr-app/shared-types/build/content";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan/dist";
import AmazonS3URI from "amazon-s3-uri";
import { add } from "date-fns";
import * as R from "ramda";
import { validate } from "uuid";
import { MediaLiveService } from "../../aws/medialive/medialive.service";
import { RtmpInput_Enum } from "../../generated/graphql";
import { GraphQlService } from "../../hasura-data/graphql/graphql.service";
import { MediaLiveChannelService } from "../../hasura-data/media-live-channel/media-live-channel.service";
import { LocalSchedule, LocalScheduleAction, ScheduleService } from "../../hasura-data/schedule/schedule.service";

export class ScheduleSyncService {
    private readonly logger: Bunyan;
    constructor(
        @RootLogger() logger: Bunyan,
        private graphQlService: GraphQlService,
        private mediaLiveService: MediaLiveService,
        private mediaLiveChannelService: MediaLiveChannelService,
        private scheduleService: ScheduleService
    ) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    public async fullScheduleSync(): Promise<void> {
        this.logger.info("Fully syncing channel schedules");

        const roomIds = await this.scheduleService.getRoomsWithLiveEvents();

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

        const remoteSchedule = await this.getRemoteSchedule(channelDetails.mediaLiveChannelId);

        try {
            await this.deleteInvalidActions(channelDetails.mediaLiveChannelId, remoteSchedule);
        } catch (err) {
            this.logger.error(
                { err, mediaLiveChannelId: channelDetails.mediaLiveChannelId },
                "Failure while attempting to remove invalid actions from the remote schedule."
            );
        }

        const schedule = await this.computeExpectedSchedule(roomId);
    }

    public async computeExpectedSchedule(roomId: string): Promise<LocalSchedule> {
        const initialSchedule = await this.scheduleService.getScheduleData(roomId);
        return await this.scheduleService.ensureRtmpInputsAlternate(initialSchedule);
    }

    public async computeRequiredScheduleChanges(
        localSchedule: LocalSchedule,
        remoteSchedule: RemoteSchedule
    ): Promise<void> {
        const adds: LocalScheduleAction[] = [];
        const deletes: string[] = [];
        for (const localAction of localSchedule.items) {
            const remoteCandidates = remoteSchedule.items.filter(
                (item) => item.type === "event" && item.eventId === localAction.eventId
            );
            for (const remoteCandidate of remoteCandidates) {
                //if ()
            }
            const remoteMatches = remoteCandidates.filter((candidateAction) =>
                this.actionsMatch(localAction, candidateAction)
            );
            if (remoteMatches.length === 0) {
                adds.push(localAction);
            }
        }
        return;
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

    public async getRemoteSchedule(mediaLiveChannelId: string): Promise<RemoteSchedule> {
        const scheduleActions = await this.mediaLiveService.describeSchedule(mediaLiveChannelId);

        const items = scheduleActions.map(
            (action): RemoteScheduleAction => {
                const actionName = this.parseActionName(action.ActionName ?? "");

                if (actionName?.type === "event") {
                    if (this.isPrerecordedAction(action)) {
                        const prerecordedAction = this.parsePrerecordedAction(action, scheduleActions);
                        return prerecordedAction ?? this.toInvalidAction(action, scheduleActions);
                    }
                    if (this.isLiveAction(action)) {
                        const liveAction = this.parseLiveAction(action, scheduleActions);
                        return liveAction ?? this.toInvalidAction(action, scheduleActions);
                    }
                }

                if (actionName?.type === "event-follow") {
                    if (this.isEventFollowAction(action)) {
                        const followAction = this.parseEventFollowAction(action, scheduleActions);
                        return followAction ?? this.toInvalidAction(action, scheduleActions);
                    }
                }

                if (actionName?.type === "manual") {
                    const chainBefore = this.scheduleService.getChainBefore(action, scheduleActions);
                    return {
                        type: "manual",
                        actionName: actionName.actionName,
                        id: actionName.id,
                        startTime: this.scheduleService.getStartTime(action),
                        isInputSwitch: this.isInputSwitch(action),
                        chainAfter: this.scheduleService.getChainAfter(action, scheduleActions),
                        chainBefore,
                        chainBeforeStartTime: this.scheduleService.getChainBeforeStartTime(chainBefore),
                    };
                }

                if (actionName?.type === "immediate" && this.isImmediateAction(action)) {
                    return {
                        type: "immediate",
                        actionName: actionName.actionName,
                        id: actionName.id,
                        startTime: this.scheduleService.getStartTime(action),
                        isInputSwitch: this.isInputSwitch(action),
                        chainAfter: this.scheduleService.getChainAfter(action, scheduleActions),
                        chainBefore: [],
                        chainBeforeStartTime: null,
                    };
                }

                return this.toInvalidAction(action, scheduleActions);
            }
        );

        return {
            items,
        };
    }

    toInvalidAction(action: ScheduleAction, otherActions: ScheduleAction[]): InvalidAction {
        const chainBefore = this.scheduleService.getChainBefore(action, otherActions);
        const chainBeforeStartTime = this.scheduleService.getChainBeforeStartTime(chainBefore);
        return {
            type: "invalid",
            actionName: action?.ActionName ?? null,
            startTime: this.scheduleService.getStartTime(action),
            isInputSwitch: this.isInputSwitch(action),
            chainBefore,
            chainAfter: this.scheduleService.getChainAfter(action, otherActions),
            chainBeforeStartTime,
        };
    }

    public async deleteInvalidActions(channelId: string, remoteSchedule: RemoteSchedule): Promise<void> {
        const now = Date.now();
        const actionsToRemove = R.flatten(
            remoteSchedule.items
                .filter((action) => action.type === "invalid" && this.canRemoveInvalidAction(action, now))
                .map((action) => [
                    action.actionName,
                    ...(action.type === "invalid" ? action.chainAfter.map((x) => x.ActionName) : []),
                ])
        ).filter(ScheduleSyncService.notEmpty);
        await this.mediaLiveService.updateSchedule(channelId, actionsToRemove, []);
    }

    canRemoveInvalidAction(action: InvalidAction, now: number): boolean {
        const removalCutoffTime = add(now, { seconds: 20 }).getTime();
        const notInputSwitch = !action.isInputSwitch;
        const inFuture = !!action.startTime && action.startTime > removalCutoffTime;
        // If chainBeforeStartTime is null, implies a follow chain from an immediate action - not safe to attempt removal
        const inUnstartedChain = !!action.chainBeforeStartTime && action.chainBeforeStartTime > removalCutoffTime;
        return notInputSwitch || inFuture || inUnstartedChain;
    }

    isInputSwitch(action: ScheduleAction): boolean {
        return !!action.ScheduleActionSettings?.InputSwitchSettings;
    }

    isImmediateAction(action: ScheduleAction): boolean {
        return !!action.ScheduleActionStartSettings?.ImmediateModeScheduleActionStartSettings;
    }

    isPrerecordedAction(action: ScheduleAction): boolean {
        const isFixedStart = !!action.ScheduleActionStartSettings?.FixedModeScheduleActionStartSettings;
        const isPrerecordedInput = this.isPrerecordedInput(
            action.ScheduleActionSettings?.InputSwitchSettings?.InputAttachmentNameReference ?? ""
        );
        return isFixedStart && isPrerecordedInput;
    }

    parsePrerecordedAction(action: ScheduleAction, otherActions: ScheduleAction[]): RemoteScheduleAction | null {
        const event = this.parseActionName(action.ActionName ?? "");
        if (!event || event.type !== "event") {
            return null;
        }

        const actionName = action.ActionName;
        const startTime = action.ScheduleActionStartSettings?.FixedModeScheduleActionStartSettings?.Time
            ? Date.parse(action.ScheduleActionStartSettings?.FixedModeScheduleActionStartSettings.Time)
            : 0;
        const s3Key =
            action.ScheduleActionSettings?.InputSwitchSettings?.UrlPath?.length === 1
                ? action.ScheduleActionSettings.InputSwitchSettings.UrlPath[0]
                : null;

        if (!actionName || !startTime || !s3Key) {
            return null;
        }

        const remoteAction: RemoteScheduleAction = {
            type: "event",
            actionName,
            eventId: event.eventId,
            mode: "prerecorded",
            startTime,
            rtmpInputName: null,
            s3Key,
            chainAfter: this.scheduleService.getChainAfter(action, otherActions),
            chainBefore: [],
            chainBeforeStartTime: null,
        };

        return remoteAction;
    }

    isLiveAction(action: ScheduleAction): boolean {
        const isFixedStart = !!action.ScheduleActionStartSettings?.FixedModeScheduleActionStartSettings;

        const isLiveInput = this.isLiveInput(
            action.ScheduleActionSettings?.InputSwitchSettings?.InputAttachmentNameReference ?? ""
        );
        return isFixedStart && isLiveInput;
    }

    parseLiveAction(action: ScheduleAction, otherActions: ScheduleAction[]): RemoteScheduleAction | null {
        const event = this.parseActionName(action.ActionName ?? "");
        if (!event || event.type !== "event") {
            return null;
        }

        const actionName = action.ActionName;
        const startTime = this.scheduleService.getStartTime(action);
        const rtmpInputName = action.ScheduleActionSettings?.InputSwitchSettings?.InputAttachmentNameReference?.endsWith(
            "-rtmpA"
        )
            ? RtmpInput_Enum.RtmpA
            : action.ScheduleActionSettings?.InputSwitchSettings?.InputAttachmentNameReference?.endsWith("-rtmpB")
            ? RtmpInput_Enum.RtmpB
            : null;

        if (!actionName || !startTime || !rtmpInputName) {
            return null;
        }

        const remoteAction: RemoteScheduleAction = {
            type: "event",
            actionName,
            eventId: event.eventId,
            mode: "live",
            startTime,
            rtmpInputName,
            s3Key: null,
            chainAfter: this.scheduleService.getChainAfter(action, otherActions),
            chainBefore: [],
            chainBeforeStartTime: null,
        };

        return remoteAction;
    }

    isEventFollowAction(action: ScheduleAction): boolean {
        const isFollowStart = !!action.ScheduleActionStartSettings?.FollowModeScheduleActionStartSettings;
        const isLoopingInput = this.isLoopingInput(
            action.ScheduleActionSettings?.InputSwitchSettings?.InputAttachmentNameReference ?? ""
        );
        return isFollowStart && isLoopingInput;
    }

    parseEventFollowAction(action: ScheduleAction, otherActions: ScheduleAction[]): RemoteScheduleAction | null {
        const event = this.parseActionName(action.ActionName ?? "");
        if (!event || event.type !== "event-follow") {
            return null;
        }

        const actionName = action.ActionName;

        if (!actionName) {
            return null;
        }

        const chainBefore = this.scheduleService.getChainBefore(action, otherActions);
        const remoteAction: RemoteScheduleAction = {
            type: "event-follow",
            actionName,
            eventId: event.eventId,
            chainAfter: this.scheduleService.getChainAfter(action, otherActions),
            chainBefore,
            chainBeforeStartTime: this.scheduleService.getChainBeforeStartTime(chainBefore),
        };

        return remoteAction;
    }

    isPrerecordedInput(attachmentName: string): boolean {
        return attachmentName.endsWith("-mp4");
    }

    isLiveInput(attachmentName: string): boolean {
        return attachmentName.endsWith("-rtmpA") || attachmentName.endsWith("-rtmpB");
    }

    isLoopingInput(attachmentName: string): boolean {
        return attachmentName.endsWith("-looping");
    }

    parseActionName(actionName: string): ActionName | null {
        const parts = actionName.split("/");
        if (parts.length !== 2) {
            return null;
        }

        if (!validate(parts[1])) {
            return null;
        }

        if (parts[0] === "e") {
            return { type: "event", eventId: parts[1], actionName };
        }

        if (parts[0] === "ef") {
            return { type: "event-follow", eventId: parts[1], actionName };
        }

        if (parts[0] === "i") {
            return { type: "immediate", id: parts[1], actionName };
        }

        if (parts[0] === "m") {
            return { type: "manual", id: parts[1], actionName };
        }

        return null;
    }

    static notEmpty<TValue>(value: TValue | null | undefined): value is TValue {
        return value !== null && value !== undefined;
    }

    static isString(value: string | any): value is string {
        return typeof value === "string";
    }
}

type ActionName =
    | { type: "event"; eventId: string; actionName: string }
    | { type: "manual"; id: string; actionName: string }
    | { type: "immediate"; id: string; actionName: string }
    | { type: "event-follow"; eventId: string; actionName: string };

interface RemoteSchedule {
    items: RemoteScheduleAction[];
}

type RemoteScheduleAction = EventAction | EventFollowAction | ManualAction | ImmediateAction | InvalidAction;

interface ActionChain {
    /**
     * List of schedule actions that precede this action in a follow chain.
     */
    chainBefore: ScheduleAction[];
    /**
     * List of schedule actions that succeed this action in a follow chain.
     */
    chainAfter: ScheduleAction[];
    /**
     * If the preceding chain has a fixed start time, the start time. Else null implies an immediate start.
     */
    chainBeforeStartTime: number | null;
}

type EventAction = {
    type: "event";
    actionName: string;
    eventId: string;
    mode: "prerecorded" | "live";
    rtmpInputName: RtmpInput_Enum | null;
    s3Key: string | null;
    startTime: number;
} & ActionChain;

type ManualAction = {
    type: "manual";
    actionName: string;
    id: string;
    startTime: number | null;
    isInputSwitch: boolean;
} & ActionChain;

type ImmediateAction = {
    type: "immediate";
    actionName: string;
    id: string;
    startTime: number | null;
    isInputSwitch: boolean;
} & ActionChain;

type InvalidAction = {
    type: "invalid";
    actionName: string | null;
    startTime: number | null;
    isInputSwitch: boolean;
} & ActionChain;

type EventFollowAction = {
    type: "event-follow";
    actionName: string;
    eventId: string;
} & ActionChain;
