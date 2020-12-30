import type { SelectWholeScheduleQuery } from "../../../../generated/graphql";
import { convertContentGroupToDescriptor } from "../Content/Functions";
import type { ContentGroupDescriptor } from "../Content/Types";
import type { OriginatingDataDescriptor, OriginatingDataPart, TagDescriptor } from "../Shared/Types";
import type { EventDescriptor, EventPersonDescriptor, RoomDescriptor } from "./Types";

export function convertScheduleToDescriptors(
    schedule: SelectWholeScheduleQuery
): {
    rooms: Map<string, RoomDescriptor>;
    events: Map<string, EventDescriptor>;
    tags: Map<string, TagDescriptor>;
    originatingDatas: Map<string, OriginatingDataDescriptor>;
    contentGroups: ContentGroupDescriptor[];
} {
    return {
        contentGroups: schedule.ContentGroup.map((group) => convertContentGroupToDescriptor(group)),
        events: new Map(
            schedule.Event.map((event): [string, EventDescriptor] => [
                event.id,
                {
                    id: event.id,
                    contentGroupId: event.contentGroupId,
                    durationSeconds: event.durationSeconds,
                    intendedRoomModeName: event.intendedRoomModeName,
                    name: event.name,
                    originatingDataId: event.originatingDataId,
                    roomId: event.roomId,
                    startTime: event.startTime,
                    tagIds: new Set(event.eventTags.map((x) => x.tagId)),
                    people: event.eventPeople.map(
                        (eventPerson): EventPersonDescriptor => ({
                            affiliation: eventPerson.affiliation,
                            attendeeId: eventPerson.attendeeId,
                            id: eventPerson.id,
                            name: eventPerson.name,
                            originatingDataId: eventPerson.originatingDataId,
                            roleName: eventPerson.roleName,
                        })
                    ),
                },
            ])
        ),
        tags: new Map(
            schedule.Tag.map((tag): [string, TagDescriptor] => [
                tag.id,
                {
                    id: tag.id,
                    colour: tag.colour,
                    name: tag.name,
                    originatingDataId: tag.originatingDataId,
                },
            ])
        ),
        originatingDatas: new Map(
            schedule.OriginatingData.map((data): [string, OriginatingDataDescriptor] => [
                data.id,
                {
                    id: data.id,
                    sourceId: data.sourceId,
                    data: data.data as OriginatingDataPart[],
                },
            ])
        ),
        rooms: new Map(
            schedule.Room.map((data): [string, RoomDescriptor] => [
                data.id,
                {
                    capacity: data.capacity,
                    currentModeName: data.currentModeName,
                    id: data.id,
                    name: data.name,
                    originatingDataId: data.originatingDataId,
                    participants: new Set(data.participants.map((x) => x.attendeeId)),
                },
            ])
        ),
    };
}

export function deepCloneEventDescriptor(event: EventDescriptor): EventDescriptor {
    return {
        id: event.id,
        contentGroupId: event.contentGroupId,
        durationSeconds: event.durationSeconds,
        intendedRoomModeName: event.intendedRoomModeName,
        name: event.name,
        originatingDataId: event.originatingDataId,
        roomId: event.roomId,
        startTime: event.startTime,
        tagIds: new Set(event.tagIds),
        people: event.people.map(
            (eventPerson): EventPersonDescriptor => ({
                affiliation: eventPerson.affiliation,
                attendeeId: eventPerson.attendeeId,
                id: eventPerson.id,
                name: eventPerson.name,
                originatingDataId: eventPerson.originatingDataId,
                roleName: eventPerson.roleName,
            })
        ),
    };
}

export function deepCloneRoomDescriptor(room: RoomDescriptor): RoomDescriptor {
    return {
        capacity: room.capacity,
        currentModeName: room.currentModeName,
        id: room.id,
        name: room.name,
        originatingDataId: room.originatingDataId,
        participants: new Set(room.participants),
    };
}
