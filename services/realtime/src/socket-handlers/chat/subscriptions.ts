import assert from "assert";
import { Socket } from "socket.io";
import { is } from "typescript-is";
import { getRegistrantInfo } from "../../lib/cache/registrantInfo";
import { generateChatSubscriptionsChangedRoomName } from "../../lib/chat";

export function onListenForSubscriptionsChanged(
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
                    displayName: "chat.onListenForSubscriptionsChanged:test-registrant-id",
                    userId,
                });

                if (registrantInfo?.userId === userId) {
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
                    displayName: "chat.onListenForSubscriptionsChanged:test-registrant-id",
                    userId,
                });

                if (registrantInfo?.userId === userId) {
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
