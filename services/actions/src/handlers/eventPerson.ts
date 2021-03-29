import { gql } from "@apollo/client/core";
import assert from "assert";
import { FindEventConnectionsForParticipantDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import vonageClient from "../lib/vonage/vonageClient";
import { EventPersonData, Payload } from "../types/hasura/event";

gql`
    query FindEventConnectionsForParticipant($personId: uuid!, $eventId: uuid!) {
        EventParticipantStream_aggregate(
            distinct_on: vonageConnectionId
            where: { attendee: { contentPeople: { id: { _eq: $personId } } }, eventId: { _eq: $eventId } }
        ) {
            nodes {
                vonageConnectionId
                id
                event {
                    eventVonageSession {
                        id
                        sessionId
                    }
                }
            }
        }
    }
`;

export async function handleEventPersonDeleted(payload: Payload<EventPersonData>): Promise<void> {
    assert(!payload.event.data.new, "Expected row to be deleted");
    assert(payload.event.data.old, "Expected row to be deleted");

    const oldRow = payload.event.data.old;

    const result = await apolloClient.query({
        query: FindEventConnectionsForParticipantDocument,
        variables: {
            personId: oldRow.personId,
            eventId: oldRow.eventId,
        },
    });

    for (const stream of result.data.EventParticipantStream_aggregate.nodes) {
        if (stream.event.eventVonageSession?.sessionId) {
            try {
                console.log(
                    "Forcing disconnection from event Vonage session",
                    stream.id,
                    stream.event.eventVonageSession.sessionId
                );
                await vonageClient.forceDisconnect(
                    stream.event.eventVonageSession.sessionId,
                    stream.vonageConnectionId
                );
            } catch (e) {
                console.error("Failed to force disconnection of Vonage client", stream.id, stream.vonageConnectionId);
            }
        }
    }
}
