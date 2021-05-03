import { gql } from "@apollo/client/core";
import assert from "assert";
import {
    AddRegistrantToEventDocument,
    DeleteEventRoomJoinRequestDocument,
    EventRoomJoinRequest_FindProgramPersonDocument,
    EventRoomJoinRequest_InsertProgramPersonDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { EventRoomJoinRequestData, Payload } from "../types/hasura/event";

gql`
    query EventRoomJoinRequest_FindProgramPerson($registrantId: uuid!) {
        collection_ProgramPerson(where: { registrantId: { _eq: $registrantId } }, limit: 1) {
            id
        }
        registrant_Registrant_by_pk(id: $registrantId) {
            id
            displayName
            profile {
                registrantId
                affiliation
            }
            user {
                id
                email
            }
        }
    }

    mutation EventRoomJoinRequest_InsertProgramPerson($data: collection_ProgramPerson_insert_input!) {
        insert_collection_ProgramPerson_one(object: $data) {
            id
        }
    }

    mutation AddRegistrantToEvent($personId: uuid!, $eventId: uuid!) {
        insert_schedule_EventProgramPerson(objects: { personId: $personId, eventId: $eventId, roleName: PARTICIPANT }) {
            affected_rows
        }
    }

    mutation DeleteEventRoomJoinRequest($eventRoomJoinRequestId: uuid!) {
        delete_schedule_EventRoomJoinRequest_by_pk(id: $eventRoomJoinRequestId) {
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

    console.log("Finding content person for registrant", newRow.registrantId, newRow.eventId);
    let personId: string | undefined;
    try {
        const people = await apolloClient.query({
            query: EventRoomJoinRequest_FindProgramPersonDocument,
            variables: {
                registrantId: newRow.registrantId,
            },
        });
        if (people.data.collection_ProgramPerson.length > 0) {
            personId = people.data.collection_ProgramPerson[0].id;
        } else if (people.data.registrant_Registrant_by_pk && people.data.registrant_Registrant_by_pk.profile) {
            const newPerson = await apolloClient.mutate({
                mutation: EventRoomJoinRequest_InsertProgramPersonDocument,
                variables: {
                    data: {
                        affiliation: people.data.registrant_Registrant_by_pk.profile.affiliation,
                        registrantId: newRow.registrantId,
                        conferenceId: newRow.conferenceId,
                        email: people.data.registrant_Registrant_by_pk.user?.email,
                        name: people.data.registrant_Registrant_by_pk.displayName,
                    },
                },
            });
            if (!newPerson.data?.insert_collection_ProgramPerson_one) {
                console.error("Could not insert content person", newRow.registrantId, newRow.eventId);
                return;
            }

            personId = newPerson.data.insert_collection_ProgramPerson_one.id;
        } else {
            console.error("Could check get registrant info", newRow.registrantId, newRow.eventId);
            return;
        }
    } catch (e) {
        console.error("Could check content people for a matching registrant", newRow.registrantId, newRow.eventId, e);
        return;
    }

    console.log("Adding approved registrant to event people", newRow.registrantId, newRow.eventId);
    try {
        await apolloClient.mutate({
            mutation: AddRegistrantToEventDocument,
            variables: {
                personId,
                eventId: newRow.eventId,
            },
        });
    } catch (e) {
        console.error("Could not add person to event people", newRow.registrantId, newRow.eventId, e);
    }

    console.log("Removing event room join request", newRow.registrantId, newRow.eventId);
    try {
        await apolloClient.mutate({
            mutation: DeleteEventRoomJoinRequestDocument,
            variables: {
                eventRoomJoinRequestId: newRow.id,
            },
        });
    } catch (e) {
        console.error("Could not remove event room join request", newRow.registrantId, newRow.eventId);
    }
}
