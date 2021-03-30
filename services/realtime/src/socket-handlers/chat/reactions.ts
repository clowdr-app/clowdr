import { Socket } from "socket.io";
import { uplink } from "../../rabbitmq";

interface Reaction {
    sId: string;
    messageSId: string;
    chatId: string;
    reaction: string;
}

const exchange = "chat.reactions";
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

async function send(reaction: Reaction) {
    const channel = await publicationChannel;
    channel.publish(exchange, reaction.chatId, Buffer.from(JSON.stringify(reaction)), {
        persistent: true,
    });
}

export function onSend(
    _conferenceSlugs: string[],
    _userId: string,
    socketId: string,
    _socket: Socket
): (reaction: Reaction, cb?: () => void) => Promise<void> {
    return async (reaction, cb) => {
        try {
            await send(reaction);
        } catch (e) {
            console.error(`Error processing chat.reactions.send (socket: ${socketId}, sId: ${reaction.sId})`, e);
        }

        cb?.();
    };
}
