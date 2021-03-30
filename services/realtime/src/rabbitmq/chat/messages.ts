import { Channel } from "amqplib";
import { is } from "typescript-is";
import { downlink, uplink } from "../../rabbitmq";
import { Message } from "../../types/chat";

const exchange = "chat.messages";
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

const distributionQueue = "*.distribution";
const writebackQueue = "*.writeback";

let _downlinkChannel: Channel;
async function downlinkChannel() {
    if (!_downlinkChannel) {
        const connection = await downlink();
        _downlinkChannel = await connection.createChannel();

        await _downlinkChannel.assertExchange(exchange, "topic", exchangeParams);
    }
    return _downlinkChannel;
}

async function distributionDownChannel() {
    const channel = await downlinkChannel();
    await channel.assertQueue(distributionQueue, {
        autoDelete: true,
        durable: false,
    });
    await channel.bindQueue(distributionQueue, exchange, "*");
    return channel;
}

async function writebackDownChannel() {
    const channel = await downlinkChannel();
    await _downlinkChannel.assertQueue(writebackQueue, {
        autoDelete: false,
        durable: true,
    });
    await _downlinkChannel.bindQueue(writebackQueue, exchange, "*");
    return channel;
}

export async function send(message: Message): Promise<void> {
    // TODO: Check permissions

    const channel = await uplinkChannel();
    channel.publish(exchange, message.chatId, Buffer.from(JSON.stringify(message)), {
        persistent: true,
    });
}

export async function onDistributionMessage(handler: (message: Message) => Promise<void>): Promise<void> {
    const channel = await distributionDownChannel();
    channel.consume(distributionQueue, (rabbitMQMsg) => {
        if (rabbitMQMsg) {
            // Ack immediately
            channel.ack(rabbitMQMsg);

            const message = JSON.parse(rabbitMQMsg.content.toString());
            if (is<Message>(message)) {
                handler(message);
            } else {
                console.warn("Invalid chat message received. Data does not match type. (Distribution queue)", message);
            }
        }
    });
}
