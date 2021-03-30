import { onDistributionMessage } from "../../../rabbitmq/chat/messages";
import { generateRoomName } from "../../../socket-emitter/chat";
import { emitter } from "../../../socket-emitter/socket-emitter";
import { Message } from "../../../types/chat";

console.info("Chat messages distribution worker running");

async function Main() {
    onDistributionMessage(onMessage);
}

async function onMessage(message: Message) {
    console.info("Message for distribution", message);
    emitter.to(generateRoomName(message.chatId)).emit("chat.messages.receive", JSON.stringify(message));

    // TODO: Lookup subscribers
    // TODO: Filter out subscribers who have a socket connected and are pub / sub'd
    // TODO: Choose web-push, email or no distribution channel for remaining subscribers
}

Main();
