import assert from "assert";
import type { Socket } from "socket.io";
import { is } from "typescript-is";
import { generateChatPinsChangedRoomName } from "../../lib/chat";
import { logger } from "../../lib/logger";

export function onListenForPinsChanged(
    userId: string,
    socketId: string,
    socket: Socket
): (registrantId: any) => Promise<void> {
    return async (registrantId) => {
        if (registrantId) {
            try {
                assert(is<string>(registrantId), "Data does not match expected type.");

                const registrants = await caches.user.getField(userId, "registrants");
                if (registrants?.some((x) => x.id === registrantId)) {
                    socket.join(generateChatPinsChangedRoomName(registrantId));
                }
            } catch (error: any) {
                logger.error(
                    { error },
                    `Error processing chat.pins.changed.on (socket: ${socketId}, registrantId: ${registrantId})`
                );
            }
        }
    };
}

export function onUnlistenForPinsChanged(
    userId: string,
    socketId: string,
    socket: Socket
): (registrantId: any) => Promise<void> {
    return async (registrantId) => {
        if (registrantId) {
            try {
                assert(is<string>(registrantId), "Data does not match expected type.");

                const registrants = await caches.user.getField(userId, "registrants");
                if (registrants?.some((x) => x.id === registrantId)) {
                    socket.leave(generateChatPinsChangedRoomName(registrantId));
                }
            } catch (error: any) {
                logger.error(
                    { error },
                    `Error processing chat.pins.changed.on (socket: ${socketId}, registrantId: ${registrantId})`
                );
            }
        }
    };
}
