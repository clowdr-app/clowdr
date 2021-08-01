import { gql } from "@apollo/client/core";
import assert from "assert";
import { FlagInserted_GetSupportAddressDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { FlagData, Payload } from "../types/hasura/event";
import { insertEmails } from "./email";

gql`
    query FlagInserted_GetSupportAddress($messageSId: uuid!) {
        chat_Message(where: { sId: { _eq: $messageSId } }) {
            chat {
                conference {
                    id
                    name
                    shortName
                    slug

                    supportAddress: configurations(where: { key: { _eq: SUPPORT_ADDRESS } }) {
                        conferenceId
                        key
                        value
                    }
                }
            }
        }
    }
`;

export async function handleFlagInserted(data: Payload<FlagData>): Promise<void> {
    const newFlag = data.event.data.new;
    if (newFlag) {
        const response = await apolloClient.query({
            query: FlagInserted_GetSupportAddressDocument,
            variables: {
                messageSId: newFlag.messageSId,
            },
        });

        assert(response.data?.chat_Message.length, "Chat message not retrieved");

        const conference = response.data.chat_Message[0].chat.conference;
        if (conference.supportAddress.length > 0) {
            await insertEmails(
                [
                    {
                        emailAddress: conference.supportAddress[0].value,
                        reason: "chat_moderation_report",
                        subject: "[HIGH PRIORITY] Chat message reported in " + conference.shortName,
                        htmlContents: `<p>Dear ${conference.shortName} support,</p>
<p>This is an automated email to let you know that a message has been reported
in your conference and needs your attention. Please go to the 
<a href="${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/conference/${conference.slug}/manage/chats/moderation">moderation hub</a>
to view and resolve the report.</p>
`,
                    },
                ],
                conference.id
            );
        } else {
            await insertEmails(
                [
                    {
                        emailAddress: process.env.FAILURE_NOTIFICATIONS_EMAIL_ADDRESS,
                        reason: "chat_moderation_report",
                        subject: "[HIGH PRIORITY] Chat message reported in " + conference.shortName,
                        htmlContents: `<p>This is an automated email. A message has been reported
in ${conference.shortName} and needs attention. Please go to the 
<a href="${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/conference/${conference.slug}/manage/chats/moderation">moderation hub</a>
to view and resolve the report.</p>
`,
                    },
                ],
                conference.id
            );
        }
    }
}
