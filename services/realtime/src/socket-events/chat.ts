import { Socket } from "socket.io";
import * as chat from "../socket-handlers/chat/chat";
import * as chat_messages from "../socket-handlers/chat/messages";
import * as chat_reactions from "../socket-handlers/chat/reactions";

export function onConnect(socket: Socket, userId: string, conferenceSlugs: string[]): void {
    const socketId = socket.id;

    socket.on("chat.subscribe", chat.onSubscribe(conferenceSlugs, userId, socketId, socket));
    socket.on("chat.unsubscribe", chat.onUnsubscribe(conferenceSlugs, userId, socketId, socket));
    socket.on("chat.messages.send", chat_messages.onSend(conferenceSlugs, userId, socketId, socket));
    socket.on("chat.reactions.send", chat_reactions.onSend(conferenceSlugs, userId, socketId, socket));
}
