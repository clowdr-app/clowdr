import type {
    Conference_VisibilityLevel_Enum,
    Registrant_RegistrantRole_Enum,
    Room_ManagementMode_Enum,
    Room_PersonRole_Enum,
} from "../../generated/graphql";

declare namespace CacheUpdate {
    interface ConferenceData {
        id: string;
        shortName: string;
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
        name: string;
        conferenceId: string;
        subconferenceId?: string | null;
        managementModeName: Room_ManagementMode_Enum;
        chatId: string;
    }

    interface RegistrantData {
        id: string;
        displayName: string;
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

    interface EventData {
        id: string;
        conferenceId: string;
        subconferenceId: string;
        roomId: string;
    }

    interface PushNotificationSubscriptionData {
        userId: string;
        endpoint: string;
        p256dh: string;
        auth: string;
    }

    interface ChatData {
        id: string;
        restrictToAdmins: boolean;
        conferenceId: string;
    }

    interface ContentItemData {
        id: string;
        chatId: string;
    }

    interface ChatPinData {
        chatId: string;
        registrantId: string;
        wasManuallyPinned: boolean;
    }

    interface ChatSubscriptionData {
        chatId: string;
        registrantId: string;
        wasManuallySubscribed: boolean;
    }
}
