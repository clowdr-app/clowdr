import { gql } from "@apollo/client/core";
import { v5 as uuidv5 } from "uuid";
import {
    CompleteInvitationEmailJobsDocument,
    Email_Insert_Input,
    InvitationPartsFragment,
    InvitedUserPartsFragment,
    RegistrantWithInvitePartsFragment,
    SelectInvitationAndUserDocument,
    SelectRegistrantsWithInvitationDocument,
    SelectUnprocessedInvitationEmailJobsDocument,
    SetRegistrantUserIdDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { EMAIL_IDEMPOTENCY_NAMESPACE, insertEmails } from "./email";

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
        registrant_Registrant(
            where: {
                _and: [
                    { id: { _in: $registrantIds } }
                    { userId: { _is_null: true } }
                    {
                        groupRegistrants: {
                            group: {
                                enabled: { _eq: true }
                                groupRoles: { role: { rolePermissions: { permissionName: { _eq: CONFERENCE_VIEW } } } }
                            }
                        }
                    }
                ]
            }
        ) {
            ...RegistrantWithInviteParts
        }
    }

    query SelectUnprocessedInvitationEmailJobs {
        job_queues_InvitationEmailJob(where: { processed: { _eq: false } }) {
            id
            registrantIds
            sendRepeat
        }
    }

    mutation CompleteInvitationEmailJobs($ids: [uuid!]!) {
        update_job_queues_InvitationEmailJob(where: { id: { _in: $ids } }, _set: { processed: true }) {
            affected_rows
        }
    }
`;

/** @summary Generate an idempotency key that uniquely identifies each email in a invite email job. */
function generateIdempotencyKey(jobId: string, registrantId: string): string {
    return uuidv5(`invite-email,${jobId},${registrantId}`, EMAIL_IDEMPOTENCY_NAMESPACE);
}

async function sendInviteEmails(
    registrantIds: Array<string>,
    jobId: string,
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
                        idempotencyKey: generateIdempotencyKey(jobId, registrant.id),
                    });
                }
            }
        }

        if (emailsToSend.size) {
            await insertEmails(
                Array.from(emailsToSend.values()),
                registrants.data.registrant_Registrant[0].conference.id,
                `invitation:${jobId}`
            );
        }
    }
}

export async function processInvitationEmailsQueue(): Promise<void> {
    const jobs = await apolloClient.query({
        query: SelectUnprocessedInvitationEmailJobsDocument,
        variables: {},
    });

    const completedJobIds: string[] = [];
    for (const job of jobs.data.job_queues_InvitationEmailJob) {
        try {
            await sendInviteEmails(job.registrantIds, job.id, (registrant) => {
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
            completedJobIds.push(job.id);
        } catch (e: any) {
            console.error("Failed to process send invite emails job", { jobId: job.id, error: e.message ?? e });
        }
    }

    await apolloClient.mutate({
        mutation: CompleteInvitationEmailJobsDocument,
        variables: {
            ids: completedJobIds,
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
                console.error(`Failed to link user to invitation (${user.id}, ${invitation.id})`, e);
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
    args: invitationConfirmCurrentArgs,
    userId: string
): Promise<ConfirmInvitationOutput> {
    return confirmUser(args.inviteCode, userId, async (invitation, user): Promise<true | string> => {
        return !invitation.invitedEmailAddress
            ? "No invited email address"
            : !user.email
            ? "User does not have an email address"
            : invitation.registrant.userId
            ? `Invitation already used${invitation.registrant.userId === user.id ? " (same user)" : ""}`
            : true;
    });
}
