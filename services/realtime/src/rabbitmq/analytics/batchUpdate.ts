import type { Channel } from "amqplib";
import { downlink, uplink } from "../../rabbitmq";

export enum ModelName {
    Conference = "conference",
    Item = "item",
    Element = "element",
    Room = "room",
}

const exchange = "analytics.batchUpdates";
const exchangeParams = {
    autoDelete: true,
    durable: false,
};

let _uplinkChannel: Channel;
async function uplinkChannel() {
    if (!_uplinkChannel) {
        const connection = await uplink();
        _uplinkChannel = await connection.createChannel();
        await _uplinkChannel.assertExchange(exchange, "direct", exchangeParams);
    }
    return _uplinkChannel;
}

const updatesQueue = (modelName: ModelName) => `${exchange}.${modelName}`;

let _updatesDownlinkChannel: Channel;
async function updatesDownlinkChannel() {
    if (!_updatesDownlinkChannel) {
        const connection = await downlink();
        _updatesDownlinkChannel = await connection.createChannel();

        await _updatesDownlinkChannel.assertExchange(exchange, "direct", exchangeParams);
    }
    return _updatesDownlinkChannel;
}

async function batchUpdatesDownChannel(modelName: ModelName) {
    const channel = await updatesDownlinkChannel();
    channel.prefetch(1);
    await channel.assertQueue(updatesQueue(modelName), {
        autoDelete: true,
        durable: false,
    });
    await channel.bindQueue(updatesQueue(modelName), exchange, modelName);
    return channel;
}

export async function publishBatchUpdate(modelName: ModelName, id: string): Promise<boolean> {
    const channel = await uplinkChannel();
    return channel.publish(exchange, modelName, Buffer.from(id), {
        persistent: false,
    });
}

export async function onBatchUpdate(modelName: ModelName, handler: (id: string) => Promise<void>): Promise<void> {
    const channel = await batchUpdatesDownChannel(modelName);
    channel.consume(updatesQueue(modelName), async (rabbitMQMsg) => {
        try {
            if (rabbitMQMsg) {
                const id = rabbitMQMsg.content.toString();
                try {
                    await handler(id);
                } finally {
                    channel.ack(rabbitMQMsg);
                }
            }
        } catch (e) {
            console.error(`Error processing ${modelName} analytics batch update`, e);
        }
    });
}
