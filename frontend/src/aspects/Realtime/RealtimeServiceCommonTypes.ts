import type { Chat_MessageType_Enum } from "../../generated/graphql";

export interface Message {
    created_at: string;
    updated_at: string;
    type: Chat_MessageType_Enum;
    chatId: string;
    senderId: string | null | undefined;
    message: string;
    data: any;
    isPinned: boolean;
    duplicatedMessageSId?: string | null | undefined;
    systemId?: string | null | undefined;
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

export interface Notification {
    title: string;
    subtitle?: string;
    description: string;
    chatId?: string;
    linkURL?: string;
}
