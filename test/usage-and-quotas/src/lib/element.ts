import { gqlClient } from "@midspace/component-clients/graphqlClient";
import gql from "graphql-tag";
import type {
    Content_Element_Insert_Input,
    Content_Element_Set_Input,
    DeleteElementMutation,
    DeleteElementMutationVariables,
    ElementFragment,
    GetElementQuery,
    GetElementQueryVariables,
    InsertElementMutation,
    InsertElementMutationVariables,
    UpdateElementMutation,
    UpdateElementMutationVariables,
} from "../generated/graphql";
import {
    DeleteElementDocument,
    GetElementDocument,
    InsertElementDocument,
    UpdateElementDocument,
} from "../generated/graphql";
import extractActualError from "./extractError";

gql`
    fragment Element on content_Element {
        id
        createdAt
        updatedAt
        conferenceId
        subconferenceId
        itemId
        typeName
        name
        data
        isHidden
        layoutData
        uploadsRemaining
        visibilityLevel
        source
    }

    query GetElement($elementId: uuid!) {
        content_Element_by_pk(id: $elementId) {
            ...Element
        }
    }

    mutation InsertElement($object: content_Element_insert_input!) {
        insert_content_Element_one(object: $object) {
            ...Element
        }
    }

    mutation UpdateElement($elementId: uuid!, $set: content_Element_set_input!) {
        update_content_Element_by_pk(pk_columns: { id: $elementId }, _set: $set) {
            ...Element
        }
    }

    mutation DeleteElement($elementId: uuid!) {
        delete_content_Element_by_pk(id: $elementId) {
            id
        }
    }
`;

export async function getElement(elementId: string): Promise<ElementFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .query<GetElementQuery, GetElementQueryVariables>(GetElementDocument, {
            elementId,
        })
        .toPromise();
    if (response.error) {
        throw extractActualError(response.error);
    }
    if (!response.data?.content_Element_by_pk) {
        throw new Error("No data");
    }
    return response.data.content_Element_by_pk;
}

export async function insertElement(object: Content_Element_Insert_Input): Promise<ElementFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<InsertElementMutation, InsertElementMutationVariables>(InsertElementDocument, {
            object,
        })
        .toPromise();
    if (response.error) {
        throw extractActualError(response.error);
    }
    if (!response.data?.insert_content_Element_one) {
        throw new Error("No insert response");
    }
    return response.data.insert_content_Element_one;
}

export async function updateElement(elementId: string, set: Content_Element_Set_Input): Promise<ElementFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<UpdateElementMutation, UpdateElementMutationVariables>(UpdateElementDocument, {
            elementId,
            set,
        })
        .toPromise();
    if (response.error) {
        throw extractActualError(response.error);
    }
    if (!response.data?.update_content_Element_by_pk) {
        throw new Error("No update response");
    }
    return response.data.update_content_Element_by_pk;
}

export async function deleteElement(elementId: string): Promise<string> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<DeleteElementMutation, DeleteElementMutationVariables>(DeleteElementDocument, {
            elementId,
        })
        .toPromise();
    if (response.error) {
        throw extractActualError(response.error);
    }
    if (!response.data?.delete_content_Element_by_pk) {
        throw new Error("No delete response");
    }
    return response.data.delete_content_Element_by_pk.id;
}
