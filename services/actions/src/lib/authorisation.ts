import { gql } from "@apollo/client/core";
import { GetAttendeeDocument, GetAttendee_AttendeeFragment } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

export async function getAttendee(userId: string, conferenceId: string): Promise<GetAttendee_AttendeeFragment> {
    gql`
        query GetAttendee($userId: String!, $conferenceId: uuid!) {
            Attendee(where: { userId: { _eq: $userId }, conferenceId: { _eq: $conferenceId } }) {
                id
                displayName
            }
        }

        fragment GetAttendee_Attendee on Attendee {
            id
            displayName
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
