import { userCache } from "@midspace/caches/user";
import assert from "assert";
import type { Socket } from "socket.io";
import { is } from "typescript-is";
import { generateChatSubscriptionsChangedRoomName } from "../../lib/chat";

export function onListenForSubscriptionsChanged(
    userId: string,
    socketId: string,
    socket: Socket
): (registrantId: any) => Promise<void> {
    return async (registrantId) => {
        if (registrantId) {
            try {
                assert(is<string>(registrantId), "Data does not match expected type.");

                const registrants = await userCache.getField(userId, "registrants");
                if (registrants?.some((x) => x.id === registrantId)) {
                    socket.join(generateChatSubscriptionsChangedRoomName(registrantId));
                }
            } catch (e) {
                console.error(
                    `Error processing chat.subscriptions.changed.on (socket: ${socketId}, registrantId: ${registrantId})`,
                    e
                );
            }
        }
    };
}

export function onUnlistenForSubscriptionsChanged(
    userId: string,
    socketId: string,
    socket: Socket
): (registrantId: any) => Promise<void> {
    return async (registrantId) => {
        if (registrantId) {
            try {
                assert(is<string>(registrantId), "Data does not match expected type.");

                const registrants = await userCache.getField(userId, "registrants");
                if (registrants?.some((x) => x.id === registrantId)) {
                    socket.leave(generateChatSubscriptionsChangedRoomName(registrantId));
                }
            } catch (e) {
                console.error(
                    `Error processing chat.subscriptions.changed.on (socket: ${socketId}, registrantId: ${registrantId})`,
                    e
                );
            }
        }
    };
}
