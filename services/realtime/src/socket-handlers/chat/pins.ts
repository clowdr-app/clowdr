import assert from "assert";
import { Socket } from "socket.io";
import { is } from "typescript-is";
import { getAttendeeInfo } from "../../lib/cache/attendeeInfo";
import { generateChatPinsChangedRoomName } from "../../lib/chat";

export function onListenForPinsChanged(
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
                    displayName: "chat.onListenForPinsChanged:test-attendee-id",
                    userId,
                });

                if (attendeeInfo?.userId === userId) {
                    socket.join(generateChatPinsChangedRoomName(attendeeId));
                }
            } catch (e) {
                console.error(
                    `Error processing chat.pins.changed.on (socket: ${socketId}, attendeeId: ${attendeeId})`,
                    e
                );
            }
        }

        cb?.();
    };
}

export function onUnlistenForPinsChanged(
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
                    displayName: "chat.onListenForPinsChanged:test-attendee-id",
                    userId,
                });

                if (attendeeInfo?.userId === userId) {
                    socket.leave(generateChatPinsChangedRoomName(attendeeId));
                }
            } catch (e) {
                console.error(
                    `Error processing chat.pins.changed.on (socket: ${socketId}, attendeeId: ${attendeeId})`,
                    e
                );
            }
        }

        cb?.();
    };
}
