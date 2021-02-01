import { gql } from "@apollo/client/core";
import assert from "assert";
import jwt_decode from "jwt-decode";
import { Google_CreateAttendeeGoogleAccountDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { attendeeBelongsToUser, getAttendeeByConferenceSlug } from "../lib/authorisation";
import { GoogleIdToken, oauth2Client } from "../lib/googleAuth";

assert(process.env.FRONTEND_DOMAIN, "FRONTEND_DOMAIN environment variable not provided.");
process.env.FRONTEND_PROTOCOL =
    process.env.FRONTEND_PROTOCOL || (process.env.FRONTEND_DOMAIN.startsWith("localhost") ? "http" : "https");

export async function handleGetGoogleOAuthUrl(
    params: getGoogleOAuthUrlArgs,
    userId: string,
    conferenceSlug: string
): Promise<GetGoogleOAuthUrlOutput> {
    const attendee = await getAttendeeByConferenceSlug(userId, conferenceSlug);

    const url = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: [...params.scopes, "openid email"],
        include_granted_scopes: true,
        state: attendee.id,
        prompt: "consent",
        redirect_uri: `${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/googleoauth`,
    });

    return {
        url,
    };
}

gql`
    mutation Google_CreateAttendeeGoogleAccount(
        $attendeeId: uuid!
        $conferenceId: uuid!
        $googleAccountEmail: String!
        $tokenData: jsonb!
    ) {
        insert_AttendeeGoogleAccount_one(
            object: {
                attendeeId: $attendeeId
                conferenceId: $conferenceId
                googleAccountEmail: $googleAccountEmail
                tokenData: $tokenData
            }
        ) {
            id
        }
    }
`;

export async function handleSubmitGoogleOAuthToken(
    params: submitGoogleOAuthCodeArgs,
    userId: string
): Promise<SubmitGoogleOAuthCodeOutput> {
    try {
        console.log("Retrieving Google auth token", userId, params.state);
        const validAttendee = await attendeeBelongsToUser(params.state, userId);
        assert(validAttendee, "Attendee does not belong to the user");

        console.log(params.code);
        const token = await oauth2Client.getToken({
            code: params.code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            redirect_uri: `${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/googleoauth`,
        });

        if (!token.tokens.id_token) {
            console.error("Failed to retrieve id_token", userId);
            throw new Error("Failed to retrieve id_token");
        }

        console.log("Retrieved Google auth token", userId);

        console.log("Verifying Google JWT", userId, params.state);
        oauth2Client.verifyIdToken({
            idToken: token.tokens.id_token,
            audience: oauth2Client._clientId,
        });

        const tokenData = jwt_decode<GoogleIdToken>(token.tokens.id_token);

        console.log("Saving Google OAuth tokens", userId, params.state);
        await apolloClient.mutate({
            mutation: Google_CreateAttendeeGoogleAccountDocument,
            variables: {
                attendeeId: params.state,
                conferenceId: validAttendee.conferenceId,
                googleAccountEmail: tokenData.email,
                tokenData: token.tokens,
            },
        });

        return {
            success: true,
        };
    } catch (e) {
        console.error("Failed to exchange authorisation code for token", e);
        return {
            success: false,
            message: "Failed to exchange authorisation code for token",
        };
    }
}
