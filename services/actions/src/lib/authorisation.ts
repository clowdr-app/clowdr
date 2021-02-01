import { gql } from "@apollo/client/core";
import {
    Authorisation_FindAttendeeDocument,
    GetAttendeeByConferenceSlugDocument,
    GetAttendeeDocument,
    GetAttendee_AttendeeFragment,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

export async function getAttendee(userId: string, conferenceId: string): Promise<GetAttendee_AttendeeFragment> {
    gql`
        query GetAttendee($userId: String!, $conferenceId: uuid!) {
            Attendee(where: { userId: { _eq: $userId }, conferenceId: { _eq: $conferenceId } }) {
                ...GetAttendee_Attendee
            }
        }

        fragment GetAttendee_Attendee on Attendee {
            id
            displayName
            conferenceId
        }
    `;

    // Check that the requesting user actually attends the conference
    const myAttendeeResult = await apolloClient.query({
        query: GetAttendeeDocument,
        variables: {
            userId,
            conferenceId,
        },
    });

    if (myAttendeeResult.data.Attendee.length !== 1) {
        throw new Error("Could not find an attendee for the user at the specified conference");
    }

    return myAttendeeResult.data.Attendee[0];
}

export async function getAttendeeByConferenceSlug(
    userId: string,
    conferenceSlug: string
): Promise<GetAttendee_AttendeeFragment> {
    gql`
        query GetAttendeeByConferenceSlug($userId: String!, $conferenceSlug: String!) {
            Attendee(where: { userId: { _eq: $userId }, conference: { slug: { _eq: $conferenceSlug } } }) {
                ...GetAttendee_Attendee
            }
        }
    `;

    // Check that the requesting user actually attends the conference
    const myAttendeeResult = await apolloClient.query({
        query: GetAttendeeByConferenceSlugDocument,
        variables: {
            userId,
            conferenceSlug,
        },
    });

    if (myAttendeeResult.data.Attendee.length !== 1) {
        throw new Error("Could not find an attendee for the user at the specified conference");
    }

    return myAttendeeResult.data.Attendee[0];
}

gql`
    query Authorisation_FindAttendee($attendeeId: uuid!, $userId: String!) {
        Attendee(where: { id: { _eq: $attendeeId }, userId: { _eq: $userId } }) {
            ...GetAttendee_Attendee
        }
    }
`;

export async function attendeeBelongsToUser(
    attendeeId: string,
    userId: string
): Promise<false | GetAttendee_AttendeeFragment> {
    try {
        const result = await apolloClient.query({
            query: Authorisation_FindAttendeeDocument,
            variables: {
                attendeeId,
                userId,
            },
        });

        if (result.data.Attendee.length === 1) {
            return result.data.Attendee[0];
        }

        return false;
    } catch (e) {
        return false;
    }
}
