import { gqlClient } from "@midspace/component-clients/graphqlClient";
import gql from "graphql-tag";
import type {
    DeleteEventMutation,
    DeleteEventMutationVariables,
    EventFragment,
    GetEventQuery,
    GetEventQueryVariables,
    InsertEventMutation,
    InsertEventMutationVariables,
    Schedule_Event_Insert_Input,
    Schedule_Event_Set_Input,
    UpdateEventMutation,
    UpdateEventMutationVariables,
} from "../generated/graphql";
import { DeleteEventDocument, GetEventDocument, InsertEventDocument, UpdateEventDocument } from "../generated/graphql";
import extractActualError from "./extractError";

gql`
    fragment Event on schedule_Event {
        id
        createdAt
        updatedAt
        conferenceId
        roomId
        modeName
        itemId
        name
        scheduledStartTime
        scheduledEndTime
        exhibitionId
        shufflePeriodId
        timingsUpdatedAt
        enableRecording
        streamTextEventId
        subconferenceId
        visibilityLevel
        automaticParticipationSurvey
    }

    query GetEvent($eventId: uuid!) {
        schedule_Event_by_pk(id: $eventId) {
            ...Event
        }
    }

    mutation InsertEvent($object: schedule_Event_insert_input!) {
        insert_schedule_Event_one(object: $object) {
            ...Event
        }
    }

    mutation UpdateEvent($eventId: uuid!, $set: schedule_Event_set_input!) {
        update_schedule_Event_by_pk(pk_columns: { id: $eventId }, _set: $set) {
            ...Event
        }
    }

    mutation DeleteEvent($eventId: uuid!) {
        delete_schedule_Event_by_pk(id: $eventId) {
            id
        }
    }
`;

export async function getEvent(eventId: string): Promise<EventFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .query<GetEventQuery, GetEventQueryVariables>(GetEventDocument, {
            eventId,
        })
        .toPromise();
    if (response.error) {
        throw extractActualError(response.error);
    }
    if (!response.data?.schedule_Event_by_pk) {
        throw new Error("No data");
    }
    return response.data.schedule_Event_by_pk;
}

export async function insertEvent(object: Schedule_Event_Insert_Input): Promise<EventFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<InsertEventMutation, InsertEventMutationVariables>(InsertEventDocument, {
            object,
        })
        .toPromise();
    if (response.error) {
        throw extractActualError(response.error);
    }
    if (!response.data?.insert_schedule_Event_one) {
        throw new Error("No insert response");
    }
    return response.data.insert_schedule_Event_one;
}

export async function updateEvent(eventId: string, set: Schedule_Event_Set_Input): Promise<EventFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<UpdateEventMutation, UpdateEventMutationVariables>(UpdateEventDocument, {
            eventId,
            set,
        })
        .toPromise();
    if (response.error) {
        throw extractActualError(response.error);
    }
    if (!response.data?.update_schedule_Event_by_pk) {
        throw new Error("No update response");
    }
    return response.data.update_schedule_Event_by_pk;
}

export async function deleteEvent(eventId: string): Promise<string> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<DeleteEventMutation, DeleteEventMutationVariables>(DeleteEventDocument, {
            eventId,
        })
        .toPromise();
    if (response.error) {
        throw extractActualError(response.error);
    }
    if (!response.data?.delete_schedule_Event_by_pk) {
        throw new Error("No delete response");
    }
    return response.data.delete_schedule_Event_by_pk.id;
}
