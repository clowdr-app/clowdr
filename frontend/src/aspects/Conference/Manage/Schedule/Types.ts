import type { EventPersonRole_Enum, RoomMode_Enum } from "../../../../generated/graphql";

export type RoomDescriptor = {
    isNew?: boolean;

    id: string;
    originatingDataId?: string;

    name: string;
    currentModeName: RoomMode_Enum;
    capacity?: number | null;
    priority: number;

    participants: Set<string>;
};

export type EventDescriptor = {
    isNew?: boolean;

    id: string;
    originatingDataId?: string;

    roomId: string;
    intendedRoomModeName: RoomMode_Enum;
    contentGroupId?: string | null;
    name: string;
    startTime: string;
    durationSeconds: number;
    endTime?: string | null;

    people: EventPersonDescriptor[];
    tagIds: Set<string>;
};

export type EventPersonDescriptor = {
    isNew?: boolean;

    id: string;
    originatingDataId?: string;

    attendeeId?: string | null;
    name: string;
    affiliation?: string | null;
    roleName: EventPersonRole_Enum;
};
