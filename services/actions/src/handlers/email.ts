import { gql } from "@apollo/client/core";
import sgMail from "@sendgrid/mail";
import assert from "assert";
import {
    Email_Insert_Input,
    InsertEmailsDocument,
    MarkAndSelectUnsentEmailsDocument,
    SelectUnsentEmailIdsDocument,
    UnmarkUnsentEmailsDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { callWithRetry } from "../utils";

gql`
    mutation InsertEmails($objects: [Email_insert_input!]!) {
        insert_Email(objects: $objects) {
            affected_rows
        }
    }
`;

export async function insertEmails(emails: Email_Insert_Input[]): Promise<number | undefined> {
    console.log(`Queuing ${emails.length} emails to send`);
    const r = await apolloClient.mutate({
        mutation: InsertEmailsDocument,
        variables: {
            objects: emails,
        },
    });
    return r.data?.insert_Email?.affected_rows;
}

gql`
    query SelectUnsentEmailIds {
        Email(where: { sentAt: { _is_null: true } }, limit: 300) {
            id
        }
    }

    mutation MarkAndSelectUnsentEmails($ids: [uuid!]!, $sentAt: timestamptz!) {
        update_Email(
            where: { id: { _in: $ids }, sentAt: { _is_null: true } }
            _set: { sentAt: $sentAt }
            _inc: { retriesCount: 1 }
        ) {
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
    const senderAddress = process.env.SENDGRID_SENDER;

    const unsentEmailIds = await apolloClient.query({
        query: SelectUnsentEmailIdsDocument,
    });
    const emailsToSend = await apolloClient.mutate({
        mutation: MarkAndSelectUnsentEmailsDocument,
        variables: {
            ids: unsentEmailIds.data.Email.map((x) => x.id),
            sentAt: new Date().toISOString(),
        },
    });
    assert(emailsToSend.data?.update_Email, "Failed to fetch emails to send.");

    const unsuccessfulEmailIds: (string | undefined)[] = await Promise.all(
        emailsToSend.data.update_Email.returning.map(async (email) => {
            try {
                if (email.retriesCount < 3) {
                    const msg = {
                        to: email.emailAddress,
                        from: senderAddress,
                        subject: email.subject,
                        text: email.plainTextContents,
                        html: email.htmlContents,
                    };
                    await callWithRetry(() => sgMail.send(msg));
                }
            } catch (e) {
                console.error(`Could not send email ${email.id}: ${e.toString()}`);
                return email.id;
            }
            return undefined;
        })
    );

    try {
        await callWithRetry(async () => {
            await apolloClient.mutate({
                mutation: UnmarkUnsentEmailsDocument,
                variables: {
                    ids: unsuccessfulEmailIds.filter((x) => !!x),
                },
            });
        });
    } catch (e) {
        console.error(`Could not unmark failed emails: ${e.toString()}`);
    }
}
