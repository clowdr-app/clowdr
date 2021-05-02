import assert from "assert";
import { Socket } from "socket.io";
import { is } from "typescript-is";
import { Room_ManagementMode_Enum } from "../../generated/graphql";
import { setReadUpToIndex } from "../../lib/cache/readUpToIndex";
import { canSelectChat } from "../../lib/permissions";
import { sendUnreadCount } from "../../lib/unreadCounts";

export function onRequestUnreadCount(
    conferenceSlugs: string[],
    userId: string,
    socketId: string,
    _socket: Socket
): (chatId: any) => Promise<void> {
    return async (chatId) => {
        if (chatId) {
            try {
                assert(is<string>(chatId), "Data does not match expected type.");

                if (
                    await canSelectChat(
                        userId,
                        chatId,
                        conferenceSlugs,
                        false,
                        "chat.onSubscribe:test-registrant-id",
                        "chat.onSubscribe:test-conference-id",
                        "chat.onSubscribe:test-room-id",
                        "chat.onSubscribe:test-room-name",
                        Room_ManagementMode_Enum.Public,
                        []
                    )
                ) {
                    await sendUnreadCount(chatId, userId);
                }
            } catch (e) {
                console.error(`Error processing chat.unreadCount.request (socket: ${socketId}, chatId: ${chatId})`, e);
            }
        }
    };
}

export function onSetReadUpToIndex(
    conferenceSlugs: string[],
    userId: string,
    socketId: string,
    _socket: Socket
): (chatId: any, messageSId: any) => Promise<void> {
    return async (chatId, messageSId) => {
        if (chatId && messageSId) {
            try {
                assert(is<string>(chatId), "Data (0) does not match expected type.");
                assert(is<string>(messageSId), "Data (1) does not match expected type.");

                if (
                    await canSelectChat(
                        userId,
                        chatId,
                        conferenceSlugs,
                        false,
                        "chat.onSubscribe:test-registrant-id",
                        "chat.onSubscribe:test-conference-id",
                        "chat.onSubscribe:test-room-id",
                        "chat.onSubscribe:test-room-name",
                        Room_ManagementMode_Enum.Public,
                        []
                    )
                ) {
                    await setReadUpToIndex(chatId, userId, messageSId);
                    await sendUnreadCount(chatId, userId);
                }
            } catch (e) {
                console.error(`Error processing chat.unreadCount.request (socket: ${socketId}, chatId: ${chatId})`, e);
            }
        }
    };
}
