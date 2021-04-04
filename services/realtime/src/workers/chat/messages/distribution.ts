import { onDistributionMessage } from "../../../rabbitmq/chat/messages";
import { generateRoomName } from "../../../socket-emitter/chat";
import { emitter } from "../../../socket-emitter/socket-emitter";
import { Action, Message } from "../../../types/chat";

console.info("Chat messages distribution worker running");

async function onMessage(action: Action<Message>) {
    // console.info("Message for distribution", action);

    const eventName =
        action.op === "INSERT"
            ? "receive"
            : action.op === "UPDATE"
            ? "update"
            : action.op === "DELETE"
            ? "delete"
            : "unknown";

    emitter.to(generateRoomName(action.data.chatId)).emit(`chat.messages.${eventName}`, JSON.stringify(action));

    // TODO: Lookup subscribers
    // TODO: Filter out subscribers who have a socket connected and are pub / sub'd
    // TODO: Choose web-push, email or no distribution channel for remaining subscribers
}

async function Main() {
    onDistributionMessage(onMessage);
}

Main();
