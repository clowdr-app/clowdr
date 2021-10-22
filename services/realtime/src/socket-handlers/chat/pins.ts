import assert from "assert";
import type { Socket } from "socket.io";
import { is } from "typescript-is";
import { getRegistrantInfo } from "../../lib/cache/registrantInfo";
import { generateChatPinsChangedRoomName } from "../../lib/chat";

export function onListenForPinsChanged(
    _conferenceSlugs: string[],
    userId: string,
    socketId: string,
    socket: Socket
): (registrantId: any) => Promise<void> {
    return async (registrantId) => {
        if (registrantId) {
            try {
                assert(is<string>(registrantId), "Data does not match expected type.");

                const registrantInfo = await getRegistrantInfo(registrantId, {
                    displayName: "chat.onListenForPinsChanged:test-registrant-id",
                    userId,
                });

                if (registrantInfo?.userId === userId) {
                    socket.join(generateChatPinsChangedRoomName(registrantId));
                }
            } catch (e) {
                console.error(
                    `Error processing chat.pins.changed.on (socket: ${socketId}, registrantId: ${registrantId})`,
                    e
                );
            }
        }
    };
}

export function onUnlistenForPinsChanged(
    _conferenceSlugs: string[],
    userId: string,
    socketId: string,
    socket: Socket
): (registrantId: any) => Promise<void> {
    return async (registrantId) => {
        if (registrantId) {
            try {
                assert(is<string>(registrantId), "Data does not match expected type.");

                const registrantInfo = await getRegistrantInfo(registrantId, {
                    displayName: "chat.onListenForPinsChanged:test-registrant-id",
                    userId,
                });

                if (registrantInfo?.userId === userId) {
                    socket.leave(generateChatPinsChangedRoomName(registrantId));
                }
            } catch (e) {
                console.error(
                    `Error processing chat.pins.changed.on (socket: ${socketId}, registrantId: ${registrantId})`,
                    e
                );
            }
        }
    };
}
