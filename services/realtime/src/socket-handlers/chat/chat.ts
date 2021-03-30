import assert from "assert";
import { Socket } from "socket.io";
import { is } from "typescript-is";
import { generateRoomName } from "../../socket-emitter/chat";

export function onSubscribe(
    _conferenceSlugs: string[],
    _userId: string,
    socketId: string,
    socket: Socket
): (chatId: any, cb?: () => void) => Promise<void> {
    return async (chatId, cb) => {
        if (chatId) {
            try {
                assert(is<string>(chatId), "Data does not match expected type.");
                socket.join(generateRoomName(chatId));
            } catch (e) {
                console.error(`Error processing chat.subscribe (socket: ${socketId}, chatId: ${chatId})`, e);
            }
        }

        cb?.();
    };
}

export function onUnsubscribe(
    _conferenceSlugs: string[],
    _userId: string,
    socketId: string,
    socket: Socket
): (chatId: any, cb?: () => void) => Promise<void> {
    return async (chatId, cb) => {
        if (chatId) {
            try {
                assert(is<string>(chatId), "Data does not match expected type.");
                socket.leave(generateRoomName(chatId));
            } catch (e) {
                console.error(`Error processing chat.unsubscribe (socket: ${socketId}, chatId: ${chatId})`, e);
            }
        }

        cb?.();
    };
}
