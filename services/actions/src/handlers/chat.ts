import { gql } from "@apollo/client/core";
import type { FlagData, Payload } from "@midspace/hasura/event";
import assert from "assert";
import type { P } from "pino";
import { FlagInserted_GetSupportAddressDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { awsClient } from "../lib/aws/awsClient";
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

export async function handleFlagInserted(logger: P.Logger, data: Payload<FlagData>): Promise<void> {
    const newFlag = data.event.data.new;
    if (newFlag) {
        const response = await (
            await apolloClient
        ).query({
            query: FlagInserted_GetSupportAddressDocument,
            variables: {
                messageSId: newFlag.messageSId,
            },
        });

        assert(response.data?.chat_Message.length, "Chat message not retrieved");

        const conference = response.data.chat_Message[0].chat.conference;
        if (conference.supportAddress.length > 0) {
            await insertEmails(
                logger,
                [
                    {
                        recipientName: "Conference Organiser",
                        emailAddress: conference.supportAddress[0].value,
                        reason: "chat_moderation_report",
                        subject: "[HIGH PRIORITY] Chat message reported in " + conference.shortName,
                        htmlContents: `<p>Dear ${conference.shortName} support,</p>
<p>This is an automated email to let you know that a message has been reported
in your conference and needs your attention. Please go to the 
<a href="{{frontendHost}}/conference/${conference.slug}/manage/chats/moderation">moderation hub</a>
to view and resolve the report.</p>
`,
                    },
                ],
                conference.id,
                `flag-inserted-organiser:${data.id}`
            );
        } else {
            const FAILURE_NOTIFICATIONS_EMAIL_ADDRESS = await awsClient.getAWSParameter(
                "FAILURE_NOTIFICATIONS_EMAIL_ADDRESS"
            );
            await insertEmails(
                logger,
                [
                    {
                        recipientName: "System Administrator",
                        emailAddress: FAILURE_NOTIFICATIONS_EMAIL_ADDRESS,
                        reason: "chat_moderation_report",
                        subject: "[HIGH PRIORITY] Chat message reported in " + conference.shortName,
                        htmlContents: `<p>This is an automated email. A message has been reported
in ${conference.shortName} and needs attention. Please go to the 
<a href="{{frontendHost}}/conference/${conference.slug}/manage/chats/moderation">moderation hub</a>
to view and resolve the report.</p>
`,
                    },
                ],
                conference.id,
                `flag-inserted-administrator:${data.id}`
            );
        }
    }
}
