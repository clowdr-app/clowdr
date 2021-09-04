import { gql } from "@apollo/client/core";
import assert from "assert";
import * as R from "ramda";
import {
    CustomEmail_SelectRegistrantsDocument,
    Email_Insert_Input,
    MarkAndSelectUnprocessedCustomEmailJobsDocument,
    UnmarkCustomEmailJobsDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
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
    }
`;

async function sendCustomEmails(
    registrantIds: string[],
    conferenceId: string,
    htmlBody: string,
    subject: string
): Promise<void> {
    const registrants = await apolloClient.query({
        query: CustomEmail_SelectRegistrantsDocument,
        variables: {
            registrantIds: R.uniq(registrantIds),
            conferenceId,
        },
    });

    if (registrants.error) {
        throw new Error(registrants.error.message);
    } else if (registrants.errors && registrants.errors.length > 0) {
        throw new Error(registrants.errors.reduce((a, e) => `${a}\n* ${e};`, ""));
    }

    const emailsToSend: Array<Email_Insert_Input> = [];

    for (const registrant of registrants.data.registrant_Registrant) {
        const email = registrant.user?.email ?? registrant.invitation?.invitedEmailAddress;

        if (!email) {
            console.warn("User has no known email address", registrant.id);
            continue;
        }

        emailsToSend.push({
            recipientName: registrant.displayName,
            emailAddress: email,
            htmlContents: htmlBody,
            reason: "custom-email",
            userId: registrant?.user?.id ?? null,
            subject,
        });
    }

    await insertEmails(emailsToSend, conferenceId);
}

gql`
    mutation MarkAndSelectUnprocessedCustomEmailJobs {
        update_job_queues_CustomEmailJob(where: { processed: { _eq: false } }, _set: { processed: true }) {
            returning {
                id
                registrantIds
                conferenceId
                subject
                htmlBody
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

export async function processCustomEmailsJobQueue(): Promise<void> {
    const jobs = await apolloClient.mutate({
        mutation: MarkAndSelectUnprocessedCustomEmailJobsDocument,
        variables: {},
    });
    assert(jobs.data?.update_job_queues_CustomEmailJob?.returning, "Unable to fetch custom email jobs.");

    const failedJobIds: string[] = [];
    for (const job of jobs.data.update_job_queues_CustomEmailJob.returning) {
        try {
            await sendCustomEmails(job.registrantIds, job.conferenceId, job.htmlBody, job.subject);
        } catch (error) {
            console.error("Failed to process send custom email job", { jobId: job.id, error: error.message ?? error });
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
