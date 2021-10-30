import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { redlock } from "@midspace/component-clients/redis";
import { CombinedError } from "@urql/core";
import type { ConsumeMessage } from "amqplib";
import { gql } from "graphql-tag";
import type {
    Chat_Reaction_Insert_Input,
    DeleteChatReactionsMutation,
    DeleteChatReactionsMutationVariables,
    InsertChatReactionsMutation,
    InsertChatReactionsMutationVariables,
    UpdateChatReactionMutation,
    UpdateChatReactionMutationVariables,
} from "../../../generated/graphql";
import {
    DeleteChatReactionsDocument,
    InsertChatReactionsDocument,
    UpdateChatReactionDocument,
} from "../../../generated/graphql";
import { ReactionWritebackIntervalMs, ReactionWritebackQueueSize } from "../../../rabbitmq/chat/params";
import {
    onWritebackReaction,
    onWritebackReactionsComplete,
    onWritebackReactionsFail,
} from "../../../rabbitmq/chat/reactions";
import type { Action, Reaction } from "../../../types/chat";

console.info("Chat reactions writeback worker running");

type UnackedReactionInfo = {
    rabbitMQMsg: ConsumeMessage;
    actionRct: Reaction;
};

type Delayed<T> = T & {
    delayUntil: number;
};

// Note: We cannot assume that inserts, updates and deletes will be processed in
// order. They must account for out-of-order processing and recovery
let insertQueue: UnackedReactionInfo[] = [];
let updateQueue: Delayed<UnackedReactionInfo>[] = [];
let deleteQueue: Delayed<UnackedReactionInfo>[] = [];

const queuesLockKey = `locks:writebackReactions:${process.env.DYNO}`;

gql`
    mutation InsertChatReactions($objects: [chat_Reaction_insert_input!]!) {
        insert_chat_Reaction(
            objects: $objects
            on_conflict: { constraint: Reaction_sId_key, update_columns: [updated_at] }
        ) {
            returning {
                sId
            }
        }
    }

    mutation UpdateChatReaction($reactionId: uuid!, $object: chat_Reaction_set_input!) {
        update_chat_Reaction(where: { sId: { _eq: $reactionId } }, _set: $object) {
            returning {
                sId
            }
        }
    }

    mutation DeleteChatReactions($reactionIds: [uuid!]!) {
        delete_chat_Reaction(where: { sId: { _in: $reactionIds } }) {
            returning {
                sId
            }
        }
    }
`;

async function processInsertQueue() {
    const insertObjects = insertQueue.map<Chat_Reaction_Insert_Input>((msg) => ({
        chatId: msg.actionRct.chatId,
        data: msg.actionRct.data,
        duplicateSId: msg.actionRct.duplicateSId,
        sId: msg.actionRct.sId,
        senderId: msg.actionRct.senderId,
        type: msg.actionRct.type,
        messageSId: msg.actionRct.messageSId,
        symbol: msg.actionRct.symbol,
    }));

    if (insertObjects.length === 0) {
        return;
    }

    try {
        const response = await gqlClient
            ?.mutation<InsertChatReactionsMutation, InsertChatReactionsMutationVariables>(InsertChatReactionsDocument, {
                objects: insertObjects,
            })
            .toPromise();
        if (!response) {
            throw new Error("No response / no gqlClient");
        } else if (response.error) {
            throw response.error;
        }

        const results = insertQueue.map((original) => ({
            sId: original.actionRct.sId,
            rabbitMQMsg: original.rabbitMQMsg,
            ok: !!response.data?.insert_chat_Reaction?.returning.some((x) => x.sId === original.actionRct.sId),
        }));
        const acks = results.filter((x) => x.ok).map((x) => x.rabbitMQMsg);
        const nacks = results.filter((x) => !x.ok).map((x) => x.rabbitMQMsg);

        insertQueue = [];

        try {
            onWritebackReactionsComplete(acks);
        } catch (e) {
            console.error(
                "Error acknowleding to RabbitMQ chat reactions that were successfully written into the DB",
                e
            );
        }

        if (nacks.length > 0) {
            console.error(
                "Somehow Hasura returned a partial insert failure when writing back chat reactions?!",
                nacks.length + " failures"
            );
            try {
                onWritebackReactionsFail(nacks);
            } catch (e) {
                console.error(
                    "Error not-acknowleding to RabbitMQ chat reactions that could not be written into the DB",
                    e
                );
            }
        }
    } catch (e) {
        let wasNetworkError: boolean;
        if (e instanceof CombinedError) {
            if (e.networkError) {
                wasNetworkError = true;
            } else if (e.graphQLErrors) {
                wasNetworkError = false;
            } else {
                wasNetworkError = false;
            }
        } else {
            wasNetworkError = false;
        }

        if (wasNetworkError) {
            console.error("Writeback of chat reactions failed due to network error", e);
            insertQueue = [];
            onWritebackReactionsFail(insertQueue.map((x) => x.rabbitMQMsg));
        } else {
            const responses = await Promise.all(
                insertObjects.map(async (obj) => {
                    try {
                        const resp = await gqlClient
                            ?.mutation<InsertChatReactionsMutation, InsertChatReactionsMutationVariables>(
                                InsertChatReactionsDocument,
                                {
                                    objects: [obj],
                                }
                            )
                            .toPromise();
                        if (!resp) {
                            throw new Error("No response / no gqlClient");
                        } else if (resp.error) {
                            throw resp.error;
                        }
                        return { ...resp, sId: obj.sId };
                    } catch (e) {
                        return {
                            sId: obj.sId,
                            errors: [e],
                        };
                    }
                })
            );

            const results = insertQueue.map((original) => ({
                sId: original.actionRct.sId,
                rabbitMQMsg: original.rabbitMQMsg,
                response: responses.find((response) => response.sId === original.actionRct.sId),
            }));
            const acks = results.filter((x) => !x.response?.errors);
            const nacks = results.filter((x) => !!x.response?.errors);

            insertQueue = [];

            try {
                onWritebackReactionsComplete(acks.map((x) => x.rabbitMQMsg));
            } catch (e) {
                console.error(
                    "Error acknowleding to RabbitMQ chat reactions that were successfully written into the DB\n" +
                        JSON.stringify(e, null, 2)
                );
            }

            if (nacks.length > 0) {
                console.error(
                    "Failed to write back some individual chat reactions into the database",
                    nacks.length + " failures"
                );
                nacks.forEach((x) =>
                    console.error("Individual chat reaction writeback failure\n" + JSON.stringify(x.response, null, 2))
                );
                // TODO: Send email to system alerts address
                try {
                    // At this point, we just have to give up on them. We've logged the failure and
                    // it's time to drop these from the queue lest we end up in infinite re-attempts
                    onWritebackReactionsComplete(nacks.map((x) => x.rabbitMQMsg));
                } catch (e) {
                    console.error(
                        "Error not-acknowleding to RabbitMQ chat reactions that could not be written into the DB\n" +
                            JSON.stringify(e, null, 2)
                    );
                }
            }
        }
    }
}

/* On the topic of detecting updates and deletes for reactions that are yet to be
 * inserted.
 *
 * We assume that updates and deletes are valid: i.e. that if they are invalid
 * they will either have been denied at the inbound permissions check or they
 * will eventually be dropped due to persistent failure (because perhaps they
 * refer to a reaction that failed to insert).
 *
 * We know that valid updates and deletes will have been generated (by clients)
 * after the target reaction was sent via an insert action. However, the insert
 * action may currently reside in another worker's queue (i.e. not yet be
 * written into the database).
 *
 * An update may come after a delete (due to client races and/or lag) in which
 * case it can be treated like an invalid update. This means it will eventually
 * be dropped / ignored due to persistent failure.
 *
 * Thus remains only the situation that a valid update or delete is being
 * processed for a reaction that is yet to be inserted. Since the insert must be
 * residing in another worker's queue, and we know queues are processed at least
 * every `ReactionWritebackIntervalMs` milliseconds, we know the reaction will be
 * inserted (or the insert will fail outright) within
 * `2 * ReactionWritebackIntervalMs` milliseconds.
 *
 * We attempt each update or delete and compare whether it had an effect on the
 * target row. If it did, good, we ack and complete. Otherwise, if this is the
 * first attempt, we put it into a delayed processing queue with a target
 * processing time set to `2 * ReactionWritebackIntervalMs`. When the update or
 * delete is processed from this queue, we always ack it with RabbitMQ. If the
 * update or delete continues to fail, we drop it and log the event (but not as
 * an error).
 */

async function processUpdateQueue() {
    const now = Date.now();
    const processNow = updateQueue.filter((x) => x.delayUntil <= now);
    const deferred: Delayed<UnackedReactionInfo>[] = updateQueue.filter((x) => x.delayUntil > now);

    const completed: Delayed<UnackedReactionInfo>[] = [];
    const failedFirst: Delayed<UnackedReactionInfo>[] = [];
    const failedSecond: Delayed<UnackedReactionInfo>[] = [];

    for (const updateAction of processNow) {
        try {
            const response = await gqlClient
                ?.mutation<UpdateChatReactionMutation, UpdateChatReactionMutationVariables>(
                    UpdateChatReactionDocument,
                    {
                        reactionId: updateAction.actionRct.sId,
                        object: updateAction.actionRct,
                    }
                )
                .toPromise();

            if (response?.data?.update_chat_Reaction?.returning?.some((x) => x.sId === updateAction.actionRct.sId)) {
                completed.push(updateAction);
            } else {
                if (updateAction.delayUntil === -1) {
                    failedFirst.push(updateAction);
                } else {
                    failedSecond.push(updateAction);
                }
            }
        } catch (e) {
            console.error(`Error processing chat reaction update: ${JSON.stringify(e, null, 2)}`);
        }
    }

    try {
        await onWritebackReactionsComplete(completed.map((x) => x.rabbitMQMsg));
    } catch (e) {
        console.error(`Error ack'ing completed chat reaction updates: ${JSON.stringify(e, null, 2)}`);
    }
    try {
        await onWritebackReactionsComplete(failedSecond.map((x) => x.rabbitMQMsg));
    } catch (e) {
        console.error(`Error ack'ing second-failure chat reaction updates: ${JSON.stringify(e, null, 2)}`);
    }

    updateQueue = [
        ...deferred,
        ...failedFirst.map((x) => ({
            ...x,
            delayUntil: now + 2 * ReactionWritebackIntervalMs,
        })),
    ];
}

async function processDeleteQueue() {
    const now = Date.now();
    const processNow = deleteQueue.filter((x) => x.delayUntil <= now);
    const deferred: Delayed<UnackedReactionInfo>[] = deleteQueue.filter((x) => x.delayUntil > now);

    let completed: Delayed<UnackedReactionInfo>[] = [];
    let failedFirst: Delayed<UnackedReactionInfo>[] = [];
    let failedSecond: Delayed<UnackedReactionInfo>[] = [];

    try {
        if (processNow.length > 0) {
            const response = await gqlClient
                ?.mutation<DeleteChatReactionsMutation, DeleteChatReactionsMutationVariables>(
                    DeleteChatReactionsDocument,
                    {
                        reactionIds: processNow.map((x) => x.actionRct.sId),
                    }
                )
                .toPromise();

            completed = processNow.filter(
                (deleteAction) =>
                    !!response?.data?.delete_chat_Reaction?.returning?.some((x) => x.sId === deleteAction.actionRct.sId)
            );
            failedFirst = processNow.filter(
                (deleteAction) =>
                    !response?.data?.delete_chat_Reaction?.returning?.some(
                        (x) => x.sId === deleteAction.actionRct.sId
                    ) && deleteAction.delayUntil === -1
            );
            failedSecond = processNow.filter(
                (deleteAction) =>
                    !response?.data?.delete_chat_Reaction?.returning?.some(
                        (x) => x.sId === deleteAction.actionRct.sId
                    ) && deleteAction.delayUntil !== -1
            );
        }
    } catch (e) {
        console.error(`Error processing chat reaction delete: ${JSON.stringify(e, null, 2)}`);
    }

    try {
        await onWritebackReactionsComplete(completed.map((x) => x.rabbitMQMsg));
    } catch (e) {
        console.error(`Error ack'ing completed chat reaction deletes: ${JSON.stringify(e, null, 2)}`);
    }
    try {
        await onWritebackReactionsComplete(failedSecond.map((x) => x.rabbitMQMsg));
    } catch (e) {
        console.error(`Error ack'ing second-failure chat reaction deletes: ${JSON.stringify(e, null, 2)}`);
    }

    deleteQueue = [
        ...deferred,
        ...failedFirst.map((x) => ({
            ...x,
            delayUntil: now + 2 * ReactionWritebackIntervalMs,
        })),
    ];
}

let lastProcessQueuesTime = 0;
async function processQueues(proceedWithPartial: boolean) {
    // We need to sum of the queue sizes because that is the number waiting acknowledgment
    // in RabbitMQ (the prefetch size)
    const totalQueueSize = insertQueue.length + updateQueue.length + deleteQueue.length;

    proceedWithPartial = proceedWithPartial && Date.now() - lastProcessQueuesTime >= ReactionWritebackIntervalMs - 100;

    if (totalQueueSize > 0 && (proceedWithPartial || totalQueueSize >= ReactionWritebackQueueSize)) {
        const lease = await redlock.acquire(queuesLockKey, 180000);
        lastProcessQueuesTime = Date.now();
        try {
            console.info(`Writing back reactions:
    * Total queue size: ${totalQueueSize}
    * Proceed with partial: ${proceedWithPartial}

    - Insert    ${insertQueue.length}
    - Update    ${updateQueue.length}
    - Delete    ${deleteQueue.length}
`);
            await processInsertQueue();
            await processUpdateQueue();
            await processDeleteQueue();
        } catch (e) {
            console.error("Error writing back queues (some reactions may now be stuck!)", e);
        } finally {
            await lease.unlock();
        }
    }
}

async function onReaction(rabbitMQMsg: ConsumeMessage, action: Action<Reaction>) {
    // console.info("Reaction for writeback", reaction);

    let ok = false;
    try {
        const lease = await redlock.acquire(queuesLockKey, 60000);
        try {
            switch (action.op) {
                case "INSERT":
                    insertQueue.push({ rabbitMQMsg, actionRct: action.data });
                    break;
                case "UPDATE":
                    // Note: The delayUntil must be -1 for the update algorithm to work
                    updateQueue.push({ rabbitMQMsg, actionRct: action.data, delayUntil: -1 });
                    break;
                case "DELETE":
                    // Note: The delayUntil must be -1 for the delete algorithm to work
                    deleteQueue.push({ rabbitMQMsg, actionRct: action.data, delayUntil: -1 });
                    break;
            }

            ok = true;
        } finally {
            await lease.unlock();
        }
    } catch (e) {
        console.error("Erroring process chat reaction: writeback.onReaction", e);

        await onWritebackReactionsFail([rabbitMQMsg]);
    }

    if (ok) {
        await processQueues(false);
    }
}

async function Main() {
    onWritebackReaction(onReaction);

    setInterval(() => {
        processQueues(true);
    }, ReactionWritebackIntervalMs);
}

Main();
