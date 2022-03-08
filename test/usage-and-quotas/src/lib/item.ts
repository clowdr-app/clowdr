import { gqlClient } from "@midspace/component-clients/graphqlClient";
import gql from "graphql-tag";
import type {
    Content_Item_Insert_Input,
    Content_Item_Set_Input,
    DeleteItemMutation,
    DeleteItemMutationVariables,
    GetItemQuery,
    GetItemQueryVariables,
    InsertItemMutation,
    InsertItemMutationVariables,
    ItemFragment,
    UpdateItemMutation,
    UpdateItemMutationVariables,
} from "../generated/graphql";
import { DeleteItemDocument, GetItemDocument, InsertItemDocument, UpdateItemDocument } from "../generated/graphql";

gql`
    fragment Item on content_Item {
        id
        createdAt
        updatedAt
        conferenceId
        typeName
        title
        shortTitle
        chatId
        subconferenceId
        visibilityLevel
    }

    query GetItem($itemId: uuid!) {
        content_Item_by_pk(id: $itemId) {
            ...Item
        }
    }

    mutation InsertItem($object: content_Item_insert_input!) {
        insert_content_Item_one(object: $object) {
            ...Item
        }
    }

    mutation UpdateItem($itemId: uuid!, $set: content_Item_set_input!) {
        update_content_Item_by_pk(pk_columns: { id: $itemId }, _set: $set) {
            ...Item
        }
    }

    mutation DeleteItem($itemId: uuid!) {
        delete_content_Item_by_pk(id: $itemId) {
            id
        }
    }
`;

export async function getItem(itemId: string): Promise<ItemFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .query<GetItemQuery, GetItemQueryVariables>(GetItemDocument, {
            itemId,
        })
        .toPromise();
    if (response.error) {
        throw response.error;
    }
    if (!response.data?.content_Item_by_pk) {
        throw new Error("No data");
    }
    return response.data.content_Item_by_pk;
}

export async function insertItem(object: Content_Item_Insert_Input): Promise<ItemFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<InsertItemMutation, InsertItemMutationVariables>(InsertItemDocument, {
            object,
        })
        .toPromise();
    if (response.error) {
        throw response.error;
    }
    if (!response.data?.insert_content_Item_one) {
        throw new Error("No insert response");
    }
    return response.data.insert_content_Item_one;
}

export async function updateItem(itemId: string, set: Content_Item_Set_Input): Promise<ItemFragment> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<UpdateItemMutation, UpdateItemMutationVariables>(UpdateItemDocument, {
            itemId,
            set,
        })
        .toPromise();
    if (response.error) {
        throw response.error;
    }
    if (!response.data?.update_content_Item_by_pk) {
        throw new Error("No update response");
    }
    return response.data.update_content_Item_by_pk;
}

export async function deleteItem(itemId: string): Promise<string> {
    if (!gqlClient) {
        throw new Error("No GQL client");
    }
    const response = await gqlClient
        .mutation<DeleteItemMutation, DeleteItemMutationVariables>(DeleteItemDocument, {
            itemId,
        })
        .toPromise();
    if (response.error) {
        throw response.error;
    }
    if (!response.data?.delete_content_Item_by_pk) {
        throw new Error("No delete response");
    }
    return response.data.delete_content_Item_by_pk.id;
}
