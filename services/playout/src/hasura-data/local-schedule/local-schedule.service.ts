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
import { add, addHours, addMinutes } from "date-fns";
import * as R from "ramda";
import {
    LocalSchedule_GetRoomsWithEventsStartingDocument,
    LocalSchedule_GetRoomsWithoutEventsDocument,
    RoomMode_Enum,
    RtmpInput_Enum,
    ScheduleService_GetRoomsWithBroadcastEventsDocument,
    ScheduleService_GetScheduleDocument,
    ScheduleService_UpdateRtmpInputsDocument,
} from "../../generated/graphql";
import { GraphQlService } from "../graphql/graphql.service";

export interface LocalSchedule {
    roomId: string;
    items: LocalScheduleAction[];
}

export interface LocalScheduleAction {
    eventId: string;
    roomModeName: RoomMode_Enum;
    rtmpInputName: RtmpInput_Enum | null;
    videoData: VideoBroadcastBlob | null;
    startTime: number;
    endTime: number;
}

@Injectable()
export class LocalScheduleService {
    private logger: Bunyan;

    constructor(@RootLogger() logger: Bunyan, private graphQlService: GraphQlService) {
        this.logger = logger.child({ component: this.constructor.name });
    }

    public async getRoomsWithBroadcastEvents(): Promise<string[]> {
        gql`
            query ScheduleService_GetRoomsWithBroadcastEvents($now: timestamptz!) {
                room_Room(
                    where: {
                        events: {
                            intendedRoomModeName: { _in: [PRESENTATION, Q_AND_A, PRERECORDED] }
                            endTime: { _gt: $now }
                        }
                    }
                ) {
                    id
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.query({
            query: ScheduleService_GetRoomsWithBroadcastEventsDocument,
            variables: {
                now: new Date().toISOString(),
            },
        });
        return result.data.room_Room.map((room) => room.id);
    }

    public async getScheduleData(roomId: string): Promise<LocalSchedule> {
        gql`
            query ScheduleService_GetSchedule($roomId: uuid!, $now: timestamptz!, $cutoff: timestamptz!) {
                schedule_Event(where: { roomId: { _eq: $roomId }, endTime: { _gte: $now, _lt: $cutoff } }) {
                    id
                    item {
                        id
                        elements(
                            where: { typeName: { _eq: VIDEO_BROADCAST } }
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
                ? this.getLatestBroadcastVideoData(event.contentGroup.contentItems[0].data)
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

    public async ensureRtmpInputsAlternate(scheduleData: LocalSchedule): Promise<LocalSchedule> {
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
                $evenInput: video_RtmpInput_enum!
                $oddInput: video_RtmpInput_enum!
            ) {
                update_EvenEventVonageSessions: update_video_EventVonageSession(
                    where: { eventId: { _in: $evenIds } }
                    _set: { rtmpInputName: $evenInput }
                ) {
                    affected_rows
                }
                update_OddEventVonageSessions: update_video_EventVonageSession(
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

    public async getRoomsWithCurrentOrUpcomingEvents(): Promise<Room[]> {
        const now = new Date();
        const from = now.toISOString();
        const to = addMinutes(now, 30).toISOString();

        gql`
            query LocalSchedule_GetRoomsWithEventsStarting($from: timestamptz, $to: timestamptz) {
                room_Room(
                    where: {
                        events: {
                            _or: [{ startTime: { _gte: $from, _lte: $to } }, { endTime: { _gte: $from, _lte: $to } }]
                            intendedRoomModeName: { _in: [PRERECORDED, Q_AND_A, PRESENTATION] }
                        }
                    }
                ) {
                    id
                    conferenceId
                    mediaLiveChannel {
                        id
                        mediaLiveChannelId
                    }
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.query({
            query: LocalSchedule_GetRoomsWithEventsStartingDocument,
            variables: {
                from,
                to,
            },
        });

        return result.data.room_Room.map((room) => ({
            roomId: room.id,
            conferenceId: room.conferenceId,
            channelStackId: room.mediaLiveChannel?.id ?? null,
            mediaLiveChannelId: room.mediaLiveChannel?.mediaLiveChannelId ?? null,
        }));
    }

    public async getRoomsWithoutCurrentOrUpcomingEvents(): Promise<Room[]> {
        const now = new Date();
        const from = now.toISOString();
        const to = addHours(now, 2).toISOString();

        gql`
            query LocalSchedule_GetRoomsWithoutEvents($from: timestamptz, $to: timestamptz) {
                room_Room(
                    where: {
                        _and: [
                            { _not: { events: { startTime: { _gte: $from, _lte: $to } } } }
                            { _not: { events: { startTime: { _lte: $from }, endTime: { _gte: $from } } } }
                            { mediaLiveChannel: {} }
                        ]
                    }
                ) {
                    id
                    conferenceId
                    mediaLiveChannel {
                        id
                        mediaLiveChannelId
                    }
                }
            }
        `;

        const result = await this.graphQlService.apolloClient.query({
            query: LocalSchedule_GetRoomsWithoutEventsDocument,
            variables: {
                from,
                to,
            },
        });

        return result.data.room_Room.map((room) => ({
            roomId: room.id,
            conferenceId: room.conferenceId,
            channelStackId: room.mediaLiveChannel?.id ?? null,
            mediaLiveChannelId: room.mediaLiveChannel?.mediaLiveChannelId ?? null,
        }));
    }
}

export interface Room {
    roomId: string;
    conferenceId: string;
    channelStackId: string | null;
    mediaLiveChannelId: string | null;
}
