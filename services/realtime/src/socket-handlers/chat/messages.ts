import { Socket } from "socket.io";
import { uplink } from "../../rabbitmq";

interface Message {
    sId: string;
    chatId: string;
    message: string;
}

const exchange = "chat.messages";
const exchangeParams = {
    autoDelete: false,
    durable: true,
};

async function setup() {
    const connection = await uplink;
    const channel = await connection.createChannel();
    await channel.assertExchange(exchange, "topic", exchangeParams);
    return channel;
}

const publicationChannel = setup();

async function send(message: Message) {
    const channel = await publicationChannel;
    channel.publish(exchange, message.chatId, Buffer.from(JSON.stringify(message)), {
        persistent: true,
    });
}

export function onSend(
    _conferenceSlugs: string[],
    _userId: string,
    socketId: string,
    socket: Socket
): (message: Message, cb?: () => void) => Promise<void> {
    return async (message, cb) => {
        try {
            await send(message);
            socket.emit("chat.messages.send.ack", message.sId);
        } catch (e) {
            console.error(`Error processing chat.messages.send (socket: ${socketId}, sId: ${message.sId})`, e);
            try {
                socket.emit("chat.messages.send.nack", message.sId);
            } catch (e2) {
                console.error(`Error nacking chat.messages.send (socket: ${socketId}, sId: ${message.sId})`, e);
            }
        }

        cb?.();
    };
}
