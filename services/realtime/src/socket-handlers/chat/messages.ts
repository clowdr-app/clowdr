import assert from "assert";
import { Socket } from "socket.io";
import { is } from "typescript-is";
import { action } from "../../rabbitmq/chat/messages";
import { Action, Message } from "../../types/chat";

export function onSend(
    conferenceSlugs: string[],
    userId: string,
    socketId: string,
    socket: Socket
): (message: any, cb?: () => void) => Promise<void> {
    return async (actionData, cb) => {
        if (actionData) {
            try {
                assert(is<Action<Message>>(actionData), "Data does not match expected type.");
                if (await action(actionData, userId, conferenceSlugs)) {
                    socket.emit("chat.messages.send.ack", actionData.data.sId);
                } else {
                    socket.emit("chat.messages.send.nack", actionData.data.sId);
                }
            } catch (e) {
                console.error(`Error processing chat.messages.send (socket: ${socketId})`, e, actionData);
                try {
                    socket.emit("chat.messages.send.nack", actionData.sId);
                } catch (e2) {
                    console.error(`Error nacking chat.messages.send (socket: ${socketId})`, e, actionData);
                }
            }
        }

        cb?.();
    };
}
