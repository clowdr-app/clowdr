import { Channel } from "amqplib";
import { is } from "typescript-is";
import { RoomPrivacy_Enum } from "../../generated/graphql";
import { canIUDMessage as canIUDMessageOrReaction } from "../../lib/permissions";
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

export async function send(message: Message, userId: string, confSlugs: string[]): Promise<boolean> {
    if (
        await canIUDMessageOrReaction(
            userId,
            message.chatId,
            confSlugs,
            true,
            false,
            "messages.send:test-attendee-id",
            "messages.send:test-conference-id",
            RoomPrivacy_Enum.Private
        )
    ) {
        message.userId = userId;

        const channel = await uplinkChannel();
        return channel.publish(exchange, message.chatId, Buffer.from(JSON.stringify(message)), {
            persistent: true,
        });
    }
    return false;
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
