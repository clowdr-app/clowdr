import { ElementDataBlob } from "@clowdr-app/shared-types/build/content";
import { VonageSessionLayoutData } from "@clowdr-app/shared-types/build/vonage";
import { CombineVideosJobDataBlob } from "@clowdr-app/shared-types/src/combineVideosJob";
import { Credentials } from "google-auth-library/build/src/auth/credentials";
import {
    Content_ElementType_Enum,
    Room_ManagementMode_Enum,
    Room_Mode_Enum,
    Schedule_EventProgramPersonRole_Enum,
    Video_JobStatus_Enum,
} from "../../generated/graphql";

export interface Payload<T = any> {
    event: {
        session_variables: { [x: string]: string };
        op: "INSERT" | "UPDATE" | "DELETE" | "MANUAL";
        data: {
            old: T | null;
            new: T | null;
        };
    };
    created_at: string;
    id: string;
    delivery_info: {
        max_retries: number;
        current_retry: number;
    };
    trigger: {
        name: string;
    };
    table: {
        schema: string;
        name: string;
    };
}

export interface ScheduledEventPayload<T = any> {
    scheduled_time: string;
    payload: T;
    created_at: string;
    id: string;
    comment: string | null;
}

export interface BaseData {
    created_at: string;
    updated_at: string;
    id: string;
}

export interface ConferenceData extends BaseData {
    createdBy: string;
    demoCodeId: string;
    name: string;
    shortName: string;
    slug: string;
}

export interface ElementData extends BaseData {
    isHidden: boolean;
    data: ElementDataBlob;
    layoutData: any | null;
    typeName: Content_ElementType_Enum;
    name: string;
    conferenceId: string;
    itemId: string;
    originatingDataId: string | null;
}

export interface EmailData extends BaseData {
    userId: string | null;
    invitationId: string | null;
    reason: string;
    htmlContents: string;
    emailAddress: string;
    retriesCount: number;
    plainTextContents: string;
    sentAt: string | null;
    subject: string;
}

export interface InvitationEmailJobData extends BaseData {
    conferenceId: string;
    sendRepeat: boolean;
    registrantIds: string[];
}

export interface SubmissionRequestEmailJobData extends BaseData {
    uploaderId: string;
}

export interface ConferencePrepareJobData extends BaseData {
    jobStatusName: Video_JobStatus_Enum;
    conferenceId: string;
}

export interface VideoRenderJobData extends BaseData {
    conferencePrepareJobId: string;
    jobStatusName: Video_JobStatus_Enum;
    conferenceId: string;
    elementId: string;
    data: VideoRenderJobDataBlob;
    message: string | null;
}

export interface CombineVideosJobData extends BaseData {
    data: CombineVideosJobDataBlob;
    createdByRegistrantId: string | null;
    jobStatusName: Video_JobStatus_Enum;
    conferenceId: string;
    message: string | null;
}

export interface EventData extends BaseData {
    durationSeconds: number;
    intendedRoomModeName: Room_Mode_Enum;
    name: string;
    endTime: string | null;
    startTime: string;
    conferenceId: string;
    itemId: string | null;
    originatingDataId: string | null;
    roomId: string;
}

export interface RoomData extends BaseData {
    conferenceId: string;
    name: string;
    currentModeName: Room_Mode_Enum;
    originatingDataId: string | null;
    capacity: number | null;
    publicVonageSessionId: string | null;
    priority: number;
    managementModeName: Room_ManagementMode_Enum;
}

export interface EventVonageSessionData extends BaseData {
    sessionId: string;
    conferenceId: string;
    eventId: string;
    layoutData: VonageSessionLayoutData | null;
}

export interface EventRoomJoinRequestData extends BaseData {
    eventId: string;
    registrantId: string;
    eventPersonRoleName: Schedule_EventProgramPersonRole_Enum;
    approved: boolean;
    conferenceId: string;
}

export interface EventPersonData extends BaseData {
    id: string;
    eventId: string;
    personId: string | null;
    roleName: Schedule_EventProgramPersonRole_Enum;
}

export interface MediaPackageHarvestJob extends BaseData {
    eventId: string;
    jobStatusName: Video_JobStatus_Enum;
    message: string | null;
    mediaPackageHarvestJobId: string | null;
    conferenceId: string;
}

export interface ShuffleQueueEntryData {
    created_at: string;
    updated_at: string;
    id: number;
    shufflePeriodId: string;
    registrantId: string;
    allocatedShuffleRoomId?: number | null;
}

export interface RegistrantGoogleAccountData extends BaseData {
    tokenData: Credentials;
    registrantId: string;
    googleAccountEmail: string;
    conferenceId: string;
}

export interface UserData extends BaseData {}
