import { gql } from "@apollo/client/core";
import assert from "assert";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import {
    DeleteInvitationDocument,
    InvitationPartsFragment,
    InvitedUserPartsFragment,
    SelectInvitationAndUserDocument,
    SendFreshInviteConfirmationDocument,
    SetAttendeeUserIdDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

gql`
    fragment InvitationParts on Invitation {
        attendeeId
        attendee {
            displayName
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

    mutation SendFreshInviteConfirmation(
        $confirmationCode: uuid!
        $emailAddress: String!
        $htmlContents: String!
        $invitationId: uuid!
        $plainTextContents: String!
        $subject: String!
        $userId: String!
    ) {
        update_Invitation_by_pk(
            pk_columns: { id: $invitationId }
            _set: { confirmationCode: $confirmationCode, linkToUserId: $userId }
        ) {
            id
        }
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

    mutation DeleteInvitation($invitationId: uuid!) {
        delete_Invitation(where: { id: { _eq: $invitationId } }) {
            affected_rows
        }
    }

    mutation SetAttendeeUserId($attendeeId: uuid!, $userId: String!) {
        update_Attendee(
            where: { id: { _eq: $attendeeId } }
            _set: { userId: $userId }
        ) {
            affected_rows
        }
    }
`;

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
    validate: (
        invitation: InvitationPartsFragment,
        user: InvitedUserPartsFragment
    ) => Promise<boolean>
): Promise<ConfirmInvitationOutput> {
    const { invitation, user } = await getInvitationAndUser(inviteCode, userId);

    let ok = await validate(invitation, user);

    let confSlug: string | undefined;
    if (ok) {
        try {
            await apolloClient.mutate({
                mutation: DeleteInvitationDocument,
                variables: {
                    invitationId: invitation.id,
                },
            });
        } catch (e) {
            console.error(
                `Failed to delete invitation (${user.id}, ${invitation.id})`,
                e
            );
        }

        try {
            await apolloClient.mutate({
                mutation: SetAttendeeUserIdDocument,
                variables: {
                    attendeeId: invitation.attendeeId,
                    userId,
                },
            });

            confSlug = invitation.attendee.conference.slug;
        } catch (e) {
            ok = false;
            console.error(
                `Failed to link user to invitation (${user.id}, ${invitation.id})`,
                e
            );
        }
    }

    return {
        ok,
        confSlug,
    };
}

export async function invitationConfirmCurrentHandler(
    args: invitationConfirmCurrentArgs,
    userId: string
): Promise<ConfirmInvitationOutput> {
    return confirmUser(args.inviteCode, userId, async (invitation, user) => {
        return (
            !!invitation.invitedEmailAddress &&
            !!user.email &&
            invitation.invitedEmailAddress.toLowerCase() ===
                user.email.toLowerCase()
        );
    });
}

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

export async function invitationConfirmWithCodeHandler(
    args: invitationConfirmWithCodeArgs,
    userId: string
): Promise<ConfirmInvitationOutput> {
    return confirmUser(
        args.inviteInput.inviteCode,
        userId,
        async (invitation, user) => {
            if (
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
                return goldenCode === inputCode;
            }
            return false;
        }
    );
}

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
Page to enter the code: <a href="https://${process.env.FRONTEND_DOMAIN}/invitation/accept/${invitation.inviteCode}">https://${process.env.FRONTEND_DOMAIN}/invitation/accept/${invitation.inviteCode}</a><br />
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
Page to enter the code: https://${process.env.FRONTEND_DOMAIN}/invitation/accept/${invitation.inviteCode}

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

export async function invitationConfirmSendInitialEmailHandler(
    args: invitationConfirmSendInitialEmailArgs,
    userId: string
): Promise<InvitationConfirmationEmailOutput> {
    const { invitation, user } = await getInvitationAndUser(
        args.inviteInput.inviteCode,
        userId
    );
    if (!invitation.linkToUserId || invitation.linkToUserId !== user.id) {
        const newConfirmationCodeForDB = uuidv4();
        const sendEmailTo = invitation.invitedEmailAddress;
        const { htmlContents, plainTextContents } = generateEmailContents(
            newConfirmationCodeForDB,
            invitation,
            user
        );
        await apolloClient.mutate({
            mutation: SendFreshInviteConfirmationDocument,
            variables: {
                emailAddress: sendEmailTo,
                confirmationCode: newConfirmationCodeForDB,
                invitationId: invitation.id,
                userId: user.id,
                subject: "Clowdr: Confirm acceptance of invitation",
                htmlContents,
                plainTextContents,
            },
        });
    }
    return {
        sent: true,
    };
}

export async function invitationConfirmSendRepeatEmailHandler(
    args: invitationConfirmSendRepeatEmailArgs,
    userId: string
): Promise<InvitationConfirmationEmailOutput> {
    const { invitation, user } = await getInvitationAndUser(
        args.inviteInput.inviteCode,
        userId
    );
    if (invitation.linkToUserId && invitation.linkToUserId === user.id) {
        const sendEmailTo = invitation.invitedEmailAddress;
        const { htmlContents, plainTextContents } = generateEmailContents(
            invitation.confirmationCode,
            invitation,
            user
        );
        await apolloClient.mutate({
            mutation: SendFreshInviteConfirmationDocument,
            variables: {
                emailAddress: sendEmailTo,
                confirmationCode: invitation.confirmationCode,
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
