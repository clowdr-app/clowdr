import { gql } from "@apollo/client/core";
import assert from "assert";
import { htmlToText } from "html-to-text";
import * as R from "ramda";
import {
    CustomEmail_SelectAttendeesDocument,
    Email_Insert_Input,
    MarkAndSelectUnprocessedCustomEmailJobsDocument,
    UnmarkCustomEmailJobsDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { callWithRetry } from "../utils";
import { insertEmails } from "./email";

gql`
    query CustomEmail_SelectAttendees($conferenceId: uuid!, $attendeeIds: [uuid!]!) {
        Attendee(where: { conferenceId: { _eq: $conferenceId }, id: { _in: $attendeeIds } }) {
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

    mutation CustomEmail_SendEmails($objects: [Email_insert_input!]!) {
        insert_Email(objects: $objects) {
            affected_rows
            returning {
                id
            }
        }
    }
`;

async function sendCustomEmails(
    attendeeIds: string[],
    conferenceId: string,
    htmlBody: string,
    subject: string
): Promise<void> {
    const attendees = await apolloClient.query({
        query: CustomEmail_SelectAttendeesDocument,
        variables: {
            attendeeIds: R.uniq(attendeeIds),
            conferenceId,
        },
    });

    if (attendees.error) {
        throw new Error(attendees.error.message);
    } else if (attendees.errors && attendees.errors.length > 0) {
        throw new Error(attendees.errors.reduce((a, e) => `${a}\n* ${e};`, ""));
    }

    const emailsToSend: Array<Email_Insert_Input> = [];

    for (const attendee of attendees.data.Attendee) {
        const email = attendee.user?.email ?? attendee.invitation?.invitedEmailAddress;

        if (!email) {
            console.warn("User has no known email address", attendee.id);
            continue;
        }

        emailsToSend.push({
            emailAddress: email,
            htmlContents: htmlBody,
            plainTextContents: htmlToText(htmlBody),
            reason: "custom-email",
            userId: attendee?.user?.id ?? null,
            subject,
        });
    }

    await insertEmails(emailsToSend);
}

gql`
    mutation MarkAndSelectUnprocessedCustomEmailJobs {
        update_job_queues_CustomEmailJob(where: { processed: { _eq: false } }, _set: { processed: true }) {
            returning {
                id
                attendeeIds
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
            await sendCustomEmails(job.attendeeIds, job.conferenceId, job.htmlBody, job.subject);
        } catch (e) {
            console.error("Failed to process send custom email job", job.id);
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
