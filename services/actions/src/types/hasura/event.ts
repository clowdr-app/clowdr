import { ContentItemDataBlob } from "@clowdr-app/shared-types/build/content";
import { ContentType_Enum, InputType_Enum, JobStatus_Enum, RoomMode_Enum } from "../../generated/graphql";

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

export interface ContentItemData extends BaseData {
    isHidden: boolean;
    data: ContentItemDataBlob;
    layoutData: any | null;
    contentTypeName: ContentType_Enum;
    name: string;
    conferenceId: string;
    contentGroupId: string;
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
    attendeeIds: string[];
}

export interface SubmissionRequestEmailJobData extends BaseData {
    uploaderId: string;
}

export interface ConferencePrepareJobData extends BaseData {
    jobStatusName: JobStatus_Enum;
    conferenceId: string;
}

export interface VideoRenderJobData extends BaseData {
    conferencePrepareJobId: string;
    jobStatusName: JobStatus_Enum;
    conferenceId: string;
    broadcastContentItemId: string;
    data: VideoRenderJobDataBlob;
    message: string | null;
}

// export interface PublishVideoJobData extends BaseData {
//     contentItemId: string;
//     jobStatusName: JobStatus_Enum;
//     conferenceId: string;
//     vimeoVideoUrl: string | null;
// }

export interface BroadcastContentItemDataBase extends BaseData {
    contentItemId: string | null;
    eventId: string | null;
    input: BroadcastContentItemInput;
    inputTypeName: InputType_Enum;
    conferenceId: string;
}

export type BroadcastContentItemData = MP4BroadcastContentItemData | VonageBroadcastContentItemData;

export interface MP4BroadcastContentItemData extends BroadcastContentItemDataBase {
    contentItemId: string;
    eventId: null;
    inputTypeName: InputType_Enum.Mp4;
    input: MP4Input | PendingCreation;
}

export interface VonageBroadcastContentItemData extends BroadcastContentItemDataBase {
    contentItemId: null;
    eventId: string;
    inputTypeName: InputType_Enum.VonageSession;
    input: VonageInput | PendingCreation;
}

export interface EventData extends BaseData {
    durationSeconds: number;
    intendedRoomModeName: RoomMode_Enum;
    name: string;
    endTime: string | null;
    startTime: string;
    conferenceId: string;
    contentGroupId: string | null;
    originatingDataId: string | null;
    roomId: string;
}

export interface RoomData extends BaseData {
    conferenceId: string;
    name: string;
    currentModeName: RoomMode_Enum;
    originatingDataId: string | null;
    capacity: number | null;
    publicVonageSessionId: string | null;
    mediaLiveChannelId: string | null;
    priority: number;
}
