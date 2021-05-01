import { ScheduleAction } from "@aws-sdk/client-medialive";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan/dist";
import { add } from "date-fns";
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
            await this.removeInvalidActions(channelDetails.mediaLiveChannelId, remoteSchedule);
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
        return;
    }

    public actionsMatch(localAction: LocalScheduleAction, remoteAction: RemoteScheduleAction): boolean {
        return false;
    }

    public async getRemoteSchedule(mediaLiveChannelId: string): Promise<RemoteSchedule> {
        const scheduleActions = await this.mediaLiveService.describeSchedule(mediaLiveChannelId);

        const items = scheduleActions.map(
            (action): RemoteScheduleAction => {
                const actionName = this.parseActionName(action.ActionName ?? "");

                if (actionName?.type === "event") {
                    if (this.isPrerecordedAction(action)) {
                        const prerecordedAction = this.parsePrerecordedAction(action);
                        return (
                            prerecordedAction ?? {
                                type: "invalid",
                                actionName: actionName.actionName,
                                startTime: this.getStartTime(action),
                                isInputSwitch: this.isInputSwitch(action),
                            }
                        );
                    }
                    if (this.isLiveAction(action)) {
                        const liveAction = this.parseLiveAction(action);
                        return (
                            liveAction ?? {
                                type: "invalid",
                                actionName: actionName.actionName,
                                startTime: this.getStartTime(action),
                                isInputSwitch: this.isInputSwitch(action),
                            }
                        );
                    }
                }

                if (actionName?.type === "manual") {
                    return {
                        type: "manual",
                        actionName: actionName.actionName,
                        id: actionName.id,
                        startTime: this.getStartTime(action),
                        isInputSwitch: this.isInputSwitch(action),
                    };
                }

                if (actionName?.type === "immediate" && this.isImmediateAction(action)) {
                    return {
                        type: "immediate",
                        actionName: actionName.actionName,
                        id: actionName.id,
                        startTime: this.getStartTime(action),
                        isInputSwitch: this.isInputSwitch(action),
                    };
                }

                return {
                    type: "invalid",
                    actionName: actionName?.actionName ?? null,
                    startTime: this.getStartTime(action),
                    isInputSwitch: this.isInputSwitch(action),
                };
            }
        );

        return {
            items,
        };
    }

    public async removeInvalidActions(channelId: string, remoteSchedule: RemoteSchedule): Promise<void> {
        const now = Date.now();
        const actionsToRemove = remoteSchedule.items
            .filter((action) => action.type === "invalid" && this.canRemoveInvalidAction(action, now))
            .map((item) => item.actionName)
            .filter(ScheduleSyncService.notEmpty);
        await this.mediaLiveService.updateSchedule(channelId, actionsToRemove, []);
    }

    canRemoveInvalidAction(action: InvalidAction, now: number): boolean {
        const removalCutoffTime = add(now, { seconds: 20 }).getTime();
        const notInputSwitch = !action.isInputSwitch;
        const inFuture = !!action.startTime && action.startTime > removalCutoffTime;
        return notInputSwitch || inFuture;
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

    parsePrerecordedAction(action: ScheduleAction): RemoteScheduleAction | null {
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

    parseLiveAction(action: ScheduleAction): RemoteScheduleAction | null {
        const event = this.parseActionName(action.ActionName ?? "");
        if (!event || event.type !== "event") {
            return null;
        }

        const actionName = action.ActionName;
        const startTime = this.getStartTime(action);
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
        };

        return remoteAction;
    }

    isPrerecordedInput(attachmentName: string): boolean {
        return attachmentName.endsWith("-mp4");
    }

    isLiveInput(attachmentName: string): boolean {
        return attachmentName.endsWith("-rtmpA") || attachmentName.endsWith("-rtmpB");
    }

    getStartTime(action: ScheduleAction): number | null {
        return action.ScheduleActionStartSettings?.FixedModeScheduleActionStartSettings?.Time
            ? Date.parse(action.ScheduleActionStartSettings?.FixedModeScheduleActionStartSettings.Time)
            : null;
    }

    parseActionName(actionName: string): ActionName | null {
        const parts = actionName.split("/");
        if (parts.length !== 3) {
            return null;
        }

        if (!validate(parts[1])) {
            return null;
        }

        if (!parts[2].match(/^\d+$/)) {
            return null;
        }

        if (parts[0] === "e") {
            return { type: "event", eventId: parts[1], number: Number.parseInt(parts[2]), actionName };
        }

        if (parts[0] === "i") {
            return { type: "immediate", id: parts[1], number: Number.parseInt(parts[2]), actionName };
        }

        if (parts[0] === "m") {
            return { type: "manual", id: parts[1], number: Number.parseInt(parts[2]), actionName };
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
    | { type: "event"; eventId: string; number: number; actionName: string }
    | { type: "manual"; id: string; number: number; actionName: string }
    | { type: "immediate"; id: string; number: number; actionName: string };

interface RemoteSchedule {
    items: RemoteScheduleAction[];
}

type RemoteScheduleAction = EventAction | ManualAction | ImmediateAction | InvalidAction;

interface EventAction {
    type: "event";
    actionName: string;
    eventId: string;
    mode: "prerecorded" | "live";
    rtmpInputName: RtmpInput_Enum | null;
    s3Key: string | null;
    startTime: number;
}

interface ManualAction {
    type: "manual";
    actionName: string;
    id: string;
    startTime: number | null;
    isInputSwitch: boolean;
}

interface ImmediateAction {
    type: "immediate";
    actionName: string;
    id: string;
    startTime: number | null;
    isInputSwitch: boolean;
}

interface InvalidAction {
    type: "invalid";
    actionName: string | null;
    startTime: number | null;
    isInputSwitch: boolean;
}
