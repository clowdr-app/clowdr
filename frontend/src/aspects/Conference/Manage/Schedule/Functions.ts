import type { SelectWholeScheduleQuery } from "../../../../generated/graphql";
import { convertItemToDescriptor } from "../Content/Functions";
import type { ExhibitionDescriptor, ItemDescriptor, ProgramPersonDescriptor } from "../Content/Types";
import type { OriginatingDataDescriptor, OriginatingDataPart, TagDescriptor } from "../Shared/Types";
import type { EventDescriptor, RoomDescriptor } from "./Types";

export function convertScheduleToDescriptors(schedule: SelectWholeScheduleQuery): {
    rooms: Map<string, RoomDescriptor>;
    events: Map<string, EventDescriptor>;
    tags: Map<string, TagDescriptor>;
    exhibitions: Map<string, ExhibitionDescriptor>;
    originatingDatas: Map<string, OriginatingDataDescriptor>;
    people: Map<string, ProgramPersonDescriptor>;
    items: ItemDescriptor[];
} {
    return {
        items: schedule.content_Item.map((group) => convertItemToDescriptor(group)),
        events: new Map(
            schedule.schedule_Event.map((event): [string, EventDescriptor] => [
                event.id,
                {
                    id: event.id,
                    itemId: event.itemId,
                    exhibitionId: event.exhibitionId,
                    durationSeconds: event.durationSeconds,
                    intendedRoomModeName: event.intendedRoomModeName,
                    name: event.name,
                    originatingDataId: event.originatingDataId,
                    roomId: event.roomId,
                    startTime: event.startTime,
                    enableRecording: event.enableRecording,
                },
            ])
        ),
        tags: new Map(
            schedule.collection_Tag.map((tag): [string, TagDescriptor] => [
                tag.id,
                {
                    id: tag.id,
                    colour: tag.colour,
                    name: tag.name,
                    originatingDataId: tag.originatingDataId,
                    priority: tag.priority,
                },
            ])
        ),
        exhibitions: new Map(
            schedule.collection_Exhibition.map((tag): [string, ExhibitionDescriptor] => [
                tag.id,
                {
                    id: tag.id,
                    colour: tag.colour,
                    name: tag.name,
                    priority: tag.priority,
                    isHidden: tag.isHidden,
                },
            ])
        ),
        originatingDatas: new Map(
            schedule.conference_OriginatingData.map((data): [string, OriginatingDataDescriptor] => [
                data.id,
                {
                    id: data.id,
                    sourceId: data.sourceId,
                    data: data.data as OriginatingDataPart[],
                },
            ])
        ),
        rooms: new Map(
            schedule.room_Room.map((data): [string, RoomDescriptor] => [
                data.id,
                {
                    capacity: data.capacity,
                    priority: data.priority,
                    currentModeName: data.currentModeName,
                    id: data.id,
                    name: data.name,
                    originatingDataId: data.originatingDataId,
                },
            ])
        ),
        people: new Map(
            schedule.collection_ProgramPerson.map((person): [string, ProgramPersonDescriptor] => [
                person.id,
                {
                    id: person.id,
                    conferenceId: person.conferenceId,
                    name: person.name ?? "<ERROR>",
                    affiliation: person.affiliation,
                    email: person.email,
                    originatingDataId: person.originatingDataId,
                    registrantId: person.registrantId,
                },
            ])
        ),
    };
}

export function deepCloneEventDescriptor(event: EventDescriptor): EventDescriptor {
    return {
        id: event.id,
        itemId: event.itemId,
        exhibitionId: event.exhibitionId,
        durationSeconds: event.durationSeconds,
        intendedRoomModeName: event.intendedRoomModeName,
        name: event.name,
        originatingDataId: event.originatingDataId,
        roomId: event.roomId,
        startTime: event.startTime,
        enableRecording: event.enableRecording,
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
    };
}
