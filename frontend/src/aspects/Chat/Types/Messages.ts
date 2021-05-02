export interface OrdinaryMessageData {}

export interface EmoteMessageData {}

export interface QuestionMessageData {}

export interface AnswerMessageData {
    questionMessagesIds?: number[];
    questionMessagesSIds?: string[];
}

export interface PollMessageData {
    options: string[];

    maxVotesPerRegistrant: number;
    canRegistrantsCreateOptions: boolean;
    revealBeforeComplete: boolean;
}

export interface PollResultsMessageData {
    pollMessageId?: string;
    pollMessageSId?: string;
}

export interface DuplicationMarkerMessageData {
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
