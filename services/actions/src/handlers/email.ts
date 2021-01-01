import assert from "assert";
import { gql } from "@apollo/client/core";
import { MarkAndSelectUnsentEmailsDocument, UnmarkUnsentEmailsDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import sgMail from "@sendgrid/mail";
import { callWithRetry } from "../utils";

gql`
    mutation MarkAndSelectUnsentEmails($sentAt: timestamptz!) {
        update_Email(where: { sentAt: { _is_null: true } }, _set: { sentAt: $sentAt }, _inc: { retriesCount: 1 }) {
            returning {
                emailAddress
                htmlContents
                plainTextContents
                id
                subject
                retriesCount
            }
        }
    }

    mutation UnmarkUnsentEmails($ids: [uuid!]!) {
        update_Email(where: { id: { _in: $ids } }, _set: { sentAt: null }) {
            affected_rows
        }
    }
`;

export async function processEmailsJobQueue(): Promise<void> {
    assert(process.env.SENDGRID_SENDER, "SENDGRID_SENDER env var not set!");

    const emailsToSend = await apolloClient.mutate({
        mutation: MarkAndSelectUnsentEmailsDocument,
        variables: {
            sentAt: new Date().toISOString()
        }
    });
    assert(emailsToSend.data?.update_Email, "Failed to fetch emails to send.");

    const unsuccessfulEmailIds: string[] = [];
    for (const email of emailsToSend.data.update_Email.returning) {
        try {
            if (email.retriesCount < 3) {
                const msg = {
                    to: email.emailAddress,
                    from: process.env.SENDGRID_SENDER,
                    subject: email.subject,
                    text: email.plainTextContents,
                    html: email.htmlContents,
                };
                await callWithRetry(() => sgMail.send(msg));
            }
        } catch (e) {
            console.error(`Could not send email ${email.id}: ${e.toString()}`);
            unsuccessfulEmailIds.push(email.id);
        }
    }

    try {
        await callWithRetry(async () => {
            await apolloClient.mutate({
                mutation: UnmarkUnsentEmailsDocument,
                variables: {
                    ids: unsuccessfulEmailIds
                }
            });
        });
    }
    catch (e) {
        console.error(`Could not unmark failed emails: ${e.toString()}`);
    }
}
