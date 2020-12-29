import { ContentItemDataBlob } from "@clowdr-app/shared-types/build/content";
import { ContentType_Enum, InputType_Enum, JobStatus_Enum } from "../../generated/graphql";

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

export interface BroadcastContentItemDataBase extends BaseData {
    contentItemId: string | null;
    roomId: string | null;
    input: BroadcastContentItemInput;
    inputTypeName: InputType_Enum;
    conferenceId: string;
}

export type BroadcastContentItemData = MP4BroadcastContentItemData | VonageBroadcastContentItemData;

export interface MP4BroadcastContentItemData extends BroadcastContentItemDataBase {
    contentItemId: string;
    roomId: null;
    inputTypeName: InputType_Enum.Mp4;
    input: MP4Input | PendingCreation;
}

export interface VonageBroadcastContentItemData extends BroadcastContentItemDataBase {
    contentItemId: null;
    roomId: string;
    inputTypeName: InputType_Enum.VonageSession;
    input: VonageInput | PendingCreation;
}
