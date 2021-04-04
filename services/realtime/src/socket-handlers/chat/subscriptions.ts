import assert from "assert";
import { Socket } from "socket.io";
import { is } from "typescript-is";
import { getAttendeeInfo } from "../../lib/cache/attendeeInfo";
import { generateChatSubscriptionsChangedRoomName } from "../../socket-emitter/chat";

export function onListenForSubscriptionsChanged(
    _conferenceSlugs: string[],
    userId: string,
    socketId: string,
    socket: Socket
): (attendeeId: any, cb?: () => void) => Promise<void> {
    return async (attendeeId, cb) => {
        if (attendeeId) {
            try {
                assert(is<string>(attendeeId), "Data does not match expected type.");

                const attendeeInfo = await getAttendeeInfo(attendeeId, {
                    displayName: "chat.onListenForSubscriptionsChanged:test-attendee-id",
                    userId,
                });

                if (attendeeInfo?.userId === attendeeId) {
                    socket.join(generateChatSubscriptionsChangedRoomName(attendeeId));
                }
            } catch (e) {
                console.error(
                    `Error processing chat.subscriptions.changed.on (socket: ${socketId}, attendeeId: ${attendeeId})`,
                    e
                );
            }
        }

        cb?.();
    };
}

export function onUnlistenForSubscriptionsChanged(
    _conferenceSlugs: string[],
    userId: string,
    socketId: string,
    socket: Socket
): (attendeeId: any, cb?: () => void) => Promise<void> {
    return async (attendeeId, cb) => {
        if (attendeeId) {
            try {
                assert(is<string>(attendeeId), "Data does not match expected type.");

                const attendeeInfo = await getAttendeeInfo(attendeeId, {
                    displayName: "chat.onListenForSubscriptionsChanged:test-attendee-id",
                    userId,
                });

                if (attendeeInfo?.userId === attendeeId) {
                    socket.leave(generateChatSubscriptionsChangedRoomName(attendeeId));
                }
            } catch (e) {
                console.error(
                    `Error processing chat.subscriptions.changed.on (socket: ${socketId}, attendeeId: ${attendeeId})`,
                    e
                );
            }
        }

        cb?.();
    };
}
