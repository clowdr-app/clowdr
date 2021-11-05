import { gql } from "@apollo/client/core";
import assert from "assert";
import MarkdownIt from "markdown-it";
import type { P } from "pino";
import * as R from "ramda";
import type { Email_Insert_Input } from "../generated/graphql";
import {
    CustomEmail_SelectRegistrantsDocument,
    MarkAndSelectUnprocessedCustomEmailJobsDocument,
    UnmarkCustomEmailJobsDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { EmailReason } from "../lib/email/sendingReasons";
import { callWithRetry } from "../utils";
import { insertEmails } from "./email";

gql`
    query CustomEmail_SelectRegistrants($conferenceId: uuid!, $registrantIds: [uuid!]!) {
        registrant_Registrant(where: { conferenceId: { _eq: $conferenceId }, id: { _in: $registrantIds } }) {
            displayName
            invitation {
                invitedEmailAddress
                id
            }
            id
            user {
                id
                email
            }
        }
        conference_Conference_by_pk(id: $conferenceId) {
            shortName
            techSupportAddress: configurations(where: { key: { _eq: TECH_SUPPORT_ADDRESS } }) {
                value
            }
        }
        platformAddress: system_Configuration_by_pk(key: SENDGRID_REPLYTO) {
            value
        }
    }
`;

async function sendCustomEmails(
    logger: P.Logger,
    registrantIds: string[],
    conferenceId: string,
    userMarkdownBody: string,
    subject: string
): Promise<void> {
    const result = await apolloClient.query({
        query: CustomEmail_SelectRegistrantsDocument,
        variables: {
            registrantIds: R.uniq(registrantIds),
            conferenceId,
        },
    });

    if (result.error) {
        throw new Error(result.error.message);
    } else if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors.reduce((a, e) => `${a}\n* ${e};`, ""));
    }

    const emailsToSend: Array<Email_Insert_Input> = [];

    const markdownIt = new MarkdownIt("commonmark", {
        linkify: true,
    });

    const userHtmlBody = markdownIt.render(userMarkdownBody);
    const conferenceName = result.data.conference_Conference_by_pk?.shortName ?? "your conference";
    const htmlContents = `<p><strong>A message from the organisers of ${conferenceName}:</strong></p>${userHtmlBody}`;

    for (const registrant of result.data.registrant_Registrant) {
        const email = registrant.user?.email ?? registrant.invitation?.invitedEmailAddress;

        if (!email) {
            logger.warn({ registrantId: registrant.id }, "User has no known email address");
            continue;
        }

        emailsToSend.push({
            recipientName: registrant.displayName,
            emailAddress: email,
            htmlContents,
            reason: EmailReason.CustomEmail,
            userId: registrant?.user?.id ?? null,
            subject,
        });
    }

    const copyToEmail =
        result.data.conference_Conference_by_pk?.techSupportAddress?.[0]?.value ?? result.data.platformAddress?.value;
    if (copyToEmail) {
        emailsToSend.push({
            recipientName: `${conferenceName} TECH_SUPPORT_ADDRESS`,
            emailAddress: copyToEmail,
            htmlContents,
            reason: EmailReason.CustomEmail,
            userId: null,
            subject: `[${conferenceName} | CUSTOM EMAIL | ${result.data.registrant_Registrant.length} recipients] ${subject}`,
        });
    }

    await insertEmails(logger, emailsToSend, conferenceId);
}

gql`
    mutation MarkAndSelectUnprocessedCustomEmailJobs {
        update_job_queues_CustomEmailJob(where: { processed: { _eq: false } }, _set: { processed: true }) {
            returning {
                id
                registrantIds
                conferenceId
                subject
                markdownBody
            }
        }
    }

    mutation UnmarkCustomEmailJobs($ids: [uuid!]!) {
        update_job_queues_CustomEmailJob(where: { id: { _in: $ids } }, _set: { processed: false }) {
            returning {
                id
            }
            affected_rows
        }
    }
`;

export async function processCustomEmailsJobQueue(logger: P.Logger): Promise<void> {
    const jobs = await apolloClient.mutate({
        mutation: MarkAndSelectUnprocessedCustomEmailJobsDocument,
        variables: {},
    });
    assert(jobs.data?.update_job_queues_CustomEmailJob?.returning, "Unable to fetch custom email jobs.");

    const failedJobIds: string[] = [];
    for (const job of jobs.data.update_job_queues_CustomEmailJob.returning) {
        try {
            await sendCustomEmails(logger, job.registrantIds, job.conferenceId, job.markdownBody, job.subject);
        } catch (error: any) {
            logger.error({ jobId: job.id, error }, "Failed to process send custom email job");
            failedJobIds.push(job.id);
        }
    }

    callWithRetry(
        async () =>
            await apolloClient.mutate({
                mutation: UnmarkCustomEmailJobsDocument,
                variables: {
                    ids: failedJobIds,
                },
            })
    );
}
