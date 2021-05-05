import { ScheduleAction } from "@aws-sdk/client-medialive";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan";
import { Injectable } from "@nestjs/common";
import { validate } from "uuid";
import { MediaLiveService } from "../../aws/medialive/medialive.service";
import { Video_RtmpInput_Enum } from "../../generated/graphql";

@Injectable()
export class RemoteScheduleService {
    private logger: Bunyan;

    constructor(@RootLogger() logger: Bunyan, private mediaLiveService: MediaLiveService) {
        this.logger = logger.child({ component: this.constructor.name });
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
                    const chainBefore = this.getChainBefore(action, scheduleActions);
                    return {
                        type: "manual",
                        actionName: actionName.actionName,
                        id: actionName.id,
                        startTime: this.getStartTime(action),
                        isInputSwitch: this.isInputSwitch(action),
                        chainAfter: this.getChainAfter(action, scheduleActions),
                        chainBefore,
                        chainBeforeStartTime: this.getChainBeforeStartTime(chainBefore),
                    };
                }

                if (actionName?.type === "immediate" && this.isImmediateAction(action)) {
                    return {
                        type: "immediate",
                        actionName: actionName.actionName,
                        id: actionName.id,
                        startTime: this.getStartTime(action),
                        isInputSwitch: this.isInputSwitch(action),
                        chainAfter: this.getChainAfter(action, scheduleActions),
                        chainBefore: [],
                        chainBeforeStartTime: null,
                    };
                }

                return this.toInvalidAction(action, scheduleActions);
            }
        );

        return {
            items,
            rawActions: scheduleActions,
        };
    }

    toInvalidAction(action: ScheduleAction, otherActions: ScheduleAction[]): InvalidAction {
        const chainBefore = this.getChainBefore(action, otherActions);
        const chainBeforeStartTime = this.getChainBeforeStartTime(chainBefore);
        return {
            type: "invalid",
            actionName: action?.ActionName ?? null,
            startTime: this.getStartTime(action),
            isInputSwitch: this.isInputSwitch(action),
            chainBefore,
            chainAfter: this.getChainAfter(action, otherActions),
            chainBeforeStartTime,
        };
    }

    public getChainBefore(action: ScheduleAction, otherActions: ScheduleAction[]): ScheduleAction[] {
        const chain: ScheduleAction[] = [];
        let precedingAction = this.precedingAction(action, otherActions);
        while (precedingAction) {
            chain.push(precedingAction);
            precedingAction = this.precedingAction(precedingAction, otherActions);
        }
        return chain;
    }

    public getChainBeforeStartTime(chain: ScheduleAction[]): number | null {
        const maxChainBeforeStartTime = Math.max(...chain.map((item) => this.getStartTime(item) ?? 0));
        const chainBeforeStartTime = maxChainBeforeStartTime === 0 ? null : maxChainBeforeStartTime;
        return chainBeforeStartTime;
    }

    public getChainAfter(action: ScheduleAction, otherActions: ScheduleAction[]): ScheduleAction[] {
        const chain: ScheduleAction[] = [];
        let succeedingAction = this.succeedingAction(action, otherActions);
        while (succeedingAction) {
            chain.push(succeedingAction);
            succeedingAction = this.succeedingAction(succeedingAction, otherActions);
        }
        return chain;
    }

    public precedingAction(action: ScheduleAction, otherActions: ScheduleAction[]): ScheduleAction | null {
        const actionName =
            action.ScheduleActionStartSettings?.FollowModeScheduleActionStartSettings?.ReferenceActionName;

        if (!actionName) {
            return null;
        }

        const precedingAction = otherActions.find((item) => item.ActionName === actionName);
        return precedingAction ?? null;
    }

    public succeedingAction(action: ScheduleAction, otherActions: ScheduleAction[]): ScheduleAction | null {
        const succeedingAction = otherActions.find(
            (item) =>
                action.ActionName &&
                item.ScheduleActionStartSettings?.FollowModeScheduleActionStartSettings?.ReferenceActionName ===
                    action.ActionName
        );
        return succeedingAction ?? null;
    }

    public getStartTime(action: ScheduleAction): number | null {
        return action.ScheduleActionStartSettings?.FixedModeScheduleActionStartSettings?.Time
            ? Date.parse(action.ScheduleActionStartSettings?.FixedModeScheduleActionStartSettings.Time)
            : null;
    }

    public getFollowReference(action: ScheduleAction): string | null {
        return action.ScheduleActionStartSettings?.FollowModeScheduleActionStartSettings?.ReferenceActionName ?? null;
    }

    public isInputSwitch(action: ScheduleAction): boolean {
        return !!action.ScheduleActionSettings?.InputSwitchSettings;
    }

    public isImmediateAction(action: ScheduleAction): boolean {
        return !!action.ScheduleActionStartSettings?.ImmediateModeScheduleActionStartSettings;
    }

    public isPrerecordedAction(action: ScheduleAction): boolean {
        const isFixedStart = !!action.ScheduleActionStartSettings?.FixedModeScheduleActionStartSettings;
        const isPrerecordedInput = this.isPrerecordedInput(
            action.ScheduleActionSettings?.InputSwitchSettings?.InputAttachmentNameReference ?? ""
        );
        return isFixedStart && isPrerecordedInput;
    }

    public parsePrerecordedAction(action: ScheduleAction, otherActions: ScheduleAction[]): RemoteScheduleAction | null {
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
            chainAfter: this.getChainAfter(action, otherActions),
            chainBefore: [],
            chainBeforeStartTime: null,
        };

        return remoteAction;
    }

    public isLiveAction(action: ScheduleAction): boolean {
        const isFixedStart = !!action.ScheduleActionStartSettings?.FixedModeScheduleActionStartSettings;

        const isLiveInput = this.isLiveInput(
            action.ScheduleActionSettings?.InputSwitchSettings?.InputAttachmentNameReference ?? ""
        );
        return isFixedStart && isLiveInput;
    }

    public parseLiveAction(action: ScheduleAction, otherActions: ScheduleAction[]): RemoteScheduleAction | null {
        const event = this.parseActionName(action.ActionName ?? "");
        if (!event || event.type !== "event") {
            return null;
        }

        const actionName = action.ActionName;
        const startTime = this.getStartTime(action);
        const rtmpInputName = action.ScheduleActionSettings?.InputSwitchSettings?.InputAttachmentNameReference?.endsWith(
            "-rtmpA"
        )
            ? Video_RtmpInput_Enum.RtmpA
            : action.ScheduleActionSettings?.InputSwitchSettings?.InputAttachmentNameReference?.endsWith("-rtmpB")
            ? Video_RtmpInput_Enum.RtmpB
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
            chainAfter: this.getChainAfter(action, otherActions),
            chainBefore: [],
            chainBeforeStartTime: null,
        };

        return remoteAction;
    }

    public isEventFollowAction(action: ScheduleAction): boolean {
        const isFollowStart = !!action.ScheduleActionStartSettings?.FollowModeScheduleActionStartSettings;
        const isLoopingInput = this.isLoopingInput(
            action.ScheduleActionSettings?.InputSwitchSettings?.InputAttachmentNameReference ?? ""
        );
        return isFollowStart && isLoopingInput;
    }

    public parseEventFollowAction(action: ScheduleAction, otherActions: ScheduleAction[]): RemoteScheduleAction | null {
        const event = this.parseActionName(action.ActionName ?? "");
        if (!event || event.type !== "event-follow") {
            return null;
        }

        const actionName = action.ActionName;

        if (!actionName) {
            return null;
        }

        const chainBefore = this.getChainBefore(action, otherActions);
        const remoteAction: RemoteScheduleAction = {
            type: "event-follow",
            actionName,
            eventId: event.eventId,
            chainAfter: this.getChainAfter(action, otherActions),
            chainBefore,
            chainBeforeStartTime: this.getChainBeforeStartTime(chainBefore),
        };

        return remoteAction;
    }

    public isPrerecordedInput(attachmentName: string): boolean {
        return attachmentName.endsWith("-mp4");
    }

    public isLiveInput(attachmentName: string): boolean {
        return attachmentName.endsWith("-rtmpA") || attachmentName.endsWith("-rtmpB");
    }

    public isLoopingInput(attachmentName: string): boolean {
        return attachmentName.endsWith("-looping");
    }

    public parseActionName(actionName: string): ActionName | null {
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
}

type ActionName =
    | { type: "event"; eventId: string; actionName: string }
    | { type: "manual"; id: string; actionName: string }
    | { type: "immediate"; id: string; actionName: string }
    | { type: "event-follow"; eventId: string; actionName: string };

export interface RemoteSchedule {
    items: RemoteScheduleAction[];
    rawActions: ScheduleAction[];
}

export type RemoteScheduleAction = EventAction | EventFollowAction | ManualAction | ImmediateAction | InvalidAction;

export interface ActionChain {
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

export type EventAction = {
    type: "event";
    actionName: string;
    eventId: string;
    mode: "prerecorded" | "live";
    rtmpInputName: Video_RtmpInput_Enum | null;
    s3Key: string | null;
    startTime: number;
} & ActionChain;

export type ManualAction = {
    type: "manual";
    actionName: string;
    id: string;
    startTime: number | null;
    isInputSwitch: boolean;
} & ActionChain;

export type ImmediateAction = {
    type: "immediate";
    actionName: string;
    id: string;
    startTime: number | null;
    isInputSwitch: boolean;
} & ActionChain;

export type InvalidAction = {
    type: "invalid";
    actionName: string | null;
    startTime: number | null;
    isInputSwitch: boolean;
} & ActionChain;

export type EventFollowAction = {
    type: "event-follow";
    actionName: string;
    eventId: string;
} & ActionChain;
