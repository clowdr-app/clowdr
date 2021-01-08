export interface OrdinaryMessageData {}

export interface EmoteMessageData {}

export interface QuestionMessageData {}

export interface AnswerMessageData {
    questionMessagesIds: number[];
}

export interface PollMessageData {
    options: string[];

    maxVotesPerAttendee: number;
    canAttendeesCreateOptions: boolean;
    revealBeforeComplete: boolean;
}

export interface PollResultsMessageData {
    pollMessageId: string;
}

export interface DuplicationMarkerMessageData {}

export type MessageData =
    | OrdinaryMessageData
    | EmoteMessageData
    | QuestionMessageData
    | AnswerMessageData
    | PollMessageData
    | PollResultsMessageData
    | DuplicationMarkerMessageData;

export interface AnswerReactionData {
    answerMessageId: number;
}

export interface EmojiReactionData {}

export type ReactionData = AnswerReactionData | EmojiReactionData | any;
