import { gql } from "@apollo/client/core";
import assert from "assert";
import {
    AddAttendeeToEventDocument,
    DeleteEventRoomJoinRequestDocument,
    EventRoomJoinRequest_FindContentPersonDocument,
    EventRoomJoinRequest_InsertContentPersonDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { EventRoomJoinRequestData, Payload } from "../types/hasura/event";

gql`
    query EventRoomJoinRequest_FindContentPerson($attendeeId: uuid!) {
        ContentPerson(where: { attendeeId: { _eq: $attendeeId } }, limit: 1) {
            id
        }
        Attendee_by_pk(id: $attendeeId) {
            id
            displayName
            profile {
                affiliation
            }
            user {
                id
                email
            }
        }
    }

    mutation EventRoomJoinRequest_InsertContentPerson($data: ContentPerson_insert_input!) {
        insert_ContentPerson_one(object: $data) {
            id
        }
    }

    mutation AddAttendeeToEvent($personId: uuid!, $eventId: uuid!) {
        insert_EventPerson(objects: { personId: $personId, eventId: $eventId, roleName: PARTICIPANT }) {
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

    console.log("Finding content person for attendee", newRow.attendeeId, newRow.eventId);
    let personId: string | undefined;
    try {
        const people = await apolloClient.query({
            query: EventRoomJoinRequest_FindContentPersonDocument,
            variables: {
                attendeeId: newRow.attendeeId,
            },
        });
        if (people.data.ContentPerson.length > 0) {
            personId = people.data.ContentPerson[0].id;
        } else if (people.data.Attendee_by_pk && people.data.Attendee_by_pk.profile) {
            const newPerson = await apolloClient.mutate({
                mutation: EventRoomJoinRequest_InsertContentPersonDocument,
                variables: {
                    data: {
                        affiliation: people.data.Attendee_by_pk.profile.affiliation,
                        attendeeId: newRow.attendeeId,
                        conferenceId: newRow.conferenceId,
                        email: people.data.Attendee_by_pk.user?.email,
                        name: people.data.Attendee_by_pk.displayName,
                    },
                },
            });
            if (!newPerson.data?.insert_ContentPerson_one) {
                console.error("Could not insert content person", newRow.attendeeId, newRow.eventId);
                return;
            }

            personId = newPerson.data.insert_ContentPerson_one.id;
        } else {
            console.error("Could check get attendee info", newRow.attendeeId, newRow.eventId);
            return;
        }
    } catch (e) {
        console.error("Could check content people for a matching attendee", newRow.attendeeId, newRow.eventId, e);
        return;
    }

    console.log("Adding approved attendee to event people", newRow.attendeeId, newRow.eventId);
    try {
        await apolloClient.mutate({
            mutation: AddAttendeeToEventDocument,
            variables: {
                personId,
                eventId: newRow.eventId,
            },
        });
    } catch (e) {
        console.error("Could not add person to event people", newRow.attendeeId, newRow.eventId, e);
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
