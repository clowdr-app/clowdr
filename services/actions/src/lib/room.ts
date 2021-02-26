import { gql } from "@apollo/client/core";
import { ContentGroup_CreateRoomDocument, CreateContentGroupRoom_GetContentGroupDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

export async function createContentGroupBreakoutRoom(contentGroupId: string, conferenceId: string): Promise<string> {
    gql`
        query CreateContentGroupRoom_GetContentGroup($id: uuid!) {
            ContentGroup_by_pk(id: $id) {
                id
                chatId
                conferenceId
                rooms(where: { originatingEventId: { _is_null: true } }, order_by: { created_at: asc }, limit: 1) {
                    id
                }
                title
            }
        }
    `;

    const contentGroupResult = await apolloClient.query({
        query: CreateContentGroupRoom_GetContentGroupDocument,
        variables: {
            id: contentGroupId,
        },
    });

    if (contentGroupResult.data.ContentGroup_by_pk?.conferenceId !== conferenceId) {
        throw new Error("Could not find specified content group in the conference");
    }

    if (contentGroupResult.data.ContentGroup_by_pk.rooms.length > 0) {
        return contentGroupResult.data.ContentGroup_by_pk.rooms[0].id;
    }

    gql`
        mutation ContentGroup_CreateRoom(
            $chatId: uuid = null
            $conferenceId: uuid!
            $name: String!
            $originatingContentGroupId: uuid!
        ) {
            insert_Room_one(
                object: {
                    capacity: 50
                    chatId: $chatId
                    conferenceId: $conferenceId
                    currentModeName: BREAKOUT
                    name: $name
                    originatingContentGroupId: $originatingContentGroupId
                    roomPrivacyName: PUBLIC
                }
            ) {
                id
            }
        }
    `;

    console.log("Creating new breakout room for content group", contentGroupId, conferenceId);

    const createResult = await apolloClient.mutate({
        mutation: ContentGroup_CreateRoomDocument,
        variables: {
            conferenceId: conferenceId,
            name: `${contentGroupResult.data.ContentGroup_by_pk.title}`,
            originatingContentGroupId: contentGroupId,
            chatId: contentGroupResult.data.ContentGroup_by_pk.chatId,
        },
    });
    return createResult.data?.insert_Room_one?.id;
}
