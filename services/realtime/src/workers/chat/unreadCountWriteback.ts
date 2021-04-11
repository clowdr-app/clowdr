// Set this up as a CronToGo task
// CRON_TO_GO_ACTIVE=true heroku run node build/workers/chat/unreadCountWriteback.js

import { gql } from "@apollo/client/core";
import assert from "assert";
import {
    AttendeeIdsFromChatsAndUsersDocument,
    Chat_ReadUpToIndex_Insert_Input,
    InsertReadUpToIndexDocument,
} from "../../generated/graphql";
import { apolloClient } from "../../graphqlClient";
import { getAndClearModified } from "../../lib/cache/readUpToIndex";

gql`
    query AttendeeIdsFromChatsAndUsers($chatIds: [uuid!]!, $userIds: [String!]!) {
        Attendee(where: { userId: { _in: $userIds }, conference: { chats: { id: { _in: $chatIds } } } }) {
            id
            userId
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
        assert(apolloClient, "Apollo client needed for read up to index writeback");

        console.info("Writing back read up to indices");
        const indicesToWriteBack = await getAndClearModified();
        const attendeeIds = await apolloClient.query({
            query: AttendeeIdsFromChatsAndUsersDocument,
            variables: {
                chatIds: indicesToWriteBack.map((x) => x.chatId),
                userIds: indicesToWriteBack.map((x) => x.userId),
            },
        });
        await apolloClient.mutate({
            mutation: InsertReadUpToIndexDocument,
            variables: {
                objects: indicesToWriteBack
                    .map((x) => {
                        const attendeeId = attendeeIds.data.Attendee.find((y) => y.userId === x.userId)?.id;
                        if (attendeeId) {
                            const r: Chat_ReadUpToIndex_Insert_Input = {
                                attendeeId,
                                chatId: x.chatId,
                                messageSId: x.messageSId,
                            };
                            return r;
                        } else {
                            console.warn(
                                `Unable to find attendee id for user: ${x.userId}. Cannot write back their unread index for ${x.chatId} (Read up to message sId: ${x.messageSId})`
                            );
                        }
                        return undefined;
                    })
                    .filter((x) => !!x) as Chat_ReadUpToIndex_Insert_Input[],
            },
        });

        if (!continueExecuting) {
            process.exit(0);
        }
    } catch (e) {
        console.error("SEVERE ERROR: Cannot write back read up to indices!", e);

        if (!continueExecuting) {
            process.exit(-1);
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
