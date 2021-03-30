import assert from "assert";
import { Socket } from "socket.io";
import { is } from "typescript-is";
import { send } from "../../rabbitmq/chat/reactions";
import { Reaction } from "../../types/chat";

export function onSend(
    _conferenceSlugs: string[],
    _userId: string,
    socketId: string,
    _socket: Socket
): (reaction: any, cb?: () => void) => Promise<void> {
    return async (reaction, cb) => {
        if (reaction) {
            try {
                assert(is<Reaction>(reaction), "Data does not match expected type.");
                await send(reaction);
            } catch (e) {
                console.error(`Error processing chat.reactions.send (socket: ${socketId}, sId: ${reaction.sId})`, e);
            }
        }

        cb?.();
    };
}
