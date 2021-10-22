import assert from "assert";
import type { Socket } from "socket.io";
import { is } from "typescript-is";
import { validate as uuidValidate } from "uuid";
import { action } from "../../rabbitmq/chat/messages";
import type { Action, Message } from "../../types/chat";

export function onSend(
    conferenceSlugs: string[],
    userId: string,
    socketId: string,
    socket: Socket
): (message: any) => Promise<void> {
    return async (actionData) => {
        if (actionData) {
            try {
                assert(is<Action<Message>>(actionData), "Data does not match expected type.");
                assert(uuidValidate(actionData.data.sId), "sId invalid");
                assert(uuidValidate(actionData.data.chatId), "chatId invalid");
                assert(!actionData.data.senderId || uuidValidate(actionData.data.senderId), "senderId invalid");
                assert(
                    !actionData.data.duplicatedMessageSId || uuidValidate(actionData.data.duplicatedMessageSId),
                    "duplicatedMessageSId invalid"
                );

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
    };
}
