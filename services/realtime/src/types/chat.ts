export interface Message {
    sId: string;
    chatId: string;
    message: string;
}

export interface Reaction {
    sId: string;
    messageSId: string;
    chatId: string;
    reaction: string;
}
