import type { SelectWholeScheduleQuery } from "../../../../generated/graphql";
import { convertContentGroupToDescriptor } from "../Content/Functions";
import type { ContentGroupDescriptor, ContentPersonDescriptor } from "../Content/Types";
import type { OriginatingDataDescriptor, OriginatingDataPart, TagDescriptor } from "../Shared/Types";
import type { EventDescriptor, RoomDescriptor } from "./Types";

export function convertScheduleToDescriptors(
    schedule: SelectWholeScheduleQuery
): {
    rooms: Map<string, RoomDescriptor>;
    events: Map<string, EventDescriptor>;
    tags: Map<string, TagDescriptor>;
    originatingDatas: Map<string, OriginatingDataDescriptor>;
    people: Map<string, ContentPersonDescriptor>;
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
                    priority: data.priority,
                    currentModeName: data.currentModeName,
                    id: data.id,
                    name: data.name,
                    originatingDataId: data.originatingDataId,
                    participants: new Set(data.participants.map((x) => x.attendeeId)),
                },
            ])
        ),
        people: new Map(
            schedule.ContentPerson.map((person): [string, ContentPersonDescriptor] => [
                person.id,
                {
                    id: person.id,
                    conferenceId: person.conferenceId,
                    name: person.name,
                    affiliation: person.affiliation,
                    email: person.email,
                    originatingDataId: person.originatingDataId,
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
    };
}

export function deepCloneRoomDescriptor(room: RoomDescriptor): RoomDescriptor {
    return {
        capacity: room.capacity,
        priority: room.priority,
        currentModeName: room.currentModeName,
        id: room.id,
        name: room.name,
        originatingDataId: room.originatingDataId,
        participants: new Set(room.participants),
    };
}
