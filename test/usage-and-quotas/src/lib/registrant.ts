import { gqlClient } from "@midspace/component-clients/graphqlClient";
import gql from "graphql-tag";
import type {
    DeleteRegistrantMutation,
    DeleteRegistrantMutationVariables,
    GetRegistrantQuery,
    GetRegistrantQueryVariables,
    InsertRegistrantMutation,
    InsertRegistrantMutationVariables,
    RegistrantFragment,
    Registrant_Registrant_Insert_Input,
    Registrant_Registrant_Set_Input,
    UpdateRegistrantMutation,
    UpdateRegistrantMutationVariables,
} from "../generated/graphql";
import {
    DeleteRegistrantDocument,
    GetRegistrantDocument,
    InsertRegistrantDocument,
    UpdateRegistrantDocument,
} from "../generated/graphql";

gql`
    fragment Registrant on registrant_Registrant {
        id
        createdAt
        updatedAt
        conferenceId
        displayName
        userId
        conferenceRole
    }

    query GetRegistrant($registrantId: uuid!) {
        registrant_Registrant_by_pk(id: $registrantId) {
            ...Registrant
        }
    }

    mutation InsertRegistrant($object: registrant_Registrant_insert_input!) {
        insert_registrant_Registrant_one(object: $object) {
            ...Registrant
        }
    }

    mutation UpdateRegistrant($registrantId: uuid!, $set: registrant_Registrant_set_input!) {
        update_registrant_Registrant_by_pk(pk_columns: { id: $registrantId }, _set: $set) {
            ...Registrant
        }
    }

    mutation DeleteRegistrant($registrantId: uuid!) {
        delete_registrant_Registrant_by_pk(id: $registrantId) {
            id
        }
    }
`;

export async function getRegistrant(registrantId: string): Promise<RegistrantFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .query<GetRegistrantQuery, GetRegistrantQueryVariables>(GetRegistrantDocument, {
            registrantId,
        })
        .toPromise();
    if (response.error) {
        throw response.error;
    }
    if (!response.data?.registrant_Registrant_by_pk) {
        throw new Error("No data");
    }
    return response.data.registrant_Registrant_by_pk;
}

export async function insertRegistrant(object: Registrant_Registrant_Insert_Input): Promise<RegistrantFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<InsertRegistrantMutation, InsertRegistrantMutationVariables>(InsertRegistrantDocument, {
            object,
        })
        .toPromise();
    if (response.error) {
        throw response.error;
    }
    if (!response.data?.insert_registrant_Registrant_one) {
        throw new Error("No insert response");
    }
    return response.data.insert_registrant_Registrant_one;
}

export async function updateRegistrant(
    registrantId: string,
    set: Registrant_Registrant_Set_Input
): Promise<RegistrantFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<UpdateRegistrantMutation, UpdateRegistrantMutationVariables>(UpdateRegistrantDocument, {
            registrantId,
            set,
        })
        .toPromise();
    if (response.error) {
        throw response.error;
    }
    if (!response.data?.update_registrant_Registrant_by_pk) {
        throw new Error("No update response");
    }
    return response.data.update_registrant_Registrant_by_pk;
}

export async function deleteRegistrant(registrantId: string): Promise<string> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<DeleteRegistrantMutation, DeleteRegistrantMutationVariables>(DeleteRegistrantDocument, {
            registrantId,
        })
        .toPromise();
    if (response.error) {
        throw response.error;
    }
    if (!response.data?.delete_registrant_Registrant_by_pk) {
        throw new Error("No delete response");
    }
    return response.data.delete_registrant_Registrant_by_pk.id;
}
