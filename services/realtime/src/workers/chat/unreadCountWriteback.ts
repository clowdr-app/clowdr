// Set this up as a CronToGo task
// CRON_TO_GO_ACTIVE=true node services/realtime/build/workers/chat/unreadCountWriteback.js

import { ReadUpToIndexCache } from "@midspace/caches/readUpToIndex";
import { gqlClient } from "@midspace/component-clients/graphqlClient";
import assert from "assert";
import { gql } from "graphql-tag";
import type {
    Chat_ReadUpToIndex_Insert_Input,
    RegistrantIdsFromChatsAndUsersQuery,
    RegistrantIdsFromChatsAndUsersQueryVariables,
} from "../../generated/graphql";
import { InsertReadUpToIndexDocument, RegistrantIdsFromChatsAndUsersDocument } from "../../generated/graphql";
import { logger } from "../../lib/logger";

gql`
    query RegistrantIdsFromChatsAndUsers($chatIds: [uuid!]!, $userIds: [String!]!) {
        registrant_Registrant(where: { userId: { _in: $userIds }, conference: { chats: { id: { _in: $chatIds } } } }) {
            id
            userId
            conference {
                chats(where: { id: { _in: $chatIds } }) {
                    id
                }
            }
        }
    }

    mutation InsertReadUpToIndex($objects: [chat_ReadUpToIndex_insert_input!]!) {
        insert_chat_ReadUpToIndex(
            objects: $objects
            on_conflict: { constraint: ReadUpToIndex_pkey, update_columns: [messageSId] }
        ) {
            affected_rows
        }
    }
`;

async function Main(continueExecuting = false) {
    try {
        assert(gqlClient, "GQL client needed for read up to index writeback");

        logger.info("Writing back read up to indices");
        const indicesToWriteBack = await new ReadUpToIndexCache(logger).getAndClearModified();
        const registrantIds = await gqlClient
            .query<RegistrantIdsFromChatsAndUsersQuery, RegistrantIdsFromChatsAndUsersQueryVariables>(
                RegistrantIdsFromChatsAndUsersDocument,
                {
                    chatIds: indicesToWriteBack.map((x) => x.chatId),
                    userIds: indicesToWriteBack.map((x) => x.userId),
                }
            )
            .toPromise();
        assert(registrantIds?.data);
        const data = registrantIds.data;

        // Delay the writeback by 30s so that all the message writeback workers
        // (hopefully) have sufficient time to save their messages into Postgres
        // so we don't get an accidental foreign key violation.
        await new Promise<void>((resolve) =>
            setTimeout(async () => {
                assert(gqlClient, "GQL client needed for read up to index writeback");
                await gqlClient
                    .mutation(InsertReadUpToIndexDocument, {
                        objects: indicesToWriteBack
                            .map((x) => {
                                const registrantId = data.registrant_Registrant.find(
                                    (y) => y.userId === x.userId && y.conference.chats.some((z) => z.id === x.chatId)
                                )?.id;
                                if (registrantId) {
                                    const r: Chat_ReadUpToIndex_Insert_Input = {
                                        registrantId,
                                        chatId: x.chatId,
                                        messageSId: x.messageSId,
                                    };
                                    return r;
                                } else {
                                    logger.warn(
                                        { userId: x.userId, chatId: x.chatId, messageSId: x.messageSId },
                                        `Unable to find registrant id for user: ${x.userId}. Cannot write back their unread index for ${x.chatId} (Read up to message sId: ${x.messageSId})`
                                    );
                                }
                                return undefined;
                            })
                            .filter((x) => !!x) as Chat_ReadUpToIndex_Insert_Input[],
                    })
                    .toPromise();
                resolve();
            }, 30000)
        );

        if (!continueExecuting) {
            process.exit(0);
        }
    } catch (err: any) {
        if (
            !err
                .toString()
                .includes(
                    'Foreign key violation. insert or update on table "ReadUpToIndex" violates foreign key constraint "ReadUpToIndex_messageSId_fkey"'
                )
        ) {
            logger.error({ err }, "SEVERE ERROR: Cannot write back read up to indices!");

            if (!continueExecuting) {
                process.exit(-1);
            }
        } else {
            logger.warn(
                { err },
                "Warning: Ignoring read up to indices write back error (foreign key violation suggests the system attempted to store the read up to index before message has been written back.)"
            );
            if (!continueExecuting) {
                process.exit(1);
            }
        }
    }
}

if (!process.env.CRON_TO_GO_ACTIVE) {
    if (!process.env.CRONTOGO_API_KEY) {
        setInterval(() => Main(true), 3 * 60 * 1000);
    }
} else {
    Main();
}
