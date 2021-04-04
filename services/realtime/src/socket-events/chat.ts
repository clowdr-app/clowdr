import { Socket } from "socket.io";
import * as chat from "../socket-handlers/chat/chat";
import * as chat_messages from "../socket-handlers/chat/messages";
import * as chat_pins from "../socket-handlers/chat/pins";
import * as chat_reactions from "../socket-handlers/chat/reactions";
import * as chat_subscriptions from "../socket-handlers/chat/subscriptions";

export function onConnect(socket: Socket, userId: string, conferenceSlugs: string[]): void {
    const socketId = socket.id;

    socket.on("chat.subscribe", chat.onSubscribe(conferenceSlugs, userId, socketId, socket));
    socket.on("chat.unsubscribe", chat.onUnsubscribe(conferenceSlugs, userId, socketId, socket));
    socket.on("chat.messages.send", chat_messages.onSend(conferenceSlugs, userId, socketId, socket));
    socket.on("chat.reactions.send", chat_reactions.onSend(conferenceSlugs, userId, socketId, socket));

    socket.on(
        "chat.subscriptions.changed.on",
        chat_subscriptions.onListenForSubscriptionsChanged(conferenceSlugs, userId, socketId, socket)
    );
    socket.on(
        "chat.subscriptions.changed.off",
        chat_subscriptions.onUnlistenForSubscriptionsChanged(conferenceSlugs, userId, socketId, socket)
    );

    socket.on("chat.pins.changed.on", chat_pins.onListenForPinsChanged(conferenceSlugs, userId, socketId, socket));
    socket.on("chat.pins.changed.off", chat_pins.onUnlistenForPinsChanged(conferenceSlugs, userId, socketId, socket));
}
