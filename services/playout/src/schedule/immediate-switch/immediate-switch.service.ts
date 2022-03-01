import type { ScheduleAction } from "@aws-sdk/client-medialive";
import { FollowPoint } from "@aws-sdk/client-medialive";
import type { Bunyan } from "@eropple/nestjs-bunyan/dist";
import { RootLogger } from "@eropple/nestjs-bunyan/dist";
import { ImmediateSwitchData } from "@midspace/shared-types/video/immediateSwitchData";
import { plainToClass } from "class-transformer";
import { validate } from "class-validator";
import { sub } from "date-fns";
import { MediaLiveService } from "../../aws/medialive/medialive.service";
import { Video_RtmpInput_Enum } from "../../generated/graphql";
import { ChannelStackDataService } from "../../hasura-data/channel-stack/channel-stack.service";
import { ContentElementDataService } from "../../hasura-data/content/content-element.service";
import { ImmediateSwitchDataService } from "../../hasura-data/immediate-switch/immediate-switch.service";
import { ChannelStack, LocalScheduleService } from "../../hasura-data/local-schedule/local-schedule.service";

export class ImmediateSwitchService {
    private readonly logger: Bunyan;
    constructor(
        @RootLogger() logger: Bunyan,
        private mediaLiveService: MediaLiveService,
        private channelStackDataService: ChannelStackDataService,
        private localScheduleService: LocalScheduleService,
        private contentElementDataService: ContentElementDataService,
        private immediateSwitchDataService: ImmediateSwitchDataService
    ) {
        this.logger = logger.child({ component: this.constructor.name });
    }
    public async handleImmediateSwitch(data: unknown, id: string, eventId: string | null): Promise<void> {
        try {
            const transformed = plainToClass(ImmediateSwitchData, { data });
            const errors = await validate(transformed);
            if (errors.length > 1) {
                this.logger.error({ errors }, "Immediate switch data is invalid");
                await this.immediateSwitchDataService.failImmediateSwitch(id, "Invalid request");
                return;
            } else {
                this.logger.info({ request: transformed }, "Received valid immediate switch request");

                if (eventId) {
                    const event = await this.localScheduleService.getEvent(eventId);
                    const now = Date.now();

                    if (!event) {
                        this.logger.warn(
                            { eventId },
                            "Event associated with immediate switch request does not exist, ignoring"
                        );
                        await this.immediateSwitchDataService.failImmediateSwitch(id, "Event not found");
                        return;
                    }

                    if (now <= event.startTime) {
                        this.logger.warn(
                            { event, now },
                            "Immediate switch request made before start of event, ignoring"
                        );
                        await this.immediateSwitchDataService.failImmediateSwitch(id, "Event has not yet started");
                        return;
                    }

                    if (now > sub(event.endTime, { seconds: 20 }).getTime()) {
                        this.logger.warn(
                            { event, now },
                            "Immediate switch request made too close to or after end of event, ignoring"
                        );
                        await this.immediateSwitchDataService.failImmediateSwitch(id, "Too close to end of event");
                        return;
                    }

                    if (!event.channelStack) {
                        this.logger.warn(
                            { event },
                            "No channel stack exists for event, cannot perform immediate switch"
                        );
                        await this.immediateSwitchDataService.failImmediateSwitch(id, "No stream exists");
                        return;
                    }

                    const inputSwitchActions = await this.toInputSwitchActions(
                        transformed,
                        event.channelStack,
                        event.eventRtmpInputName,
                        id,
                        event.conferenceId
                    );

                    if (typeof inputSwitchActions === "string") {
                        this.logger.warn({ event, inputSwitchActions }, "Failed to generate immediate switch actions");
                        await this.immediateSwitchDataService.failImmediateSwitch(id, inputSwitchActions);
                        return;
                    }

                    await this.mediaLiveService.updateSchedule(
                        event.channelStack.mediaLiveChannelId,
                        [],
                        inputSwitchActions
                    );

                    await this.immediateSwitchDataService.completeImmediateSwitch(id);
                } else {
                    this.logger.warn(
                        { request: transformed },
                        "Immediate switches are not yet supported outside an event."
                    );
                    await this.immediateSwitchDataService.failImmediateSwitch(id, "Currently outside an event");
                }
            }
        } catch (err) {
            await this.immediateSwitchDataService.failImmediateSwitch(id, "Processing error");
            throw err;
        }
    }

    async toInputSwitchActions(
        switchData: ImmediateSwitchData,
        channelStack: ChannelStack,
        eventRtmpInputName: string | null,
        immediateSwitchId: string,
        conferenceId: string
    ): Promise<ScheduleAction[] | string> {
        switch (switchData.data.kind) {
            case "filler": {
                const fillerVideoKey = (await this.channelStackDataService.getFillerVideoKey(conferenceId)) ?? "";
                return [
                    {
                        ActionName: `i/${immediateSwitchId}`,
                        ScheduleActionSettings: {
                            InputSwitchSettings: {
                                InputAttachmentNameReference: channelStack.loopingMp4InputAttachmentName,
                                UrlPath: [fillerVideoKey],
                            },
                        },
                        ScheduleActionStartSettings: {
                            ImmediateModeScheduleActionStartSettings: {},
                        },
                    },
                ];
            }
            case "video": {
                const element = await this.contentElementDataService.getElement(switchData.data.elementId);
                if (!element || element.conferenceId !== conferenceId) {
                    this.logger.warn(
                        { switchData, element, conferenceId },
                        "Retrieved content element belongs to a different conference, skipping"
                    );
                    return "Element belongs to another conference";
                }
                const broadcastVideoData = this.contentElementDataService.getLatestVideoData(element.data);
                if (!broadcastVideoData) {
                    this.logger.warn(
                        { switchData, element, conferenceId, broadcastVideoData },
                        "Could not find latest video broadcast data in element"
                    );
                    return "Could not find video data";
                }
                const videoKey = this.contentElementDataService.getVideoKey(broadcastVideoData);
                if (!videoKey) {
                    this.logger.warn(
                        { switchData, element, conferenceId, broadcastVideoData },
                        "Could not retrieve video key from video broadcast data"
                    );
                    return "Could not find video file";
                }
                return [
                    {
                        ActionName: `i/${immediateSwitchId}`,
                        ScheduleActionSettings: {
                            InputSwitchSettings: {
                                InputAttachmentNameReference: channelStack.mp4InputAttachmentName,
                                UrlPath: [videoKey],
                            },
                        },
                        ScheduleActionStartSettings: {
                            ImmediateModeScheduleActionStartSettings: {},
                        },
                    },
                    {
                        ActionName: `i/${immediateSwitchId}/f`,
                        ScheduleActionSettings: {
                            InputSwitchSettings: {
                                InputAttachmentNameReference:
                                    eventRtmpInputName === Video_RtmpInput_Enum.RtmpB
                                        ? channelStack.rtmpBInputAttachmentName
                                        : channelStack.rtmpAInputAttachmentName,
                            },
                        },
                        ScheduleActionStartSettings: {
                            FollowModeScheduleActionStartSettings: {
                                FollowPoint: FollowPoint.END,
                                ReferenceActionName: `i/${immediateSwitchId}`,
                            },
                        },
                    },
                ];
            }
            case "rtmp_push":
                return [
                    {
                        ActionName: `i/${immediateSwitchId}`,
                        ScheduleActionSettings: {
                            InputSwitchSettings: {
                                InputAttachmentNameReference:
                                    eventRtmpInputName === Video_RtmpInput_Enum.RtmpB
                                        ? channelStack.rtmpBInputAttachmentName
                                        : channelStack.rtmpAInputAttachmentName,
                            },
                        },
                        ScheduleActionStartSettings: {
                            ImmediateModeScheduleActionStartSettings: {},
                        },
                    },
                ];
        }
    }
}
