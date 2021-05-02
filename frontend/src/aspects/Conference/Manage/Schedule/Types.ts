import type { Room_Mode_Enum, Schedule_EventProgramPersonRole_Enum } from "../../../../generated/graphql";

export type RoomDescriptor = {
    isNew?: boolean;

    id: string;
    originatingDataId?: string;

    name: string;
    currentModeName: Room_Mode_Enum;
    capacity?: number | null;
    priority: number;

    participants: Set<string>;
};

export type EventDescriptor = {
    isNew?: boolean;

    id: string;
    originatingDataId?: string;

    roomId: string;
    intendedRoomModeName: Room_Mode_Enum;
    itemId?: string | null;
    exhibitionId?: string | null;
    name: string;
    startTime: string;
    durationSeconds: number;
    endTime?: string | null;

    tagIds: Set<string>;
};

export type EventProgramPersonDescriptor = {
    isNew?: boolean;

    id: string;
    originatingDataId?: string;

    eventId: string;
    registrantId?: string | null;
    name: string;
    affiliation?: string | null;
    roleName: Schedule_EventProgramPersonRole_Enum;
};

export type RegistrantDescriptor = {
    isNew?: boolean;
    id: string;
    displayName: string;
};
