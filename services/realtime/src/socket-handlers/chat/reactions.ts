import assert from "assert";
import type { Socket } from "socket.io";
import { is } from "typescript-is";
import { validate as uuidValidate } from "uuid";
import { action } from "../../rabbitmq/chat/reactions";
import type { Action, Reaction } from "../../types/chat";

export function onSend(userId: string, socketId: string, _socket: Socket): (reaction: any) => Promise<void> {
    return async (actionData) => {
        if (actionData) {
            try {
                assert(is<Action<Reaction>>(actionData), "Data does not match expected type.");
                assert(uuidValidate(actionData.data.sId), "sId invalid");
                assert(uuidValidate(actionData.data.chatId), "chatId invalid");
                assert(uuidValidate(actionData.data.messageSId), "messageSId invalid");
                assert(!actionData.data.senderId || uuidValidate(actionData.data.senderId), "senderId invalid");
                assert(
                    !actionData.data.duplicateSId || uuidValidate(actionData.data.duplicateSId),
                    "duplicatedMessageSId invalid"
                );

                await action(actionData, userId, conferenceSlugs);
            } catch (e) {
                console.error(`Error processing chat.reactions.send (socket: ${socketId})`, e, actionData);
            }
        }
    };
}
