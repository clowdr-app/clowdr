import { gqlClient } from "@midspace/component-clients/graphqlClient";
import gql from "graphql-tag";
import type {
    Conference_Subconference_Insert_Input,
    Conference_Subconference_Set_Input,
    DeleteSubconferenceMutation,
    DeleteSubconferenceMutationVariables,
    GetSubconferenceQuery,
    GetSubconferenceQueryVariables,
    InsertSubconferenceMutation,
    InsertSubconferenceMutationVariables,
    SubconferenceFragment,
    UpdateSubconferenceMutation,
    UpdateSubconferenceMutationVariables,
} from "../generated/graphql";
import {
    DeleteSubconferenceDocument,
    GetSubconferenceDocument,
    InsertSubconferenceDocument,
    UpdateSubconferenceDocument,
} from "../generated/graphql";

gql`
    fragment Subconference on conference_Subconference {
        id
        created_at
        updated_at
        conferenceId
        name
        shortName
        slug
        conferenceVisibilityLevel
        defaultProgramVisibilityLevel
    }

    query GetSubconference($subconferenceId: uuid!) {
        conference_Subconference_by_pk(id: $subconferenceId) {
            ...Subconference
        }
    }

    mutation InsertSubconference($object: conference_Subconference_insert_input!) {
        insert_conference_Subconference_one(object: $object) {
            ...Subconference
        }
    }

    mutation UpdateSubconference($subconferenceId: uuid!, $set: conference_Subconference_set_input!) {
        update_conference_Subconference_by_pk(pk_columns: { id: $subconferenceId }, _set: $set) {
            ...Subconference
        }
    }

    mutation DeleteSubconference($subconferenceId: uuid!) {
        delete_conference_Subconference_by_pk(id: $subconferenceId) {
            id
        }
    }
`;

export async function getSubconference(subconferenceId: string): Promise<SubconferenceFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .query<GetSubconferenceQuery, GetSubconferenceQueryVariables>(GetSubconferenceDocument, {
            subconferenceId,
        })
        .toPromise();
    if (response.error) {
        throw response.error;
    }
    if (!response.data?.conference_Subconference_by_pk) {
        throw new Error("No data");
    }
    return response.data.conference_Subconference_by_pk;
}

export async function insertSubconference(
    object: Conference_Subconference_Insert_Input
): Promise<SubconferenceFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<InsertSubconferenceMutation, InsertSubconferenceMutationVariables>(InsertSubconferenceDocument, {
            object,
        })
        .toPromise();
    if (response.error) {
        throw response.error;
    }
    if (!response.data?.insert_conference_Subconference_one) {
        throw new Error("No insert response");
    }
    return response.data.insert_conference_Subconference_one;
}

export async function updateSubconference(
    subconferenceId: string,
    set: Conference_Subconference_Set_Input
): Promise<SubconferenceFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<UpdateSubconferenceMutation, UpdateSubconferenceMutationVariables>(UpdateSubconferenceDocument, {
            subconferenceId,
            set,
        })
        .toPromise();
    if (response.error) {
        throw response.error;
    }
    if (!response.data?.update_conference_Subconference_by_pk) {
        throw new Error("No update response");
    }
    return response.data.update_conference_Subconference_by_pk;
}

export async function deleteSubconference(subconferenceId: string): Promise<string> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<DeleteSubconferenceMutation, DeleteSubconferenceMutationVariables>(DeleteSubconferenceDocument, {
            subconferenceId,
        })
        .toPromise();
    if (response.error) {
        throw response.error;
    }
    if (!response.data?.delete_conference_Subconference_by_pk) {
        throw new Error("No delete response");
    }
    return response.data.delete_conference_Subconference_by_pk.id;
}
