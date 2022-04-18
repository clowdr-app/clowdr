import { downlink, uplink } from "@midspace/component-clients/rabbitmq";
import type { Channel, ConsumeMessage } from "amqplib";
import { Mutex } from "async-mutex";
import { is } from "typescript-is";
import { logger } from "../logger";
import type { Task } from "../types/task";

const exchange = "import.tasks";
const exchangeParams = {
    autoDelete: false,
    durable: true,
};

let _uplinkChannel: Channel;
const uplinkChannelMutex = new Mutex();
async function uplinkChannel() {
    const release = await uplinkChannelMutex.acquire();
    try {
        if (!_uplinkChannel) {
            const connection = await uplink();
            _uplinkChannel = await connection.createChannel();
            await _uplinkChannel.assertExchange(exchange, "topic", exchangeParams);
        }
    } finally {
        release();
    }
    return _uplinkChannel;
}

const tasksQueue = (type: string) => `${exchange}.${type}`;

let _tasksDownlinkChannel: Channel;
const tasksDownChannelMutex = new Mutex();
async function tasksDownlinkChannel() {
    const release = await tasksDownChannelMutex.acquire();
    try {
        if (!_tasksDownlinkChannel) {
            const connection = await downlink();
            _tasksDownlinkChannel = await connection.createChannel();

            await _tasksDownlinkChannel.assertExchange(exchange, "topic", exchangeParams);
        }
    } finally {
        release();
    }
    return _tasksDownlinkChannel;
}

async function tasksDownChannel(taskType: Task["type"]) {
    const queueName = tasksQueue(taskType ?? "any");

    const channel = await tasksDownlinkChannel();
    // Prefetch enables us to fetch N messages before we have to ack some to receive more messages
    channel.prefetch(1);
    await _tasksDownlinkChannel.assertQueue(queueName, {
        autoDelete: false,
        durable: true,
    });
    if (!taskType) {
        await _tasksDownlinkChannel.bindQueue(queueName, exchange, "*");
    } else {
        await _tasksDownlinkChannel.bindQueue(queueName, exchange, taskType);
    }
    return channel;
}

export async function publishTask(task: Task): Promise<boolean> {
    const channel = await uplinkChannel();
    return channel.publish(exchange, task.type, Buffer.from(JSON.stringify(task)), {
        persistent: true,
    });
}

export async function onTask(
    handler: (rabbitMQMsg: ConsumeMessage, task: Task, channel: Channel) => Promise<void>,
    taskTypes: Task["type"][]
): Promise<void> {
    const setup = async (taskType: Task["type"]) => {
        const channel = await tasksDownChannel(taskType);
        channel.consume(tasksQueue(taskType ?? "any"), async (rabbitMQMsg) => {
            try {
                if (rabbitMQMsg) {
                    // Do not ack until the task has been successfully executed

                    const message = JSON.parse(rabbitMQMsg.content.toString());
                    if (is<Task>(message)) {
                        await handler(rabbitMQMsg, message, channel);
                    } else {
                        logger.warn({ message }, "Invalid task received. Data does not match type.");
                        // Ack invalid messages to remove them from the queue
                        channel.ack(rabbitMQMsg);
                    }
                }
            } catch (error: any) {
                logger.error({ error }, "Error processing task");
            }
        });
    };

    await Promise.all(taskTypes.map(setup));
}

export async function onTasksComplete(rabbitMQMsgs: ConsumeMessage[], channel: Channel): Promise<void> {
    for (const rabbitMQMsg of rabbitMQMsgs) {
        channel.ack(rabbitMQMsg);
    }
}

export async function onTasksFail(rabbitMQMsgs: ConsumeMessage[], channel: Channel): Promise<void> {
    for (const rabbitMQMsg of rabbitMQMsgs) {
        channel.nack(rabbitMQMsg, undefined, true);
    }
}
