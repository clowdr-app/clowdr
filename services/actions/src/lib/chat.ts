import { gql } from "@apollo/client/core";
import { htmlToText } from "html-to-text";
import {
    AllUnnotifiedSubscriptionsDocument,
    Chat_ReadUpToIndex_Insert_Input,
    Email_Insert_Input,
    SubWithUnnotifMsgsFragment,
    UpsertReadUpToIndicesDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { insertEmails } from "../handlers/email";

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
