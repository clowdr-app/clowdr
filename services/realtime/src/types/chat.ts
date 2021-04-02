export interface Message {
    sId: string;
    userId: string;
    chatId: string;
    message: string;
}

export interface Reaction {
    sId: string;
    userId: string;
    chatId: string;
    messageSId: string;
    reaction: string;
}
