import { gql } from "@apollo/client/core";
import type { ConfirmInvitationOutput, invitationConfirmCurrentArgs } from "@midspace/hasura/actionTypes";
import assert from "assert";
import type { P } from "pino";
import type {
    Email_Insert_Input,
    InvitationPartsFragment,
    InvitedUserPartsFragment,
    RegistrantWithInvitePartsFragment,
} from "../generated/graphql";
import {
    MarkAndSelectUnprocessedInvitationEmailJobsDocument,
    SelectInvitationAndUserDocument,
    SelectRegistrantsWithInvitationDocument,
    SetRegistrantUserIdDocument,
    UnmarkInvitationEmailJobsDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { insertEmails } from "./email";

gql`
    fragment InvitationParts on registrant_Invitation {
        registrantId
        registrant {
            displayName
            userId
            conference {
                name
                slug
            }
        }
        confirmationCode
        id
        inviteCode
        invitedEmailAddress
        linkToUserId
        updatedAt
        createdAt
        user {
            email
        }
    }

    fragment InvitedUserParts on User {
        id
        email
    }

    query SelectInvitationAndUser($inviteCode: uuid!, $userId: String!) {
        registrant_Invitation(where: { inviteCode: { _eq: $inviteCode } }) {
            ...InvitationParts
        }

        User_by_pk(id: $userId) {
            ...InvitedUserParts
        }
    }

    mutation UpdateInvitation(
        $confirmationCode: uuid!
        $invitationId: uuid!
        $userId: String!
        $updatedAt: timestamptz!
    ) {
        update_registrant_Invitation(
            where: { id: { _eq: $invitationId }, updatedAt: { _eq: $updatedAt } }
            _set: { confirmationCode: $confirmationCode, linkToUserId: $userId }
        ) {
            affected_rows
        }
    }

    mutation SetRegistrantUserId($registrantId: uuid!, $userId: String!) {
        update_registrant_Registrant(where: { id: { _eq: $registrantId } }, _set: { userId: $userId }) {
            affected_rows
        }
    }

    fragment RegistrantWithInviteParts on registrant_Registrant {
        id
        conference {
            id
            name
            shortName
            slug
        }
        invitation {
            id
            emails {
                reason
            }
            inviteCode
            invitedEmailAddress
        }
        displayName
        userId
    }

    query SelectRegistrantsWithInvitation($registrantIds: [uuid!]!) {
        registrant_Registrant(where: { _and: [{ id: { _in: $registrantIds } }, { userId: { _is_null: true } }] }) {
            ...RegistrantWithInviteParts
        }
    }

    mutation MarkAndSelectUnprocessedInvitationEmailJobs {
        update_job_queues_InvitationEmailJob(where: { processed: { _eq: false } }, _set: { processed: true }) {
            returning {
                id
                registrantIds
                sendRepeat
            }
        }
    }

    mutation UnmarkInvitationEmailJobs($ids: [uuid!]!) {
        update_job_queues_InvitationEmailJob(where: { id: { _in: $ids } }, _set: { processed: false }) {
            affected_rows
        }
    }
`;

async function sendInviteEmails(
    logger: P.Logger,
    registrantIds: Array<string>,
    shouldSend: (registrant: RegistrantWithInvitePartsFragment) => "INITIAL" | "REPEAT" | false
): Promise<void> {
    if (registrantIds.length === 0) {
        return;
    }

    const registrants = await apolloClient.query({
        query: SelectRegistrantsWithInvitationDocument,
        variables: {
            registrantIds,
        },
    });

    if (registrants.error) {
        throw new Error(registrants.error.message);
    } else if (registrants.errors && registrants.errors.length > 0) {
        throw new Error(registrants.errors.reduce((a, e) => `${a}\n* ${e};`, ""));
    }

    if (registrants.data.registrant_Registrant.length > 0) {
        const emailsToSend: Map<string, Email_Insert_Input> = new Map();

        for (const registrant of registrants.data.registrant_Registrant) {
            if (!registrant.userId && registrant.invitation) {
                const sendType = shouldSend(registrant);
                if (sendType) {
                    const htmlContents = `<p>Dear ${registrant.displayName},</p>

<p>Sign up to Midspace to attend ${registrant.conference.name}. Please use the link and invite code below to create
your account and access the conference.</p>

<p>
<a href="{{frontendHost}}/invitation/accept/${registrant.invitation.inviteCode}">Click here to join the conference</a></p>

<p>If you are asked for an invitation code, enter <code>${registrant.invitation.inviteCode}<code></p>

<p>We hope you enjoy your conference!</p>`;

                    emailsToSend.set(registrant.id, {
                        recipientName: registrant.displayName,
                        emailAddress: registrant.invitation.invitedEmailAddress,
                        invitationId: registrant.invitation.id,
                        reason: "invite",
                        subject: `${sendType === "REPEAT" ? "[Reminder] " : ""}Join to attend ${
                            registrant.conference.shortName
                        }`,
                        htmlContents,
                    });
                }
            }
        }

        await insertEmails(
            logger,
            Array.from(emailsToSend.values()),
            registrants.data.registrant_Registrant[0].conference.id
        );
    }
}

export async function processInvitationEmailsQueue(logger: P.Logger): Promise<void> {
    const jobs = await apolloClient.mutate({
        mutation: MarkAndSelectUnprocessedInvitationEmailJobsDocument,
        variables: {},
    });
    assert(jobs.data?.update_job_queues_InvitationEmailJob?.returning, "Unable to fetch Send Invitations jobs.");

    const failedJobIds: string[] = [];
    for (const job of jobs.data.update_job_queues_InvitationEmailJob.returning) {
        try {
            await sendInviteEmails(logger, job.registrantIds, (registrant) => {
                if (
                    !!registrant.invitation &&
                    registrant.invitation.emails.filter((x) => x.reason === "invite").length === 0
                ) {
                    return "INITIAL";
                } else if (job.sendRepeat) {
                    return "REPEAT";
                }
                return false;
            });
        } catch (e: any) {
            logger.error({ jobId: job.id, err: e }, "Failed to process send invite emails job");
            failedJobIds.push(job.id);
        }
    }

    await apolloClient.mutate({
        mutation: UnmarkInvitationEmailJobsDocument,
        variables: {
            ids: failedJobIds,
        },
    });
}

async function getInvitationAndUser(
    inviteCode: string,
    userId: string
): Promise<{
    invitation: InvitationPartsFragment;
    user: InvitedUserPartsFragment;
}> {
    const invitationQ = await apolloClient.query({
        query: SelectInvitationAndUserDocument,
        variables: {
            inviteCode,
            userId,
        },
    });
    if (!invitationQ.data.registrant_Invitation[0]) {
        throw new Error("Invitation not found");
    }
    if (!invitationQ.data.User_by_pk) {
        throw new Error("User not found");
    }
    const invitation = invitationQ.data.registrant_Invitation[0];
    const user = invitationQ.data.User_by_pk;
    return {
        invitation,
        user,
    };
}

async function confirmUser(
    logger: P.Logger,
    inviteCode: string,
    userId: string,
    validate: (invitation: InvitationPartsFragment, user: InvitedUserPartsFragment) => Promise<true | string>
): Promise<ConfirmInvitationOutput> {
    try {
        const { invitation, user } = await getInvitationAndUser(inviteCode, userId);

        let ok = await validate(invitation, user);

        if (ok === true) {
            try {
                await apolloClient.mutate({
                    mutation: SetRegistrantUserIdDocument,
                    variables: {
                        registrantId: invitation.registrantId,
                        userId,
                    },
                });
            } catch (e: any) {
                ok = e.message || e.toString();
                logger.error(
                    { userId: user.id, invitationId: invitation.id, err: e },
                    "Failed to link user to invitation"
                );
            }
        }

        return {
            ok: ok === true ? "true" : ok,
            confSlug: invitation.registrant.conference.slug,
        };
    } catch (e: any) {
        return {
            ok: e.message || e.toString(),
            confSlug: "<UNKNOWN>",
        };
    }
}

export async function invitationConfirmCurrentHandler(
    logger: P.Logger,
    args: invitationConfirmCurrentArgs,
    userId: string
): Promise<ConfirmInvitationOutput> {
    return confirmUser(logger, args.inviteCode, userId, async (invitation, user): Promise<true | string> => {
        return !invitation.invitedEmailAddress
            ? "No invited email address"
            : !user.email
            ? "User does not have an email address"
            : invitation.registrant.userId
            ? `Invitation already used${invitation.registrant.userId === user.id ? " (same user)" : ""}`
            : true;
    });
}
