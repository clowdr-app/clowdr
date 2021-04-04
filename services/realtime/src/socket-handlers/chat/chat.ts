import assert from "assert";
import { Socket } from "socket.io";
import { is } from "typescript-is";
import { RoomPrivacy_Enum } from "../../generated/graphql";
import { canSelectChat } from "../../lib/permissions";
import { redisClientP } from "../../redis";
import { chatListenersKeyName, generateRoomName } from "../../socket-emitter/chat";

export function onSubscribe(
    conferenceSlugs: string[],
    userId: string,
    socketId: string,
    socket: Socket
): (chatId: any, cb?: () => void) => Promise<void> {
    return async (chatId, cb) => {
        if (chatId) {
            try {
                assert(is<string>(chatId), "Data does not match expected type.");

                if (
                    await canSelectChat(
                        userId,
                        chatId,
                        conferenceSlugs,
                        false,
                        "chat.onSubscribe:test-attendee-id",
                        "chat.onSubscribe:test-conference-id",
                        "chat.onSubscribe:test-room-id",
                        "chat.onSubscribe:test-room-name",
                        RoomPrivacy_Enum.Private,
                        []
                    )
                ) {
                    socket.join(generateRoomName(chatId));

                    await redisClientP.sadd(chatListenersKeyName(chatId), `${socketId}¬${userId}`);
                }
            } catch (e) {
                console.error(`Error processing chat.subscribe (socket: ${socketId}, chatId: ${chatId})`, e);
            }
        }

        cb?.();
    };
}

export function onUnsubscribe(
    conferenceSlugs: string[],
    userId: string,
    socketId: string,
    socket: Socket
): (chatId: any, cb?: () => void) => Promise<void> {
    return async (chatId, cb) => {
        if (chatId) {
            try {
                assert(is<string>(chatId), "Data does not match expected type.");

                if (
                    await canSelectChat(
                        userId,
                        chatId,
                        conferenceSlugs,
                        false,
                        "chat.onSubscribe:test-attendee-id",
                        "chat.onSubscribe:test-conference-id",
                        "chat.onSubscribe:test-room-id",
                        "chat.onSubscribe:test-room-name",
                        RoomPrivacy_Enum.Private,
                        []
                    )
                ) {
                    socket.leave(generateRoomName(chatId));
                    await redisClientP.srem(chatListenersKeyName(chatId), `${socketId}¬${userId}`);
                }
            } catch (e) {
                console.error(`Error processing chat.unsubscribe (socket: ${socketId}, chatId: ${chatId})`, e);
            }
        }

        cb?.();
    };
}
