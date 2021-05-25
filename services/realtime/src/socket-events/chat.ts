import { Socket } from "socket.io";
import { allSocketsAndUserIds, chatListenersKeyName, socketChatsKeyName, socketUserKeyName } from "../lib/chat";
import { redisClientP } from "../redis";
import { socketServer } from "../servers/socket-server";
import * as chat from "../socket-handlers/chat/chat";
import * as chat_messages from "../socket-handlers/chat/messages";
import * as chat_pins from "../socket-handlers/chat/pins";
import * as chat_reactions from "../socket-handlers/chat/reactions";
import * as chat_subscriptions from "../socket-handlers/chat/subscriptions";
import { onRequestUnreadCount, onSetReadUpToIndex } from "../socket-handlers/chat/unreadCount";

export function onConnect(socket: Socket, userId: string, conferenceSlugs: string[]): void {
    const socketId = socket.id;
    redisClientP.setForever(socketUserKeyName(socketId), userId);

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

    socket.on("chat.unreadCount.request", onRequestUnreadCount(conferenceSlugs, userId, socketId, socket));
    socket.on("chat.unreadCount.setReadUpTo", onSetReadUpToIndex(conferenceSlugs, userId, socketId, socket));
}

export async function onDisconnect(socketId: string, userId: string): Promise<void> {
    try {
        await exitChats(socketId, userId);
    } catch (e) {
        console.error(`Error exiting all presences on socket ${socketId}`, e);
    }
}

async function exitChats(socketId: string, userId: string, log = false) {
    const chatIds = await redisClientP.smembers(socketChatsKeyName(socketId));
    if (log) {
        console.info(
            `Exiting chats for ${socketId} / ${userId}:${chatIds.reduce(
                (acc, chatId) => `${acc}
    - ${chatId}`,
                ""
            )}`
        );
    }
    await redisClientP.del(socketChatsKeyName(socketId));
    await redisClientP.del(socketUserKeyName(socketId));
    for (const chatId of chatIds) {
        await redisClientP.srem(chatListenersKeyName(chatId), `${socketId}¬${userId}`);
    }
}

export async function invalidateSessions(): Promise<void> {
    try {
        const socketInfos = await allSocketsAndUserIds();
        const currentSocketIds = await socketServer.allSockets();
        const deadSocketInfos = socketInfos.filter((x) => !currentSocketIds.has(x.socketId));
        await Promise.all(
            deadSocketInfos.map(async (socketInfo) => exitChats(socketInfo.socketId, socketInfo.userId, true))
        );
    } catch (e) {
        console.warn("Could not list all sockets to try to exit chats", e);
    }
}
