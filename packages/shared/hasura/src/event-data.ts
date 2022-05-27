import type { CombineVideosJobDataBlob } from "@midspace/shared-types/combineVideosJob";
import type { Content_ElementType_Enum, ElementDataBlob } from "@midspace/shared-types/content";
import type { SourceBlob } from "@midspace/shared-types/content/element";
import type { VonageSessionLayoutData } from "@midspace/shared-types/vonage";
import type { Credentials } from "google-auth-library";
import type {
    Chat_FlagType_Enum,
    Job_Queues_JobStatus_Enum,
    Room_ManagementMode_Enum,
    Schedule_EventProgramPersonRole_Enum,
    Schedule_Mode_Enum,
} from "./generated/graphql";
import type { VideoRenderJobDataBlob } from "./json-blobs/video-render-job";
import type { VonageVideoPlaybackCommandBlob } from "./json-blobs/vonage-video-playback-command";

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
    source: SourceBlob | null;
    layoutData: any | null;
    typeName: Content_ElementType_Enum;
    name: string;
    conferenceId: string;
    subconferenceId?: string | null | undefined;
    itemId: string;
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
    jobStatusName: Job_Queues_JobStatus_Enum;
    conferenceId: string;
}

export interface VideoRenderJobData extends BaseData {
    conferencePrepareJobId: string;
    jobStatusName: Job_Queues_JobStatus_Enum;
    conferenceId: string;
    elementId: string;
    data: VideoRenderJobDataBlob;
    message: string | null;
}

export interface CombineVideosJobData extends BaseData {
    data: CombineVideosJobDataBlob;
    createdByRegistrantId: string | null;
    jobStatusName: Job_Queues_JobStatus_Enum;
    conferenceId: string;
    subconferenceId?: string | null | undefined;
    message: string | null;
}

export interface EventData extends BaseData {
    modeName?: Schedule_Mode_Enum | null;
    name: string;
    scheduledEndTime?: string | null;
    scheduledStartTime?: string | null;
    conferenceId: string;
    subconferenceId?: string | null | undefined;
    itemId: string | null;
    roomId: string;
    timings_updated_at: string;
}

export interface RoomData extends BaseData {
    conferenceId: string;
    subconferenceId?: string | null | undefined;
    name: string;
    capacity: number | null;
    publicVonageSessionId: string | null;
    priority: number;
    managementModeName: Room_ManagementMode_Enum;
}

export interface VonageSessionLayoutData_Record extends BaseData {
    vonageSessionId: string;
    conferenceId: string;
    subconferenceId?: string | null | undefined;
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
    jobStatusName: Job_Queues_JobStatus_Enum;
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

export interface GoogleAuthTokenData {
    sub: string;
    tokenData: Credentials;
    created_at: string;
    updated_at: string;
}

export interface UserData extends BaseData {}

export interface FlagData {
    created_at: string;
    discussionChatId?: string | null;
    flaggedById?: string | null;
    id: number;
    messageSId: string;
    notes?: string | null;
    resolution?: string | null;
    resolved_at?: string | null;
    type: Chat_FlagType_Enum;
    updated_at: string;
}

export interface InvitationData extends BaseData {
    id: string;
    registrantId: string;
    invitedEmailAddress: string;
    conferenceId: string;
}

export interface VonageVideoPlaybackCommandData extends BaseData {
    id: string;
    createdByRegistrantId?: string;
    vonageSessionId: string;
    command: VonageVideoPlaybackCommandBlob;
    conferenceId: string;
    subconferenceId: string | null;
}
