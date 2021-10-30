import { readUpToIndicesCache } from "@midspace/caches/readUpToIndex";
import assert from "assert";
import type { Socket } from "socket.io";
import { is } from "typescript-is";
import { canSelectChat } from "../../lib/permissions";
import { sendUnreadCount } from "../../lib/unreadCounts";

export function onRequestUnreadCount(
    userId: string,
    socketId: string,
    _socket: Socket
): (chatId: any) => Promise<void> {
    return async (chatId) => {
        if (chatId) {
            try {
                assert(is<string>(chatId), "Data does not match expected type.");

                if (await canSelectChat(userId, chatId)) {
                    await sendUnreadCount(chatId, userId);
                }
            } catch (e) {
                console.error(`Error processing chat.unreadCount.request (socket: ${socketId}, chatId: ${chatId})`, e);
            }
        }
    };
}

export function onSetReadUpToIndex(
    userId: string,
    socketId: string,
    _socket: Socket
): (chatId: any, messageSId: any) => Promise<void> {
    return async (chatId, messageSId) => {
        if (chatId && messageSId) {
            try {
                assert(is<string>(chatId), "Data (0) does not match expected type.");
                assert(is<string>(messageSId), "Data (1) does not match expected type.");

                if (await canSelectChat(userId, chatId)) {
                    await readUpToIndicesCache.setField(chatId, userId, messageSId);
                    await sendUnreadCount(chatId, userId);
                }
            } catch (e) {
                console.error(`Error processing chat.unreadCount.request (socket: ${socketId}, chatId: ${chatId})`, e);
            }
        }
    };
}
