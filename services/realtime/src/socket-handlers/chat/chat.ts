import { redisClientP, redisClientPool } from "@midspace/component-clients/redis";
import assert from "assert";
import type { Socket } from "socket.io";
import { is } from "typescript-is";
import { chatListenersKeyName, generateChatRoomName, socketChatsKeyName } from "../../lib/chat";
import { logger } from "../../lib/logger";
import { canSelectChat } from "../../lib/permissions";

export function onSubscribe(userId: string, socketId: string, socket: Socket): (chatId: any) => Promise<void> {
    return async (chatId) => {
        if (chatId) {
            try {
                assert(is<string>(chatId), "Data does not match expected type.");

                if (await canSelectChat(userId, chatId)) {
                    const client = await redisClientPool.acquire("socket-handlers/chat/chat/onSubscribe");
                    try {
                        // Always call join - a websocket re-establishing its connection to chat needs to rejoin the session
                        socket.join(generateChatRoomName(chatId));
                        socket.emit("chat.subscribe.ack", chatId);

                        // And these are harmless - doesn't matter if we're re-adding
                        await redisClientP.sadd(client)(chatListenersKeyName(chatId), `${socketId}¬${userId}`);
                        await redisClientP.sadd(client)(socketChatsKeyName(socketId), chatId);
                    } finally {
                        redisClientPool.release("socket-handlers/chat/chat/onSubscribe", client);
                    }
                }
            } catch (error: any) {
                logger.error({ error }, `Error processing chat.subscribe (socket: ${socketId}, chatId: ${chatId})`);
            }
        }
    };
}

export function onUnsubscribe(userId: string, socketId: string, socket: Socket): (chatId: any) => Promise<void> {
    return async (chatId) => {
        if (chatId) {
            try {
                assert(is<string>(chatId), "Data does not match expected type.");

                if (await canSelectChat(userId, chatId)) {
                    socket.leave(generateChatRoomName(chatId));
                    const client = await redisClientPool.acquire("socket-handlers/chat/chat/onUnsubscribe");
                    try {
                        await redisClientP.srem(client)(chatListenersKeyName(chatId), `${socketId}¬${userId}`);
                        await redisClientP.srem(client)(socketChatsKeyName(socketId), chatId);
                    } finally {
                        redisClientPool.release("socket-handlers/chat/chat/onUnsubscribe", client);
                    }
                }
            } catch (error: any) {
                logger.error({ error }, `Error processing chat.unsubscribe (socket: ${socketId}, chatId: ${chatId})`);
            }
        }
    };
}
