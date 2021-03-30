import { Channel } from "amqplib";
import { uplink } from "../../rabbitmq";
import { Reaction } from "../../types/chat";

const exchange = "chat.reactions";
const exchangeParams = {
    autoDelete: false,
    durable: true,
};

let _uplinkChannel: Channel;
async function uplinkChannel() {
    if (!_uplinkChannel) {
        const connection = await uplink();
        _uplinkChannel = await connection.createChannel();
        await _uplinkChannel.assertExchange(exchange, "topic", exchangeParams);
    }
    return _uplinkChannel;
}

export async function send(reaction: Reaction): Promise<void> {
    // TODO: Check permissions

    const channel = await uplinkChannel();
    channel.publish(exchange, reaction.chatId, Buffer.from(JSON.stringify(reaction)), {
        persistent: true,
    });
}
