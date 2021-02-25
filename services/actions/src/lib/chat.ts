import { gql } from "@apollo/client/core";
import assert from "assert";
import { htmlToText } from "html-to-text";
import Twilio from "twilio";
import { validate as uuidValidate } from "uuid";
import {
    AllUnnotifiedSubscriptionsDocument,
    AttemptToMatchAttendeeAndUserDocument,
    ChatsWithoutRemoteServiceIdsDocument,
    Chat_ReadUpToIndex_Insert_Input,
    Chat_SelectAttendeeIdsDocument,
    Email_Insert_Input,
    GetChatAndMessageRemoteServiceIdDocument,
    GetChatRemoteServiceIdAndReactionsDocument,
    GetChatRemoteServiceIdDocument,
    SetChatRemoteServiceIdDocument,
    SetMessageRemoteServiceIdDocument,
    SubWithUnnotifMsgsFragment,
    UpsertReadUpToIndicesDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { insertEmails } from "../handlers/email";
import { MessageData, ReactionData } from "../types/hasura/event";
import { callWithRetry } from "../utils";

const AccessToken = Twilio.jwt.AccessToken;
const { ChatGrant } = AccessToken;

gql`
    fragment SubWithUnnotifMsgs on chat_SubscriptionsWithUnnotifiedMessages {
        chatId
        attendeeId

        chat {
            created_at

            conference {
                slug
            }
            contentGroup {
                id
                title
            }
            room {
                id
                name
            }

            messages(order_by: { id: desc }, limit: 1) {
                id
                senderId
            }
        }

        attendee {
            displayName
            user {
                id
                email
            }
        }
    }

    query AllUnnotifiedSubscriptions {
        chat_SubscriptionsWithUnnotifiedMessages(
            where: { _and: [{ attendee: { user: {} } }, { chat: { room: { roomPrivacyName: { _eq: DM } } } }] }
        ) {
            ...SubWithUnnotifMsgs
        }
    }

    mutation UpsertReadUpToIndices($objs: [chat_ReadUpToIndex_insert_input!]!) {
        insert_chat_ReadUpToIndex(
            objects: $objs
            on_conflict: { constraint: ReadUpToIndex_pkey, update_columns: [notifiedUpToMessageId] }
        ) {
            affected_rows
        }
    }
`;

export async function sendEmailUnnotifiedMessageNotifications(): Promise<void> {
    const allSubs = await apolloClient.query({
        query: AllUnnotifiedSubscriptionsDocument,
    });

    // Remove subscriptions that are for empty chats or where the attendee is not yet linked to a user
    const filteredSubs = allSubs.data.chat_SubscriptionsWithUnnotifiedMessages.filter(
        (sub) => sub.chat && sub.attendee && sub.attendee.user && sub.chat?.messages.length > 0
    );
    // Subscriptions are returned ordered by user id
    // Group subscriptions by attendee so we only send one email to each attendee
    // with a list of all the chats relevant to them
    const groupedSubs = filteredSubs.reduce<SubWithUnnotifMsgsFragment[][]>((acc, sub) => {
        // Ignore chats where we can't identify where to link the user to
        if (
            (!sub.chat?.contentGroup || sub.chat?.contentGroup.length === 0) &&
            (!sub.chat?.room || sub.chat?.room.length === 0)
        ) {
            return acc;
        }

        if (acc.length === 0) {
            return [[sub]];
        }
        const currentGroup = acc[acc.length - 1];
        const sampleSub = currentGroup[currentGroup.length - 1];
        if (sampleSub.attendeeId === sub.attendeeId) {
            return [...acc.slice(0, acc.length - 1), [...currentGroup, sub]];
        } else {
            return [...acc, [sub]];
        }
    }, [] as SubWithUnnotifMsgsFragment[][]);

    // Insert or update read-up-to indices
    const upsertObjects = filteredSubs.map(
        (x) =>
            ({
                attendeeId: x.attendeeId,
                chatId: x.chatId,
                notifiedUpToMessageId: x.chat?.messages[0].id,
            } as Chat_ReadUpToIndex_Insert_Input)
    );
    await apolloClient.mutate({
        mutation: UpsertReadUpToIndicesDocument,
        variables: {
            objs: upsertObjects,
        },
    });

    // Send out the emails notifying users
    await insertEmails(
        groupedSubs.reduce<Email_Insert_Input[]>((acc, rawSubGroup) => {
            // Ignore subscriptions where the most recent message was sent by this subscriber
            const subGroup = rawSubGroup.filter((sub) => sub.chat?.messages[0].senderId !== sub.attendeeId);
            if (subGroup.length > 0) {
                // Use the first subscription for extracting common information like attendee name/email
                const sub0 = subGroup[0];

                const contents = `<p>Dear ${sub0.attendee?.displayName},</p>
<p>You have received new messages on Clowdr in the following chats:</p>
<ul>
${subGroup.map((sub) => {
    const name =
        sub.chat?.contentGroup && sub.chat.contentGroup.length > 0
            ? sub.chat?.contentGroup[0].title
            : sub.chat?.room[0].name;
    const link =
        sub.chat?.contentGroup && sub.chat.contentGroup.length > 0
            ? "item/" + sub.chat?.contentGroup[0].id
            : "room/" + sub.chat?.room[0].id;
    return `<li><a href="${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/conference/${sub.chat?.conference?.slug}/${link}">${name}</a></li>`;
})}
</ul>
<p>The Clowdr team
</p>
<p>You are receiving this email because you have subscribed to notifications for these chats in Clowdr.
To unsubscribe from a chat, please log in and click the bell icon on the chat's page.</p>
<p>This is an automated email sent on behalf of Clowdr CIC. If you believe you have received this
email in error, please contact us via ${process.env.STOP_EMAILS_CONTACT_EMAIL_ADDRESS}.</p>`;

                return [
                    ...acc,
                    {
                        emailAddress: sub0.attendee?.user?.email,
                        reason: "Unnotified messages",
                        subject: "Clowdr: You have new messages",
                        userId: sub0.attendee?.user?.id,
                        htmlContents: contents,
                        plainTextContents: htmlToText(contents),
                    },
                ];
            }
            return acc;
        }, [])
    );
}

gql`
    query ChatsWithoutRemoteServiceIds {
        chat_Chat(where: { remoteServiceId: { _is_null: true } }, order_by: { created_at: desc }, limit: 30) {
            id
        }
    }

    query Chat_SelectAttendeeIds($omitAttendeeIds: [uuid!]!) {
        Attendee(where: { id: { _nin: $omitAttendeeIds } }, order_by: { createdAt: desc }, limit: 30) {
            id
        }
    }

    mutation SetChatRemoteServiceId($id: uuid!, $remoteServiceId: String!) {
        update_chat_Chat_by_pk(pk_columns: { id: $id }, _set: { remoteServiceId: $remoteServiceId }) {
            id
        }
    }

    query AttemptToMatchAttendeeAndUser($userId: String!, $attendeeId: uuid!) {
        Attendee(where: { userId: { _eq: $userId }, id: { _eq: $attendeeId } }) {
            id
        }
    }
`;

const accountSID = process.env.CHAT_REMOTE_SERVICE_ACCOUNT_SID as string;
const apiKey = process.env.CHAT_REMOTE_SERVICE_API_KEY as string;
const apiSecret = process.env.CHAT_REMOTE_SERVICE_API_SECRET as string;
const serviceSID = process.env.CHAT_REMOTE_SERVICE_SERVICE_SID as string;
const authToken = process.env.CHAT_REMOTE_SERVICE_AUTH_TOKEN as string;

assert(accountSID, "Missing CHAT_REMOTE_SERVICE_ACCOUNT_SID");
assert(apiKey, "Missing CHAT_REMOTE_SERVICE_API_KEY");
assert(apiSecret, "Missing CHAT_REMOTE_SERVICE_API_SECRET");
assert(serviceSID, "Missing CHAT_REMOTE_SERVICE_SERVICE_SID");
assert(authToken, "Missing CHAT_REMOTE_SERVICE_AUTH_TOKEN");

function createRemoteChatServiceClient() {
    const remoteChatProvider = Twilio(accountSID, authToken);
    const remoteChatService = remoteChatProvider.chat.services(serviceSID);
    return remoteChatService;
}

export async function generateRemoteServiceIds(): Promise<void> {
    console.log("Chat: Generating some remote service ids");

    const chats = await apolloClient.query({
        query: ChatsWithoutRemoteServiceIdsDocument,
    });

    const remoteChatService = createRemoteChatServiceClient();
    const errors = await Promise.all(
        chats.data.chat_Chat.map(async (chat) => {
            try {
                const channel = await callWithRetry(async () => {
                    return await remoteChatService.channels.create({
                        friendlyName: chat.id,
                        uniqueName: chat.id,
                        type: "public",
                    });
                });
                await apolloClient.mutate({
                    mutation: SetChatRemoteServiceIdDocument,
                    variables: {
                        id: chat.id,
                        remoteServiceId: channel.sid,
                    },
                });
                return false;
            } catch (e) {
                console.error(`Error creating remote chat service for ${chat.id}`, e);
                return true;
            }
        })
    );

    if (errors.reduce((acc, x) => acc || x, false)) {
        throw new Error("One or more errors while generating remote chat service ids");
    }
}

export async function generateRemoteServiceId(chatId: string): Promise<void> {
    const remoteChatService = createRemoteChatServiceClient();
    const channel = await callWithRetry(async () => {
        return await remoteChatService.channels.create({
            friendlyName: chatId,
            uniqueName: chatId,
            type: "public",
        });
    });
    await apolloClient.mutate({
        mutation: SetChatRemoteServiceIdDocument,
        variables: {
            id: chatId,
            remoteServiceId: channel.sid,
        },
    });
}

export async function generateRemoteUserIds(): Promise<void> {
    const remoteChatService = createRemoteChatServiceClient();
    const existingRemoteUsers = (await remoteChatService.users.list())
        .map((x) => x.identity)
        .filter((x) => uuidValidate(x));
    const userIdsToCreate = (
        await apolloClient.query({
            query: Chat_SelectAttendeeIdsDocument,
            variables: {
                omitAttendeeIds: existingRemoteUsers,
            },
        })
    ).data.Attendee.map((x) => x.id);
    await Promise.all(
        userIdsToCreate.map(async (userId) => {
            await callWithRetry(() =>
                remoteChatService.users.create({
                    identity: userId,
                    friendlyName: userId,
                })
            );
        })
    );
}

export async function generateRemoteUserId(attendeeId: string): Promise<void> {
    const remoteChatService = createRemoteChatServiceClient();
    await callWithRetry(() =>
        remoteChatService.users.create({
            identity: attendeeId,
            friendlyName: attendeeId,
        })
    );
}

export async function generateRemoteServiceToken(
    userId: string,
    attendeeId: string
): Promise<{
    jwt: string;
    expiry: number;
}> {
    const matchingAttendees = await apolloClient.query({
        query: AttemptToMatchAttendeeAndUserDocument,
        variables: {
            attendeeId,
            userId,
        },
    });

    if (matchingAttendees.data.Attendee.length > 0) {
        const grant = new ChatGrant({
            serviceSid: serviceSID,
            // endpointId: `${identity}:browser:${sessionID}:${now}`
        });
        const ttl = 3600 * 3;
        const token = new AccessToken(accountSID, apiKey, apiSecret, {
            identity: attendeeId,
            ttl,
        });
        token.addGrant(grant);
        return {
            jwt: token.toJwt(),
            expiry: Date.now() + ttl * 1000,
        };
    } else {
        throw new Error("User and attendee do not match!");
    }
}

gql`
    query GetChatRemoteServiceId($chatId: uuid!) {
        chat_Chat_by_pk(id: $chatId) {
            id
            remoteServiceId
        }
    }

    query GetChatAndMessageRemoteServiceId($messageId: Int!) {
        chat_Message_by_pk(id: $messageId) {
            id
            remoteServiceId

            chat {
                id
                remoteServiceId
            }
        }
    }

    query GetChatRemoteServiceIdAndReactions($chatId: uuid!, $messageId: Int!) {
        chat_Chat_by_pk(id: $chatId) {
            id
            remoteServiceId
        }
        chat_Reaction(where: { messageId: { _eq: $messageId } }) {
            id
            created_at
            updated_at
            messageId
            type
            senderId
            symbol
            data
            duplicateId
            remoteServiceId
        }
    }

    mutation SetMessageRemoteServiceId($messageId: Int!, $remoteServiceId: String!) {
        update_chat_Message_by_pk(pk_columns: { id: $messageId }, _set: { remoteServiceId: $remoteServiceId }) {
            id
        }
    }
`;

function reactionRemoteData(reaction: ReactionData) {
    return reaction;
}

function messageRemoteData(message: MessageData, reactions: ReactionData[]) {
    return {
        attributes: JSON.stringify({
            id: message.id,
            data: message.data,
            duplicatedMessageId: message.duplicatedMessageId,
            isPinned: message.isPinned,
            systemId: message.systemId,
            type: message.type,
            reactions: reactions.map(reactionRemoteData),
        }),
        body: message.message,
        dateCreated: new Date(message.created_at),
        dateUpdated: new Date(message.updated_at),
        from: message.senderId ?? "system",
    };
}

export async function handleMessageInserted(message: MessageData): Promise<void> {
    const remoteChatService = createRemoteChatServiceClient();
    const chatRemoteServiceId = (
        await callWithRetry(() =>
            apolloClient.query({
                query: GetChatRemoteServiceIdDocument,
                variables: {
                    chatId: message.chatId,
                },
            })
        )
    ).data.chat_Chat_by_pk?.remoteServiceId;
    if (chatRemoteServiceId) {
        const channel = remoteChatService.channels(chatRemoteServiceId);
        const messageRemoteServiceId = (
            await callWithRetry(() => channel.messages.create(messageRemoteData(message, []), undefined))
        ).sid;
        await callWithRetry(() =>
            apolloClient.mutate({
                mutation: SetMessageRemoteServiceIdDocument,
                variables: {
                    messageId: message.id,
                    remoteServiceId: messageRemoteServiceId,
                },
            })
        );
    } else {
        console.warn(
            `Treat as error: Could not deliver message ${message.id} to remote service because the chat's remote service id did not exist.`
        );
    }
}

export async function handleMessageUpdated(message: MessageData): Promise<void> {
    if (message.remoteServiceId) {
        const remoteChatService = createRemoteChatServiceClient();
        const data = (
            await callWithRetry(() =>
                apolloClient.query({
                    query: GetChatRemoteServiceIdAndReactionsDocument,
                    variables: {
                        chatId: message.chatId,
                        messageId: message.id,
                    },
                })
            )
        ).data;
        if (data.chat_Chat_by_pk?.remoteServiceId) {
            const channel = remoteChatService.channels(data.chat_Chat_by_pk.remoteServiceId);
            const remoteMessage = channel.messages(message.remoteServiceId);
            await callWithRetry(() => remoteMessage.update(messageRemoteData(message, data.chat_Reaction)));
        }
    }
}

export async function handleMessageDeleted(message: MessageData): Promise<void> {
    if (message.remoteServiceId) {
        const remoteChatService = createRemoteChatServiceClient();
        const data = (
            await callWithRetry(() =>
                apolloClient.query({
                    query: GetChatRemoteServiceIdDocument,
                    variables: {
                        chatId: message.chatId,
                    },
                })
            )
        ).data;
        if (data.chat_Chat_by_pk?.remoteServiceId) {
            const channel = remoteChatService.channels(data.chat_Chat_by_pk.remoteServiceId);
            const remoteMessage = channel.messages(message.remoteServiceId);
            await callWithRetry(() => remoteMessage.remove());
        }
    }
}

export async function handleReactionInserted(reaction: ReactionData): Promise<void> {
    const remoteChatService = createRemoteChatServiceClient();
    const data = (
        await callWithRetry(() =>
            apolloClient.query({
                query: GetChatAndMessageRemoteServiceIdDocument,
                variables: {
                    messageId: reaction.messageId,
                },
            })
        )
    ).data;

    if (data.chat_Message_by_pk?.remoteServiceId && data.chat_Message_by_pk.chat.remoteServiceId) {
        const channel = remoteChatService.channels(data.chat_Message_by_pk.chat.remoteServiceId);
        const remoteMessage = await channel.messages(data.chat_Message_by_pk.remoteServiceId).fetch();
        const attrs = JSON.parse(remoteMessage.attributes);
        attrs.reactions.push(reactionRemoteData(reaction));
        await callWithRetry(() =>
            remoteMessage.update({
                attributes: JSON.stringify(attrs),
            })
        );
    }
}

export async function handleReactionUpdated(reaction: ReactionData): Promise<void> {
    const remoteChatService = createRemoteChatServiceClient();
    const data = (
        await callWithRetry(() =>
            apolloClient.query({
                query: GetChatAndMessageRemoteServiceIdDocument,
                variables: {
                    messageId: reaction.messageId,
                },
            })
        )
    ).data;

    if (data.chat_Message_by_pk?.remoteServiceId && data.chat_Message_by_pk.chat.remoteServiceId) {
        const channel = remoteChatService.channels(data.chat_Message_by_pk.chat.remoteServiceId);
        const remoteMessage = await channel.messages(data.chat_Message_by_pk.remoteServiceId).fetch();
        const attrs = JSON.parse(remoteMessage.attributes);
        attrs.reactions = attrs.reactions.map((x: any) => (x.id === reaction.id ? reactionRemoteData(reaction) : x));
        await callWithRetry(() =>
            remoteMessage.update({
                attributes: JSON.stringify(attrs),
            })
        );
    }
}

export async function handleReactionDeleted(reaction: ReactionData): Promise<void> {
    const remoteChatService = createRemoteChatServiceClient();
    const data = (
        await callWithRetry(() =>
            apolloClient.query({
                query: GetChatAndMessageRemoteServiceIdDocument,
                variables: {
                    messageId: reaction.messageId,
                },
            })
        )
    ).data;

    if (data.chat_Message_by_pk?.remoteServiceId && data.chat_Message_by_pk.chat.remoteServiceId) {
        const channel = remoteChatService.channels(data.chat_Message_by_pk.chat.remoteServiceId);
        const remoteMessage = await channel.messages(data.chat_Message_by_pk.remoteServiceId).fetch();
        const attrs = JSON.parse(remoteMessage.attributes);
        attrs.reactions = attrs.reactions.filter((x: any) => x.id !== reaction.id);
        await callWithRetry(() =>
            remoteMessage.update({
                attributes: JSON.stringify(attrs),
            })
        );
    }
}
