import { gql } from "@apollo/client/core";
import assert from "assert";
import { AddAttendeeToEventDocument, DeleteEventRoomJoinRequestDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { EventRoomJoinRequestData, Payload } from "../types/hasura/event";

gql`
    mutation AddAttendeeToEvent($attendeeId: uuid!, $conferenceId: uuid!, $eventId: uuid!) {
        insert_EventPerson(
            objects: {
                attendeeId: $attendeeId
                conferenceId: $conferenceId
                eventId: $eventId
                roleName: PARTICIPANT
                name: "Participant"
            }
        ) {
            affected_rows
        }
    }

    mutation DeleteEventRoomJoinRequest($eventRoomJoinRequestId: uuid!) {
        delete_EventRoomJoinRequest_by_pk(id: $eventRoomJoinRequestId) {
            id
        }
    }
`;

export async function handleEventRoomJoinUpdated(payload: Payload<EventRoomJoinRequestData>): Promise<void> {
    assert(payload.event.data.new, "Expected payload to have new row");

    const newRow = payload.event.data.new;

    if (!newRow.approved) {
        return;
    }

    console.log("Adding approved attendee to event people", newRow.attendeeId, newRow.eventId);
    try {
        await apolloClient.mutate({
            mutation: AddAttendeeToEventDocument,
            variables: {
                attendeeId: newRow.attendeeId,
                conferenceId: newRow.conferenceId,
                eventId: newRow.eventId,
            },
        });
    } catch (e) {
        console.error("Could not add attendee to event people", newRow.attendeeId, newRow.eventId, e);
    }

    console.log("Removing event room join request", newRow.attendeeId, newRow.eventId);
    try {
        await apolloClient.mutate({
            mutation: DeleteEventRoomJoinRequestDocument,
            variables: {
                eventRoomJoinRequestId: newRow.id,
            },
        });
    } catch (e) {
        console.error("Could not remove event room join request", newRow.attendeeId, newRow.eventId);
    }
}
