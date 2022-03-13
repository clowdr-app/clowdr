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
    } & (
        | {
              startTime: number | string;
              durationSeconds: number;
          }
        | {
              scheduledStartTime?: number | string | null;
              scheduledEndTime?: number | string | null;
          }
    );
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

export interface EventStartData extends BaseMessageData {
    event: {
        id: string;
    } & (
        | {
              startTime: number | string;
              durationSeconds: number;
          }
        | {
              scheduledStartTime?: number | string | null;
              scheduledEndTime?: number | string | null;
          }
    );
    room: {
        id: string;
        name: string;
    };
    item?: {
        id: string;
        title: string;
    };
}

export interface ParticipationSurveyData extends BaseMessageData {
    event: {
        id: string;
        name: string;
    } & (
        | {
              startTime: number | string;
              durationSeconds: number;
          }
        | {
              scheduledStartTime?: number | string | null;
              scheduledEndTime?: number | string | null;
          }
    );
    room: {
        id: string;
        name: string;
    };
    item?: {
        id: string;
        title: string;
    };
}

export type MessageData =
    | OrdinaryMessageData
    | EmoteMessageData
    | QuestionMessageData
    | AnswerMessageData
    | PollMessageData
    | PollResultsMessageData
    | DuplicationMarkerMessageData
    | EventStartData
    | ParticipationSurveyData;

export interface AnswerReactionData {
    answerMessageId?: number;
    duplicateAnswerMessageId?: number;

    answerMessageSId?: string;
    duplicateAnswerMessageSId?: string;
}

export interface ParticipationReactionData {
    rating?: number;
    feedback?: string;
}

export interface EmojiReactionData {}

export type ReactionData = AnswerReactionData | ParticipationReactionData | EmojiReactionData | any;
