import { gql } from "@apollo/client/core";
import sgMail from "@sendgrid/mail";
import assert from "assert";
import { apolloClient } from "../graphqlClient";
import { EmailData, Payload } from "../types/hasura/event";
import { callWithRetry } from "../utils";

export async function handleEmailCreated(payload: Payload<EmailData>): Promise<void> {
    if (!payload.event.data.new) {
        throw new Error("No new email data");
    }

    const email = payload.event.data.new;

    if (email.sentAt === null && email.retriesCount < 3) {
        assert(process.env.SENDGRID_SENDER);

        const msg = {
            to: email.emailAddress,
            from: process.env.SENDGRID_SENDER,
            subject: email.subject,
            text: email.plainTextContents,
            html: email.htmlContents,
        };

        let error;
        try {
            await callWithRetry(() => sgMail.send(msg));
        } catch (e) {
            error = e;
        }

        await apolloClient.mutate({
            mutation: gql`
                mutation UpdateEmail($id: uuid!, $sentAt: timestamptz = null) {
                    update_Email(where: { id: { _eq: $id } }, _set: { sentAt: $sentAt }, _inc: { retriesCount: 1 }) {
                        affected_rows
                    }
                }
            `,
            variables: {
                id: email.id,
                sentAt: error ? null : new Date().toISOString(),
            },
        });

        if (error) {
            throw error;
        }
    }
}
