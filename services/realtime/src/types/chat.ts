import { Chat_MessageType_Enum } from "../generated/graphql";

export interface Message {
    created_at: string;
    updated_at: string;
    type: Chat_MessageType_Enum;
    chatId: string;
    senderId: string | null | undefined;
    message: string;
    data: any;
    isPinned: boolean;
    duplicatedMessageId?: number | null | undefined;
    systemId?: string | null | undefined;
    remoteServiceId?: string | null | undefined;
    sId: string;
}

export interface Reaction {
    sId: string;
    userId: string;
    chatId: string;
    messageSId: string;
    reaction: string;
}

export type Action<T> = {
    op: "INSERT" | "UPDATE" | "DELETE";
    data: T;
};

// For use with typescript-is
export type MessageAction = { op: "INSERT" | "UPDATE" | "DELETE"; data: Message };
