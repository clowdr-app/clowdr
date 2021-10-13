export enum MediaType {
    Audio,
    Video,
    Image,
    PDF,
    Text,
    XML,
    CSV,
    JSON,
}

export interface MessageMediaData {
    type: MediaType;
    name: string;
    url: string;
    alt: string;
}

export interface BaseMessageData {
    media?: MessageMediaData;
}

export interface OrdinaryMessageData extends BaseMessageData {}

export interface EmoteMessageData extends BaseMessageData {}

export interface QuestionMessageData extends BaseMessageData {}

export interface AnswerMessageData extends BaseMessageData {
    questionMessagesIds?: number[];
    questionMessagesSIds?: string[];
}

export interface PollMessageData extends BaseMessageData {
    options: string[];

    maxVotesPerRegistrant: number;
    canRegistrantsCreateOptions: boolean;
    revealBeforeComplete: boolean;
}

export interface PollResultsMessageData extends BaseMessageData {
    pollMessageId?: string;
    pollMessageSId?: string;
}

export interface DuplicationMarkerMessageData extends BaseMessageData {
    type: "start" | "end";
    event: {
        id: string;
        startTime: number;
        durationSeconds: number;
    };
    room: {
        id: string;
        name: string;
        chatId: string;
    };
    item: {
        id: string;
        title: string;
        chatId: string;
    };
}

export type MessageData =
    | OrdinaryMessageData
    | EmoteMessageData
    | QuestionMessageData
    | AnswerMessageData
    | PollMessageData
    | PollResultsMessageData
    | DuplicationMarkerMessageData;

export interface AnswerReactionData {
    answerMessageId?: number;
    duplicateAnswerMessageId?: number;

    answerMessageSId?: string;
    duplicateAnswerMessageSId?: string;
}

export interface EmojiReactionData {}

export type ReactionData = AnswerReactionData | EmojiReactionData | any;
