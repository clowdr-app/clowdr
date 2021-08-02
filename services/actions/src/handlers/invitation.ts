import { gql } from "@apollo/client/core";
import assert from "assert";
import crypto from "crypto";
import { htmlToText } from "html-to-text";
import { v4 as uuidv4 } from "uuid";
import {
    Email_Insert_Input,
    InvitationPartsFragment,
    InvitedUserPartsFragment,
    MarkAndSelectUnprocessedInvitationEmailJobsDocument,
    RegistrantWithInvitePartsFragment,
    SelectInvitationAndUserDocument,
    SelectRegistrantsWithInvitationDocument,
    SendFreshInviteConfirmationEmailDocument,
    SetRegistrantUserIdDocument,
    UnmarkInvitationEmailJobsDocument,
    UpdateInvitationDocument,
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

<p>Sign up to Clowdr to attend ${registrant.conference.name}. Please use the link and invite code below to create
your account and access the conference.</p>

<p>
<a href="{[FRONTEND_HOST]}/invitation/accept/${registrant.invitation.inviteCode}">Click here to join the conference</a></p>

<p>If you are asked for an invitation code, enter ${registrant.invitation.inviteCode}</p>

<p>We hope you enjoy your conference,<br />
The Clowdr team</p>`;

                    const plainTextContents = htmlToText(htmlContents);

                    emailsToSend.set(registrant.id, {
                        emailAddress: registrant.invitation.invitedEmailAddress,
                        invitationId: registrant.invitation.id,
                        reason: "invite",
                        subject: `Clowdr: ${sendType === "REPEAT" ? "[Reminder] " : ""}Join Clowdr to attend ${
                            registrant.conference.shortName
                        }`,
                        htmlContents,
                        plainTextContents,
                    });
                }
            }
        }

        await insertEmails(Array.from(emailsToSend.values()), registrants.data.registrant_Registrant[0].conference.id);
    }
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
            await sendInviteEmails(job.registrantIds, (registrant) => {
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
        } catch (e) {
            console.error("Failed to process send invite emails job", { jobId: job.id, error: e.message ?? e });
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
            } catch (e) {
                ok = e.message || e.toString();
                console.error(`Failed to link user to invitation (${user.id}, ${invitation.id})`, e);
            }
        }

        return {
            ok: ok === true ? "true" : ok,
            confSlug: invitation.registrant.conference.slug,
        };
    } catch (e) {
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
        // Dead code
        // TODO: (Noted 2021-02-02 by Ed): Delete this at some point once we know it's not needed
        // TODO: Re-instate if using extra confirm-email step: && invitation.invitedEmailAddress.toLowerCase() === user.email.toLowerCase()
    });
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
            !invitation.registrant.userId &&
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

    const htmlContents = `<p>Dear ${invitation.registrant.displayName},</p>

<p>A user is trying to accept your invitation to ${invitation.registrant.conference.name}
using the email address ${user.email}. If this was you, and you would like to use the
email address shown (instead of your invitation address: ${invitation.invitedEmailAddress}),
please enter the confirmation code shown below. If this was not you, please
contact your conference organiser.</p>

<p>Confirmation code: ${externalConfirmationCode}<br />
Page to enter the code: <a href="{[FRONTEND_HOST]}/invitation/accept/${invitation.inviteCode}">{[FRONTEND_HOST]}/invitation/accept/${invitation.inviteCode}</a><br />
(You will need to be logged in as ${user.email} in order to enter the confirmation code.)</p>

<p>We hope you enjoy your conference,<br/>
The Clowdr team</p>`;

    const plainTextContents = htmlToText(htmlContents);
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

    if (!invitation.registrant.userId && (!invitation.linkToUserId || invitation.linkToUserId !== user.id)) {
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
        if (
            result.data?.update_registrant_Invitation?.affected_rows &&
            result.data?.update_registrant_Invitation?.affected_rows > 0
        ) {
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
        !invitation.registrant.userId &&
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
