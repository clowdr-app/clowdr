import { gql } from "@apollo/client/core";
import sgMail from "@sendgrid/mail";
import assert from "assert";
import { compile } from "handlebars";
import { htmlToText } from "html-to-text";
import wcmatch from "wildcard-match";
import type { Email_Insert_Input } from "../generated/graphql";
import {
    ConferenceEmailConfigurationDocument,
    GetSendGridConfigDocument,
    InsertEmailsDocument,
    MarkAndSelectUnsentEmailsDocument,
    SelectUnsentEmailIdsDocument,
    UnmarkUnsentEmailsDocument,
    UpdateEmailStatusDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import type { EmailTemplateContext } from "../lib/email/emailTemplate";
import { EmailBuilder, getEmailTemplate } from "../lib/email/emailTemplate";
import { formatSendingReason } from "../lib/email/sendingReasons";
import { callWithRetry } from "../utils";

gql`
    query ConferenceEmailConfiguration($conferenceId: uuid, $includeConferenceFields: Boolean!) {
        support: conference_Configuration(
            where: { conferenceId: { _eq: $conferenceId }, key: { _eq: SUPPORT_ADDRESS } }
        ) @include(if: $includeConferenceFields) {
            key
            value
        }
        techSupport: conference_Configuration(
            where: { conferenceId: { _eq: $conferenceId }, key: { _eq: TECH_SUPPORT_ADDRESS } }
        ) @include(if: $includeConferenceFields) {
            key
            value
        }
        hostOrganisationName: system_Configuration_by_pk(key: HOST_ORGANISATION_NAME) {
            key
            value
        }
        stopEmails: system_Configuration_by_pk(key: STOP_EMAILS_CONTACT_EMAIL_ADDRESS) {
            key
            value
        }

        frontendHost: conference_Configuration(
            where: { conferenceId: { _eq: $conferenceId }, key: { _eq: FRONTEND_HOST } }
        ) @include(if: $includeConferenceFields) {
            key
            value
        }
        defaultFrontendHost: system_Configuration_by_pk(key: DEFAULT_FRONTEND_HOST) {
            key
            value
        }
        allowEmailsToDomains: system_Configuration_by_pk(key: ALLOW_EMAILS_TO_DOMAINS) {
            key
            value
        }

        conference_Conference(where: { id: { _eq: $conferenceId } }) @include(if: $includeConferenceFields) {
            shortName
        }
    }

    mutation InsertEmails($objects: [Email_insert_input!]!) {
        insert_Email(objects: $objects, on_conflict: { constraint: Email_idempotencyKey_key, update_columns: [] }) {
            affected_rows
        }
    }
`;

export const EMAIL_IDEMPOTENCY_NAMESPACE = "315a82fd-feeb-4aa6-86b5-261252c290d1";

export async function insertEmails(
    emails: Email_Insert_Input[],
    conferenceId: string | undefined,
    jobId: string | undefined
): Promise<number | undefined> {
    const configResponse = await apolloClient.query({
        query: ConferenceEmailConfigurationDocument,
        variables: {
            conferenceId,
            includeConferenceFields: Boolean(conferenceId),
        },
    });

    const supportAddress = configResponse.data.support?.[0]?.value ?? undefined;
    const techSupportAddress = configResponse.data.techSupport?.[0]?.value ?? undefined;
    const frontendHost =
        configResponse.data.frontendHost?.[0]?.value ??
        configResponse.data.defaultFrontendHost?.value ??
        "Error: Host not configured";
    let allowedDomains: string[] = configResponse.data.allowEmailsToDomains?.value;
    if (!allowedDomains) {
        allowedDomains = [];
        console.error("Error! Allowed domains is misconfigured - value is not defined");
    }
    if (!(allowedDomains instanceof Array)) {
        allowedDomains = [];
        console.error("Error! Allowed domains is misconfigured - value is not an array");
    }
    if (!allowedDomains.every((x) => typeof x === "string")) {
        allowedDomains = [];
        console.error("Error! Allowed domains is misconfigured - array elements are not strings");
    }
    if (allowedDomains.length === 0) {
        console.error("Error! Allowed domains is misconfigured - array is empty");
    }
    const allowedDomainMatches = allowedDomains.map((x) => wcmatch(x));

    const defaultEmailTemplate = await getEmailTemplate();
    const emailBuilder = new EmailBuilder(defaultEmailTemplate);

    const hostOrganisationName = configResponse.data.hostOrganisationName?.value;
    const stopEmailsAddress = configResponse.data.stopEmails?.value;
    const conferenceName = configResponse.data.conference_Conference?.[0]?.shortName;
    assert(hostOrganisationName, "Host organisation name not configured - missing system configuration");
    assert(stopEmailsAddress, "Stop emails address not configured - missing system configuration");

    const htmlUnsubscribeDetails = `This is an automated email sent on behalf of Midspace, operated by ${hostOrganisationName}. If you believe you have received this email in error, please contact us via <a href="mailto:${stopEmailsAddress}">${stopEmailsAddress}</a>`;

    const context: Omit<EmailTemplateContext, "htmlBody" | "subject" | "excerpt" | "sendingReason"> = {
        frontendHost,
        hostOrganisationName,
        htmlUnsubscribeDetails,
        stopEmailsAddress,
        supportAddress,
        techSupportAddress,
    };

    const emailsToInsert: Email_Insert_Input[] = emails
        .filter(
            (email) =>
                !!email.htmlContents &&
                email.emailAddress &&
                allowedDomainMatches.some((f) => email.emailAddress && f(email.emailAddress))
        )
        .map((email) => {
            const htmlContents = email.htmlContents as string;
            const subject = email.subject ?? `An update from ${hostOrganisationName}`;
            const sendingReason = formatSendingReason(email.reason ?? "", conferenceName ?? null) ?? "";
            const htmlBody = compile(htmlContents)({
                frontendHost,
            });
            const compiledEmail = emailBuilder.compile({
                ...context,
                htmlBody,
                subject,
                sendingReason,
            });
            return {
                ...email,
                subject: compiledEmail.subject,
                htmlContents: compiledEmail.body,
                plainTextContents: htmlToText(compiledEmail.body),
                status: "processing",
            };
        });

    const batchSize = 100;
    const batches = Math.ceil(emailsToInsert.length / batchSize);

    console.log("Queuing emails to send", {
        totalEmails: emails.length,
        permittedEmails: emailsToInsert.length,
        batches: batches,
        message:
            emailsToInsert.length < emails.length
                ? "Check ALLOW_EMAILS_TO_DOMAINS system configuration is configured correctly."
                : undefined,
        jobId,
    });

    let insertedCount = 0;

    for (let i = 0; i < batches; i++) {
        const batch = emailsToInsert.slice(i * batchSize, (i + 1) * batchSize);
        const r = await apolloClient.mutate({
            mutation: InsertEmailsDocument,
            variables: {
                objects: batch,
            },
        });
        insertedCount += r.data?.insert_Email?.affected_rows ?? 0;
        console.log("Queued email batch", {
            insertedCount: r.data?.insert_Email?.affected_rows,
            batchSize: batch.length,
            batchNumber: i + 1,
            batches,
            jobId,
        });
    }

    console.log("Finished queuing emails", { jobId, batches, insertedCount });
    return insertedCount;
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
                recipientName
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

gql`
    query GetSendGridConfig {
        apiKey: system_Configuration_by_pk(key: SENDGRID_API_KEY) {
            value
        }
        senderEmail: system_Configuration_by_pk(key: SENDGRID_SENDER) {
            value
        }
        senderName: system_Configuration_by_pk(key: SENDGRID_SENDER_NAME) {
            value
        }
        replyTo: system_Configuration_by_pk(key: SENDGRID_REPLYTO) {
            value
        }
        webhookPublicKey: system_Configuration_by_pk(key: SENDGRID_WEBHOOK_PUBLIC_KEY) {
            value
        }
    }
`;

let sgMailInitialised:
    | false
    | {
          apiKey: string;
          sender: string | { name: string; email: string };
          replyTo: string;
          webhookPublicKey: string;
      } = false;
export async function initSGMail(): Promise<
    | false
    | {
          apiKey: string;
          sender: string | { name: string; email: string };
          replyTo: string;
          webhookPublicKey: string;
      }
> {
    if (!sgMailInitialised) {
        try {
            const response = await apolloClient.query({
                query: GetSendGridConfigDocument,
            });
            if (!response.data.apiKey) {
                console.error("Unable to initialise SendGrid email. SendGrid API Key not configured");
                return false;
            }
            if (!response.data.senderEmail) {
                console.error("Unable to initialise SendGrid email. SendGrid Sender not configured");
                return false;
            }
            if (!response.data.replyTo) {
                console.error("Unable to initialise SendGrid email. SendGrid Reply-To not configured");
                return false;
            }
            if (!response.data.webhookPublicKey) {
                console.error(
                    "Unable to initialise SendGrid email. SendGrid Webhook Verification Public Key not configured"
                );
                return false;
            }

            sgMail.setApiKey(response.data.apiKey.value);
            sgMailInitialised = {
                apiKey: response.data.apiKey.value,
                sender: response.data.senderName
                    ? { email: response.data.senderEmail.value, name: response.data.senderName.value }
                    : response.data.senderEmail.value,
                replyTo: response.data.replyTo.value,
                webhookPublicKey: response.data.webhookPublicKey.value,
            };
        } catch (e) {
            console.error("Failed to initialise SendGrid mail", e);
        }
    }

    return sgMailInitialised;
}

export async function processEmailsJobQueue(): Promise<void> {
    const sgConfig = await initSGMail();
    if (sgConfig) {
        const sender = sgConfig.sender;
        const replyToAddress = sgConfig.replyTo;

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
                        const msg: sgMail.MailDataRequired = {
                            to: email.recipientName
                                ? { name: email.recipientName, email: email.emailAddress }
                                : email.emailAddress,
                            from: sender,
                            subject: email.subject,
                            text: email.plainTextContents,
                            html: email.htmlContents,
                            replyTo: replyToAddress,
                            customArgs: {
                                midspaceEmailId: email.id,
                            },
                        };
                        await callWithRetry(() => sgMail.send(msg));
                    }
                } catch (e: any) {
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
        } catch (e: any) {
            console.error(`Could not unmark failed emails: ${e.toString()}`);
        }
    } else {
        console.warn(
            "Unable to send email - could not initialise email client. Perhaps a system configuration key is missing?"
        );
    }
}

gql`
    mutation UpdateEmailStatus($id: uuid!, $status: String!, $errorMessage: String) {
        update_Email_by_pk(pk_columns: { id: $id }, _set: { status: $status, errorMessage: $errorMessage }) {
            id
        }
    }
`;

export async function processEmailWebhook(payloads: Record<string, any>[]): Promise<void> {
    const completedIds = new Set<string>();
    for (const payload of payloads) {
        const eventName = payload.event;
        const midspaceEmailId = payload.midspaceEmailId;
        if (eventName && typeof eventName === "string" && midspaceEmailId && typeof midspaceEmailId === "string") {
            let status: string;
            let errorMessage: string | null = null;
            switch (eventName) {
                case "processed":
                    status = "processed";
                    break;
                case "dropped":
                    status = "dropped";
                    errorMessage = payload.reason;
                    completedIds.add(midspaceEmailId);
                    break;
                case "delivered":
                    status = "delivered";
                    completedIds.add(midspaceEmailId);
                    break;
                case "deferred":
                    status = "deferred";
                    errorMessage = payload.response;
                    completedIds.add(midspaceEmailId);
                    break;
                case "bounce":
                    status = "bounce";
                    errorMessage = payload.reason;
                    completedIds.add(midspaceEmailId);
                    break;
                case "blocked":
                    status = "blocked";
                    errorMessage = payload.reason;
                    completedIds.add(midspaceEmailId);
                    break;
                default:
                    throw new Error("Unrecognised webhook event");
            }
            if (status !== "processed" || !completedIds.has(midspaceEmailId)) {
                console.log(
                    `Email webhook: Setting email status: { "midspaceEmailId": "${midspaceEmailId}", "status": "${status}", "errorMessage": "${errorMessage}" }`
                );
                await apolloClient.mutate({
                    mutation: UpdateEmailStatusDocument,
                    variables: {
                        id: midspaceEmailId,
                        status,
                        errorMessage,
                    },
                });
            }
        }
    }
}
