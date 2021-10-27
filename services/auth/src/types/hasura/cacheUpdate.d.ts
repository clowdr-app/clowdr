import type {
    Conference_VisibilityLevel_Enum,
    Registrant_RegistrantRole_Enum,
    Room_ManagementMode_Enum,
    Room_PersonRole_Enum,
} from "../../generated/graphql";

declare namespace CacheUpdate {
    interface ConferenceData {
        id: string;
        conferenceVisibilityLevel: Conference_VisibilityLevel_Enum;
        createdBy: string;
    }

    interface SubconferenceData {
        id: string;
        conferenceId: string;
        conferenceVisibilityLevel: Conference_VisibilityLevel_Enum;
    }

    interface RoomData {
        id: string;
        conferenceId: string;
        subconferenceId?: string | null;
        managementModeName: Room_ManagementMode_Enum;
    }

    interface RegistrantData {
        id: string;
        userId?: string | null;
        conferenceId: string;
        conferenceRole: Registrant_RegistrantRole_Enum;
    }

    interface SubconferenceMembershipData {
        id: string;
        registrantId: string;
        subconferenceId: string;
        role: Registrant_RegistrantRole_Enum;
    }

    interface RoomMembershipData {
        id: string;
        registrantId: string;
        roomId: string;
        personRoleName: Room_PersonRole_Enum;
    }

    interface UserData {
        id: string;
    }
}
