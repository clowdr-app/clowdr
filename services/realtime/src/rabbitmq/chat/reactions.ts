import { Channel, ConsumeMessage } from "amqplib";
import { is } from "typescript-is";
import { RoomPrivacy_Enum } from "../../generated/graphql";
import { canIUDReaction } from "../../lib/permissions";
import { downlink, uplink } from "../../rabbitmq";
import { Action, Reaction } from "../../types/chat";
import { ReactionDistributionQueueSize, ReactionWritebackQueueSize } from "./params";

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

const distributionQueue = `${exchange}.distribution`;
const writebackQueue = `${exchange}.writeback`;

let _distributionDownlinkChannel: Channel;
async function distributionDownlinkChannel() {
    if (!_distributionDownlinkChannel) {
        const connection = await downlink();
        _distributionDownlinkChannel = await connection.createChannel();

        await _distributionDownlinkChannel.assertExchange(exchange, "topic", exchangeParams);
    }
    return _distributionDownlinkChannel;
}

let _writebackDownlinkChannel: Channel;
async function writebackDownlinkChannel() {
    if (!_writebackDownlinkChannel) {
        const connection = await downlink();
        _writebackDownlinkChannel = await connection.createChannel();

        await _writebackDownlinkChannel.assertExchange(exchange, "topic", exchangeParams);
    }
    return _writebackDownlinkChannel;
}

async function distributionDownChannel() {
    const channel = await distributionDownlinkChannel();
    channel.prefetch(ReactionDistributionQueueSize);
    await channel.assertQueue(distributionQueue, {
        autoDelete: true,
        durable: false,
    });
    await channel.bindQueue(distributionQueue, exchange, "*");
    return channel;
}

async function writebackDownChannel() {
    const channel = await writebackDownlinkChannel();
    // Prefetch enables us to fetch N reactions before we have to ack some to receive more reactions
    channel.prefetch(ReactionWritebackQueueSize);
    await _writebackDownlinkChannel.assertQueue(writebackQueue, {
        autoDelete: false,
        durable: true,
    });
    await _writebackDownlinkChannel.bindQueue(writebackQueue, exchange, "*");
    return channel;
}

export async function action(action: Action<Reaction>, userId: string, confSlugs: string[]): Promise<boolean> {
    // I invite the reader of this code to consider whether this is really secure or not
    // My (@ednutting) reasoning is as follows:
    //  An attacker can choose any input values they like - including mismatching the target message's chatId from the
    //  reaction's chatId. Consider then the passage through the system of such a malicious reaction.
    //  * The reaction will be distributed to users.
    //      - The UI will pick out the chosen chat based on the chat id.
    //      - The target message, which by definition is not part of the selected chat, will not be found, so the
    //        reaction will be dropped and never shown to users.
    //      - The contents of a reaction are sufficiently well handled that delivering a possibly maliciously
    //        crafted payload to users will not be a route for attack.
    //  * The system will try to write the reaction into the database
    //      - The database will prevent the mismatch of chatIds, and reject the write
    //      - The writeback system's fallback will kick in to make sure other reactions still succeed.
    //      - An attacker could use mismatched chatIds to DOS our reactions writeback. We could scale the number of
    //        writeback processes; block the associated user (and invalidate their JWTs); auto-rate-limit a user with
    //        a tighter limit for failed requests. (TODO)
    if (
        await canIUDReaction(
            userId,
            action.data.chatId,
            confSlugs,
            action.data.senderId ?? undefined,
            false,
            "reactions.send:test-attendee-id",
            "reactions.send:test-conference-id",
            "reactions.send:test-room-id",
            "reactions.send:test-room-name",
            RoomPrivacy_Enum.Private,
            []
        )
    ) {
        if (action.op === "INSERT") {
            if ("id" in action.data) {
                delete (action.data as any).id;
            }
            action.data.created_at = new Date().toISOString();
        }
        action.data.updated_at = new Date().toISOString();

        return publishAction(action);
    }
    return false;
}

async function publishAction(action: Action<Reaction>): Promise<boolean> {
    const channel = await uplinkChannel();
    return channel.publish(exchange, action.data.chatId, Buffer.from(JSON.stringify(action)), {
        persistent: true,
    });
}

export async function onDistributionReaction(handler: (reaction: Action<Reaction>) => Promise<void>): Promise<void> {
    const channel = await distributionDownChannel();
    channel.consume(distributionQueue, (rabbitMQMsg) => {
        try {
            if (rabbitMQMsg) {
                // Ack immediately
                channel.ack(rabbitMQMsg);

                const reaction = JSON.parse(rabbitMQMsg.content.toString());
                if (is<Action<Reaction>>(reaction)) {
                    handler(reaction);
                } else {
                    console.warn(
                        "Invalid chat reaction received. Data does not match type. (Distribution queue)",
                        reaction
                    );
                }
            }
        } catch (e) {
            console.error("Error processing chat reaction for distribution", e);
        }
    });
}

export async function onWritebackReaction(
    handler: (rabbitMQMsg: ConsumeMessage, reaction: Action<Reaction>) => Promise<void>
): Promise<void> {
    const channel = await writebackDownChannel();
    channel.consume(writebackQueue, (rabbitMQMsg) => {
        try {
            if (rabbitMQMsg) {
                // Do not ack until the reaction has been written into the db

                const reaction = JSON.parse(rabbitMQMsg.content.toString());
                if (is<Action<Reaction>>(reaction)) {
                    handler(rabbitMQMsg, reaction);
                } else {
                    console.warn(
                        "Invalid chat reaction received. Data does not match type. (Writeback queue)",
                        reaction
                    );
                    // Ack invalid reactions to remove them from the queue
                    channel.ack(rabbitMQMsg);
                }
            }
        } catch (e) {
            console.error("Error processing chat reaction for writeback", e);
        }
    });
}

export async function onWritebackReactionsComplete(rabbitMQMsgs: ConsumeMessage[]): Promise<void> {
    const channel = await writebackDownChannel();
    for (const rabbitMQMsg of rabbitMQMsgs) {
        channel.ack(rabbitMQMsg);
    }
}

export async function onWritebackReactionsFail(rabbitMQMsgs: ConsumeMessage[]): Promise<void> {
    const channel = await writebackDownChannel();
    for (const rabbitMQMsg of rabbitMQMsgs) {
        channel.nack(rabbitMQMsg, undefined, true);
    }
}
