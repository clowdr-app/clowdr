import { gql } from "@apollo/client/core";
import {
    ContentBaseType,
    ContentItemDataBlob,
    ContentType_Enum,
    isContentItemDataBlob,
    VideoBroadcastBlob,
} from "@clowdr-app/shared-types/build/content";
import { Bunyan, RootLogger } from "@eropple/nestjs-bunyan";
import { Injectable } from "@nestjs/common";
import { add } from "date-fns";
import * as R from "ramda";
import {
    RoomMode_Enum,
    RtmpInput_Enum,
    ScheduleService_GetRoomsWithLiveEventsDocument,
    ScheduleService_GetScheduleDocument,
    ScheduleService_UpdateRtmpInputsDocument,
} from "../../generated/graphql";
import { GraphQlService } from "../graphql/graphql.service";

export interface Schedule {
    roomId: string;
    items: {
        eventId: string;
        roomModeName: RoomMode_Enum;
        rtmpInputName: RtmpInput_Enum | null;
        videoData: VideoBroadcastBlob | null;
        startTime: number;
        endTime: number;
    }[];
}

@Injectable()
export class ScheduleService {
    private logger: Bunyan;

    constructor(@RootLogger() logger: Bunyan, private graphQlService: GraphQlService) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    public async getRoomsWithLiveEvents(): Promise<string[]> {
        gql`
            query ScheduleService_GetRoomsWithLiveEvents($now: timestamptz!) {
                Room(
                    where: {
                        events: { intendedRoomModeName: { _in: [PRESENTATION, Q_AND_A] }, endTime: { _gt: $now } }
                    }
                ) {
                    id
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.query({
            query: ScheduleService_GetRoomsWithLiveEventsDocument,
            variables: {
                now: new Date().toISOString(),
            },
        });
        return result.data.Room.map((room) => room.id);
    }

    public async getScheduleData(roomId: string): Promise<Schedule> {
        gql`
            query ScheduleService_GetSchedule($roomId: uuid!, $now: timestamptz!, $cutoff: timestamptz!) {
                Event(where: { roomId: { _eq: $roomId }, endTime: { _gte: $now, _lt: $cutoff } }) {
                    id
                    contentGroup {
                        id
                        contentItems(
                            where: { contentTypeName: { _eq: VIDEO_BROADCAST } }
                            limit: 1
                            order_by: { createdAt: desc_nulls_last }
                        ) {
                            id
                            data
                        }
                    }
                    endTime
                    startTime
                    eventVonageSession {
                        id
                        rtmpInputName
                    }
                    intendedRoomModeName
                }
            }
        `;

        const now = new Date().toISOString();
        const cutoff = add(Date.now(), { days: 1 }).toISOString();

        const scheduleResult = await this.graphQlService.apolloClient.query({
            query: ScheduleService_GetScheduleDocument,
            variables: {
                roomId,
                now,
                cutoff,
            },
        });

        const scheduleItems = scheduleResult.data.Event.map((event) => {
            const videoData = event.contentGroup?.contentItems.length
                ? this.getLatestBroadcastVideoData(event.contentGroup.contentItems[0])
                : null;

            const rtmpInputName = event.eventVonageSession?.rtmpInputName ?? null;

            if (!event.eventVonageSession && this.isLive(event.intendedRoomModeName)) {
                this.logger.warn({ eventId: event.id }, "Live event is missing a Vonage session");
            }

            return {
                eventId: event.id,
                rtmpInputName,
                roomModeName: event.intendedRoomModeName,
                videoData,
                startTime: Date.parse(event.startTime),
                endTime: Date.parse(event.endTime ?? event.startTime),
            };
        });

        return {
            roomId,
            items: scheduleItems,
        };
    }

    isLive(roomMode: RoomMode_Enum): boolean {
        return [RoomMode_Enum.QAndA, RoomMode_Enum.Presentation].includes(roomMode);
    }

    getLatestBroadcastVideoData(contentItemData: unknown): VideoBroadcastBlob | null {
        if (!isContentItemDataBlob(contentItemData)) {
            return null;
        }
        const contentItemDataBlob: ContentItemDataBlob = contentItemData as any;

        const latestVersion = R.last(contentItemDataBlob);

        if (!latestVersion) {
            return null;
        }

        if (
            latestVersion.data.baseType === ContentBaseType.Video &&
            latestVersion.data.type === ContentType_Enum.VideoBroadcast
        ) {
            return latestVersion.data;
        }

        return null;
    }

    public async ensureRtmpInputsAlternate(scheduleData: Schedule): Promise<Schedule> {
        const liveEvents = scheduleData.items
            .filter((item) => this.isLive(item.roomModeName))
            .filter((item) => item.startTime > add(Date.now(), { seconds: 30 }).getTime())
            .sort((a, b) => a.startTime - b.startTime);

        if (liveEvents.length === 0) {
            return scheduleData;
        }

        const evenEvents = liveEvents.filter((_, index) => index % 2 === 0);
        const oddEvents = liveEvents.filter((_, index) => index % 2 === 1);

        const groupedEvenEvents = R.groupBy((e) => e.rtmpInputName ?? "none", evenEvents);
        const groupedOddEvents = R.groupBy((e) => e.rtmpInputName ?? "none", oddEvents);

        const allEvenAreA = groupedEvenEvents[RtmpInput_Enum.RtmpA]?.length === evenEvents.length;
        const allEvenAreB = groupedEvenEvents[RtmpInput_Enum.RtmpB]?.length === evenEvents.length;
        const allOddAreA = groupedOddEvents[RtmpInput_Enum.RtmpA]?.length === oddEvents.length;
        const allOddAreB = groupedOddEvents[RtmpInput_Enum.RtmpB]?.length === oddEvents.length;

        // If the inputs already alternate correctly, we can no-op.
        if ((allEvenAreA && allOddAreB) || (allEvenAreB && allOddAreA)) {
            return scheduleData;
        }

        const evenInput = liveEvents[0].rtmpInputName ?? RtmpInput_Enum.RtmpA;
        const oddInput = evenInput === RtmpInput_Enum.RtmpA ? RtmpInput_Enum.RtmpB : RtmpInput_Enum.RtmpA;

        this.logger.info({ roomId: scheduleData.roomId }, "Updating selected RTMP inputs for events.");
        gql`
            mutation ScheduleService_UpdateRtmpInputs(
                $evenIds: [uuid!]!
                $oddIds: [uuid!]!
                $evenInput: RtmpInput_enum!
                $oddInput: RtmpInput_enum!
            ) {
                update_EvenEventVonageSessions: update_EventVonageSession(
                    where: { eventId: { _in: $evenIds } }
                    _set: { rtmpInputName: $evenInput }
                ) {
                    affected_rows
                }
                update_OddEventVonageSessions: update_EventVonageSession(
                    where: { eventId: { _in: $oddIds } }
                    _set: { rtmpInputName: $oddInput }
                ) {
                    affected_rows
                }
            }
        `;
        await this.graphQlService.apolloClient.mutate({
            mutation: ScheduleService_UpdateRtmpInputsDocument,
            variables: {
                evenIds: evenEvents.map((event) => event.eventId),
                evenInput,
                oddIds: oddEvents.map((event) => event.eventId),
                oddInput,
            },
        });

        const newItems = scheduleData.items.map((item) => {
            if (evenEvents.find((e) => e.eventId === item.eventId)) {
                item.rtmpInputName = evenInput;
                return item;
            }
            if (oddEvents.find((e) => e.eventId === item.eventId)) {
                item.rtmpInputName = oddInput;
                return item;
            }
            return item;
        });

        scheduleData.items = newItems;

        return scheduleData;
    }
}
