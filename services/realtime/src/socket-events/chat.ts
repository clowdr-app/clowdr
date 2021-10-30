import { redisClientP, redisClientPool } from "@midspace/component-clients/redis";
import type { Socket } from "socket.io";
import { allSocketsAndUserIds, chatListenersKeyName, socketChatsKeyName, socketUserKeyName } from "../lib/chat";
import { socketServer } from "../servers/socket-server";
import * as chat from "../socket-handlers/chat/chat";
import * as chat_messages from "../socket-handlers/chat/messages";
import * as chat_pins from "../socket-handlers/chat/pins";
import * as chat_reactions from "../socket-handlers/chat/reactions";
import * as chat_subscriptions from "../socket-handlers/chat/subscriptions";
import { onRequestUnreadCount, onSetReadUpToIndex } from "../socket-handlers/chat/unreadCount";

export function onConnect(socket: Socket, userId: string): void {
    const socketId = socket.id;
    redisClientPool.acquire("socket-events/chat/onConnect").then((redisClient) => {
        try {
            redisClientP.setForever(redisClient)(socketUserKeyName(socketId), userId);
        } finally {
            redisClientPool.release("socket-events/chat/onConnect", redisClient);
        }
    });

    socket.on("chat.subscribe", chat.onSubscribe(userId, socketId, socket));
    socket.on("chat.unsubscribe", chat.onUnsubscribe(userId, socketId, socket));
    socket.on("chat.messages.send", chat_messages.onSend(userId, socketId, socket));
    socket.on("chat.reactions.send", chat_reactions.onSend(userId, socketId, socket));

    socket.on(
        "chat.subscriptions.changed.on",
        chat_subscriptions.onListenForSubscriptionsChanged(userId, socketId, socket)
    );
    socket.on(
        "chat.subscriptions.changed.off",
        chat_subscriptions.onUnlistenForSubscriptionsChanged(userId, socketId, socket)
    );

    socket.on("chat.pins.changed.on", chat_pins.onListenForPinsChanged(userId, socketId, socket));
    socket.on("chat.pins.changed.off", chat_pins.onUnlistenForPinsChanged(userId, socketId, socket));

    socket.on("chat.unreadCount.request", onRequestUnreadCount(userId, socketId, socket));
    socket.on("chat.unreadCount.setReadUpTo", onSetReadUpToIndex(userId, socketId, socket));
}

export async function onDisconnect(socketId: string, userId: string): Promise<void> {
    try {
        await exitChats(socketId, userId);
    } catch (e) {
        console.error(`Error exiting all presences on socket ${socketId}`, e);
    }
}

async function exitChats(socketId: string, userId: string, log = false) {
    const redisClient = await redisClientPool.acquire("socket-events/chat/exitChats");
    try {
        const chatIds = await redisClientP.smembers(redisClient)(socketChatsKeyName(socketId));
        if (log) {
            console.info(
                `Exiting chats for ${socketId} / ${userId}:${chatIds.reduce(
                    (acc, chatId) => `${acc}
    - ${chatId}`,
                    ""
                )}`
            );
        }
        await redisClientP.del(redisClient)(socketChatsKeyName(socketId));
        await redisClientP.del(redisClient)(socketUserKeyName(socketId));
        for (const chatId of chatIds) {
            await redisClientP.srem(redisClient)(chatListenersKeyName(chatId), `${socketId}¬${userId}`);
        }
    } finally {
        redisClientPool.release("socket-events/chat/exitChats", redisClient);
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
