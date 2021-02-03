import { gql } from "@apollo/client/core";
import assert from "assert";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import {
    AttendeeWithInvitePartsFragment,
    Email_Insert_Input,
    InvitationPartsFragment,
    InvitedUserPartsFragment,
    MarkAndSelectUnprocessedInvitationEmailJobsDocument,
    SelectAttendeesWithInvitationDocument,
    SelectInvitationAndUserDocument,
    SendFreshInviteConfirmationEmailDocument,
    SetAttendeeUserIdDocument,
    UnmarkInvitationEmailJobsDocument,
    UpdateInvitationDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { insertEmails } from "./email";

gql`
    fragment InvitationParts on Invitation {
        attendeeId
        attendee {
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
        Invitation(where: { inviteCode: { _eq: $inviteCode } }) {
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
        update_Invitation(
            where: { id: { _eq: $invitationId }, updatedAt: { _eq: $updatedAt } }
            _set: { confirmationCode: $confirmationCode, linkToUserId: $userId }
        ) {
            affected_rows
        }
    }

    mutation SendFreshInviteConfirmationEmail(
        $emailAddress: String!
        $htmlContents: String!
        $invitationId: uuid!
        $plainTextContents: String!
        $subject: String!
        $userId: String!
    ) {
        insert_Email_one(
            object: {
                emailAddress: $emailAddress
                htmlContents: $htmlContents
                invitationId: $invitationId
                plainTextContents: $plainTextContents
                reason: "confirm-invite"
                subject: $subject
                userId: $userId
            }
        ) {
            id
        }
    }

    mutation SetAttendeeUserId($attendeeId: uuid!, $userId: String!) {
        update_Attendee(where: { id: { _eq: $attendeeId } }, _set: { userId: $userId }) {
            affected_rows
        }
    }

    fragment AttendeeWithInviteParts on Attendee {
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

    query SelectAttendeesWithInvitation($attendeeIds: [uuid!]!) {
        Attendee(where: { _and: [{ id: { _in: $attendeeIds } }, { userId: { _is_null: true } }] }) {
            ...AttendeeWithInviteParts
        }
    }

    mutation MarkAndSelectUnprocessedInvitationEmailJobs {
        update_job_queues_InvitationEmailJob(where: { processed: { _eq: false } }, _set: { processed: true }) {
            returning {
                id
                attendeeIds
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
    attendeeIds: Array<string>,
    shouldSend: (attendee: AttendeeWithInvitePartsFragment) => "INITIAL" | "REPEAT" | false
): Promise<void> {
    const attendees = await apolloClient.query({
        query: SelectAttendeesWithInvitationDocument,
        variables: {
            attendeeIds,
        },
    });

    if (attendees.error) {
        throw new Error(attendees.error.message);
    } else if (attendees.errors && attendees.errors.length > 0) {
        throw new Error(attendees.errors.reduce((a, e) => `${a}\n* ${e};`, ""));
    }

    const emailsToSend: Map<string, Email_Insert_Input> = new Map();

    for (const attendee of attendees.data.Attendee) {
        if (!attendee.userId && attendee.invitation) {
            const sendType = shouldSend(attendee);
            if (sendType) {
                const plainTextContents = `Dear ${attendee.displayName},

You are invited to attend ${attendee.conference.name} on Clowdr: the virtual
conferencing platform. Please use the link and invite code below to create
your profile and access the conference.

Invitation code: ${attendee.invitation.inviteCode}
Use your invite code at: ${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/

We hope you enjoy your conference,
The Clowdr team

This is an automated email sent on behalf of Clowdr CIC. If you believe you have
received this email in error, please contact us via ${process.env.STOP_EMAILS_CONTACT_EMAIL_ADDRESS}`;
                const htmlContents = `<p>Dear ${attendee.displayName},</p>

<p>You are invited to attend ${attendee.conference.name} on Clowdr: the virtual
conferencing platform. Please use the link and invite code below to create
your profile and access the conference.</p>

<p>
<a href="${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/invitation/accept/${attendee.invitation.inviteCode}">Click here to use your invitation code: ${attendee.invitation.inviteCode}</a><br />
Or enter it on the Clowdr home page at ${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}
</p>

<p>We hope you enjoy your conference,<br />
The Clowdr team</p>

<p>This is an automated email sent on behalf of Clowdr CIC. If you believe you have
received this email in error, please contact us via ${process.env.STOP_EMAILS_CONTACT_EMAIL_ADDRESS}</p>`;
                emailsToSend.set(attendee.id, {
                    emailAddress: attendee.invitation.invitedEmailAddress,
                    invitationId: attendee.invitation.id,
                    reason: "invite",
                    subject: `Clowdr: ${sendType === "REPEAT" ? "[Reminder] " : ""}Your invitation to ${
                        attendee.conference.shortName
                    }`,
                    htmlContents,
                    plainTextContents,
                });
            }
        }
    }

    await insertEmails(Array.from(emailsToSend.values()));
}

export async function processInvitationEmailsQueue(): Promise<void> {
    const jobs = await apolloClient.mutate({
        mutation: MarkAndSelectUnprocessedInvitationEmailJobsDocument,
        variables: {},
    });
    assert(jobs.data?.update_job_queues_InvitationEmailJob?.returning, "Unable to fetch Send Invitations jobs.");

    const failedJobIds: string[] = [];
    for (const job of jobs.data.update_job_queues_InvitationEmailJob.returning) {
        try {
            await sendInviteEmails(job.attendeeIds, (attendee) => {
                if (
                    !!attendee.invitation &&
                    attendee.invitation.emails.filter((x) => x.reason === "invite").length === 0
                ) {
                    return "INITIAL";
                } else if (job.sendRepeat) {
                    return "REPEAT";
                }
                return false;
            });
        } catch (e) {
            console.error(`Failed to process send invite emails job: ${job.id}`);
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
    assert(invitationQ.data.Invitation[0]);
    assert(invitationQ.data.User_by_pk);
    const invitation = invitationQ.data.Invitation[0];
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
    const { invitation, user } = await getInvitationAndUser(inviteCode, userId);

    let ok = await validate(invitation, user);

    if (ok === true) {
        try {
            await apolloClient.mutate({
                mutation: SetAttendeeUserIdDocument,
                variables: {
                    attendeeId: invitation.attendeeId,
                    userId,
                },
            });
        } catch (e) {
            ok = e.message || e.toString();
            console.error(`Failed to link user to invitation (${user.id}, ${invitation.id})`, e);
        }
    }

    return {
        ok: ok === true ? "true" : ok,
        confSlug: invitation.attendee.conference.slug,
    };
}

export async function invitationConfirmCurrentHandler(
    args: invitationConfirmCurrentArgs,
    userId: string
): Promise<ConfirmInvitationOutput> {
    return confirmUser(
        args.inviteCode,
        userId,
        async (invitation, user): Promise<true | string> => {
            return !invitation.invitedEmailAddress
                ? "No invited email address"
                : !user.email
                ? "User does not have an email address"
                : invitation.attendee.userId
                ? `Invitation already used${invitation.attendee.userId === user.id ? " (same user)" : ""}`
                : true;
            // Dead code
            // TODO: (Noted 2021-02-02 by Ed): Delete this at some point once we know it's not needed
            // TODO: Re-instate if using extra confirm-email step: && invitation.invitedEmailAddress.toLowerCase() === user.email.toLowerCase()
        }
    );
}

// Dead function
// TODO: (Noted 2021-02-02 by Ed): Delete this at some point once we know it's not needed
function generateExternalConfirmationCode(invitation: {
    confirmationCode: string;
    invitedEmailAddress: string;
}): string {
    return crypto
        .createHmac("sha256", invitation.confirmationCode)
        .update(invitation.invitedEmailAddress.toLowerCase())
        .digest("hex")
        .toLowerCase();
}

// Dead function
// TODO: (Noted 2021-02-02 by Ed): Delete this at some point once we know it's not needed
export async function invitationConfirmWithCodeHandler(
    args: invitationConfirmWithCodeArgs,
    userId: string
): Promise<ConfirmInvitationOutput> {
    return confirmUser(args.inviteInput.inviteCode, userId, async (invitation, user) => {
        if (
            !invitation.attendee.userId &&
            invitation.confirmationCode &&
            invitation.linkToUserId &&
            user.email &&
            invitation.linkToUserId === user.id
        ) {
            const goldenCode = generateExternalConfirmationCode({
                confirmationCode: invitation.confirmationCode,
                invitedEmailAddress: invitation.invitedEmailAddress,
            });
            const inputCode = args.inviteInput.confirmationCode.toLowerCase();
            return goldenCode === inputCode || "Confirmation code invalid";
        }
        return "Invitation or use state invalid";
    });
}

// Dead function
// TODO: (Noted 2021-02-02 by Ed): Delete this at some point once we know it's not needed
function generateEmailContents(
    confirmationCode: string,
    invitation: InvitationPartsFragment,
    user: InvitedUserPartsFragment
) {
    const externalConfirmationCode = generateExternalConfirmationCode({
        confirmationCode,
        invitedEmailAddress: invitation.invitedEmailAddress,
    });

    const htmlContents = `<p>Dear ${invitation.attendee.displayName},</p>

<p>A user is trying to accept your invitation to ${invitation.attendee.conference.name}
using the email address ${user.email}. If this was you, and you would like to use the
email address shown (instead of your invitation address: ${invitation.invitedEmailAddress}),
please enter the confirmation code shown below. If this was not you, please
contact your conference organiser.</p>

<p>Confirmation code: ${externalConfirmationCode}<br />
Page to enter the code: <a href="${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/invitation/accept/${invitation.inviteCode}">${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/invitation/accept/${invitation.inviteCode}</a><br />
(You will need to be logged in as ${user.email} in order to enter the confirmation code.)</p>

<p>We hope you enjoy your conference,<br/>
The Clowdr team</p>

<p>This is an automated email sent on behalf of Clowdr CIC. If you believe you have
received this email in error, please contact us via <a href="mailto:${process.env.STOP_EMAILS_CONTACT_EMAIL_ADDRESS}">${process.env.STOP_EMAILS_CONTACT_EMAIL_ADDRESS}</a></p>`;

    const plainTextContents = `Dear ${invitation.attendee.displayName},

A user is trying to accept your invitation to ${invitation.attendee.conference.name}
using the email address ${user.email}. If this was you, and you would like to use the
email address shown (instead of your invitation address: ${invitation.invitedEmailAddress}),
please enter the confirmation code shown below. If this was not you, please
contact your conference organiser.

Confirmation code: ${externalConfirmationCode}
Page to enter the code: ${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/invitation/accept/${invitation.inviteCode}

(You will need to be logged in as ${user.email} in order to enter the confirmation code.)

We hope you enjoy your conference,
The Clowdr team

This is an automated email sent on behalf of Clowdr CIC. If you believe you have
received this email in error, please contact us via ${process.env.STOP_EMAILS_CONTACT_EMAIL_ADDRESS}`;
    return {
        htmlContents,
        plainTextContents,
    };
}

// Dead function
// TODO: (Noted 2021-02-02 by Ed): Delete this at some point once we know it's not needed
export async function invitationConfirmSendInitialEmailHandler(
    args: invitationConfirmSendInitialEmailArgs,
    userId: string
): Promise<InvitationConfirmationEmailOutput> {
    const { invitation, user } = await getInvitationAndUser(args.inviteInput.inviteCode, userId);

    // UI race condition might cause us to receive a request for
    // which we don't really want to send an email.
    if (invitation.invitedEmailAddress === user.email) {
        return {
            sent: true,
        };
    }

    if (!invitation.attendee.userId && (!invitation.linkToUserId || invitation.linkToUserId !== user.id)) {
        const newConfirmationCodeForDB = uuidv4();
        const sendEmailTo = invitation.invitedEmailAddress;
        const { htmlContents, plainTextContents } = generateEmailContents(newConfirmationCodeForDB, invitation, user);
        // updated_at serves as a mutex variable
        const result = await apolloClient.mutate({
            mutation: UpdateInvitationDocument,
            variables: {
                confirmationCode: newConfirmationCodeForDB,
                invitationId: invitation.id,
                userId: user.id,
                updatedAt: invitation.updatedAt,
            },
        });
        if (result.data?.update_Invitation?.affected_rows && result.data?.update_Invitation?.affected_rows > 0) {
            await apolloClient.mutate({
                mutation: SendFreshInviteConfirmationEmailDocument,
                variables: {
                    emailAddress: sendEmailTo,
                    invitationId: invitation.id,
                    userId: user.id,
                    subject: "Clowdr: Confirm acceptance of invitation",
                    htmlContents,
                    plainTextContents,
                },
            });
        }
    }
    return {
        sent: true,
    };
}

// Dead function
// TODO: (Noted 2021-02-02 by Ed): Delete this at some point once we know it's not needed
export async function invitationConfirmSendRepeatEmailHandler(
    args: invitationConfirmSendRepeatEmailArgs,
    userId: string
): Promise<InvitationConfirmationEmailOutput> {
    const { invitation, user } = await getInvitationAndUser(args.inviteInput.inviteCode, userId);
    if (
        !invitation.attendee.userId &&
        invitation.linkToUserId &&
        invitation.linkToUserId === user.id &&
        invitation.confirmationCode
    ) {
        const sendEmailTo = invitation.invitedEmailAddress;
        const { htmlContents, plainTextContents } = generateEmailContents(
            invitation.confirmationCode,
            invitation,
            user
        );
        await apolloClient.mutate({
            mutation: SendFreshInviteConfirmationEmailDocument,
            variables: {
                emailAddress: sendEmailTo,
                invitationId: invitation.id,
                userId: user.id,
                subject: "Clowdr: Confirm acceptance of invitation [Repeat]",
                htmlContents,
                plainTextContents,
            },
        });
        return {
            sent: true,
        };
    }
    return {
        sent: false,
    };
}
