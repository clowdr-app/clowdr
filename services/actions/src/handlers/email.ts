import { gql } from "@apollo/client/core";
import sgMail from "@sendgrid/mail";
import assert from "assert";
import { compile } from "handlebars";
import { htmlToText } from "html-to-text";
import type { P } from "pino";
import wcmatch from "wildcard-match";
import type { Email_Insert_Input } from "../generated/graphql";
import {
    ConferenceEmailConfigurationDocument,
    GetSendGridConfigDocument,
    InsertEmailsDocument,
    MarkAndSelectUnsentEmailsDocument,
    SelectUnsentEmailIdsDocument,
    UnmarkUnsentEmailsDocument,
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
        insert_Email(objects: $objects) {
            affected_rows
        }
    }
`;

export async function insertEmails(
    logger: P.Logger,
    emails: Email_Insert_Input[],
    conferenceId: string | undefined
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
        logger.error("Error! Allowed domains is misconfigured - value is not defined");
    }
    if (!(allowedDomains instanceof Array)) {
        allowedDomains = [];
        logger.error("Error! Allowed domains is misconfigured - value is not an array");
    }
    if (!allowedDomains.every((x) => typeof x === "string")) {
        allowedDomains = [];
        logger.error("Error! Allowed domains is misconfigured - array elements are not strings");
    }
    if (allowedDomains.length === 0) {
        logger.error("Error! Allowed domains is misconfigured - array is empty");
    }
    const allowedDomainMatches = allowedDomains.map((x) => wcmatch(x));

    const defaultEmailTemplate = await getEmailTemplate(logger);
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

    const emailsToInsert = emails
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
            };
        });
    if (emailsToInsert.length < emails.length) {
        logger.info(
            { emailsToInsert: emailsToInsert.length, totalEmails: emails.length },
            `${emailsToInsert.length} of ${emails.length} are being sent. Check ALLOW_EMAILS_TO_DOMAINS system configuration is configured correctly.`
        );
    }

    logger.info({ emailsToInsert: emailsToInsert.length }, `Queuing ${emailsToInsert.length} emails to send`);
    const r = await apolloClient.mutate({
        mutation: InsertEmailsDocument,
        variables: {
            objects: emailsToInsert,
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
    }
`;

let sgMailInitialised:
    | false
    | {
          apiKey: string;
          sender: string | { name: string; email: string };
          replyTo: string;
      } = false;
async function initSGMail(logger: P.Logger): Promise<
    | false
    | {
          apiKey: string;
          sender: string | { name: string; email: string };
          replyTo: string;
      }
> {
    if (!sgMailInitialised) {
        try {
            const response = await apolloClient.query({
                query: GetSendGridConfigDocument,
            });
            if (!response.data.apiKey) {
                logger.error("Unable to initialise SendGrid email. SendGrid API Key not configured");
                return false;
            }
            if (!response.data.senderEmail) {
                logger.error("Unable to initialise SendGrid email. SendGrid Sender not configured");
                return false;
            }
            if (!response.data.replyTo) {
                logger.error("Unable to initialise SendGrid email. SendGrid Reply-To not configured");
                return false;
            }

            sgMail.setApiKey(response.data.apiKey.value);
            sgMailInitialised = {
                apiKey: response.data.apiKey.value,
                sender: response.data.senderName
                    ? { email: response.data.senderEmail.value, name: response.data.senderName.value }
                    : response.data.senderEmail.value,
                replyTo: response.data.replyTo.value,
            };
        } catch (e: any) {
            logger.error({ err: e }, "Failed to initialise SendGrid mail");
        }
    }

    return sgMailInitialised;
}

export async function processEmailsJobQueue(logger: P.Logger): Promise<void> {
    const sgConfig = await initSGMail(logger);
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
                        };
                        await callWithRetry(() => sgMail.send(msg));
                    }
                } catch (e: any) {
                    logger.error({ err: e, emailId: email.id }, "Could not send email");
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
            logger.error({ err: e }, "Could not unmark failed emails");
        }
    } else {
        logger.warn(
            "Unable to send email - could not initialise email client. Perhaps a system configuration key is missing?"
        );
    }
}
