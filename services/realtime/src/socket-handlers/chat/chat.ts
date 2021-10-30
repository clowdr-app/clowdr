import { redisClientP, redisClientPool } from "@midspace/component-clients/redis";
import assert from "assert";
import type { Socket } from "socket.io";
import { is } from "typescript-is";
import { chatListenersKeyName, generateChatRoomName, socketChatsKeyName } from "../../lib/chat";
import { canSelectChat } from "../../lib/permissions";

export function onSubscribe(userId: string, socketId: string, socket: Socket): (chatId: any) => Promise<void> {
    return async (chatId) => {
        if (chatId) {
            try {
                assert(is<string>(chatId), "Data does not match expected type.");

                if (await canSelectChat(userId, chatId)) {
                    const client = await redisClientPool.acquire("socket-handlers/chat/chat/onSubscribe");
                    try {
                        const existingChats = await redisClientP.smembers(client)(socketChatsKeyName(socketId));
                        if (!existingChats.includes(chatId)) {
                            socket.join(generateChatRoomName(chatId));

                            await redisClientP.sadd(client)(chatListenersKeyName(chatId), `${socketId}¬${userId}`);
                            await redisClientP.sadd(client)(socketChatsKeyName(socketId), chatId);
                        }
                    } finally {
                        redisClientPool.release("socket-handlers/chat/chat/onSubscribe", client);
                    }
                }
            } catch (e) {
                console.error(`Error processing chat.subscribe (socket: ${socketId}, chatId: ${chatId})`, e);
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
            } catch (e) {
                console.error(`Error processing chat.unsubscribe (socket: ${socketId}, chatId: ${chatId})`, e);
            }
        }
    };
}
