import { gql } from "@apollo/client/core";
import {
    CreateContentItemDocument,
    RequiredItemDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

gql`
    query RequiredItem($accessToken: String!) {
        RequiredContentItem(where: { accessToken: { _eq: $accessToken } }) {
            id
            contentTypeName
            name
            conference {
                id
                name
            }
            contentItem {
                id
            }
            contentGroup {
                id
            }
        }
    }

    mutation CreateContentItem(
        $conferenceId: uuid!
        $contentGroupId: uuid!
        $contentTypeName: ContentType_enum!
        $data: jsonb!
        $isHidden: Boolean!
        $layoutData: jsonb!
        $name: String!
        $requiredContentId: uuid!
    ) {
        insert_ContentItem_one(
            object: {
                conferenceId: $conferenceId
                contentGroupId: $contentGroupId
                contentTypeName: $contentTypeName
                data: $data
                isHidden: $isHidden
                layoutData: $layoutData
                name: $name
                requiredContentId: $requiredContentId
            }
        ) {
            id
        }
    }
`;

export default async function uploadContentHandler(
    args: submitContentItemArgs
): Promise<SubmitContentItemOutput> {
    if (!args.magicToken) {
        return {
            success: false,
            message: "Access token not provided.",
        };
    }

    const response = await apolloClient.query({
        query: RequiredItemDocument,
        variables: {
            accessToken: args.magicToken,
        },
    });

    if (response.data.RequiredContentItem.length !== 1) {
        return {
            success: false,
            message: "Could not find a required item that matched the request.",
        };
    }

    const requiredContentItem = response.data.RequiredContentItem[0];

    if (requiredContentItem.contentItem) {
        return {
            success: false,
            message: "This item has already been uploaded.",
        };
    }

    try {
        await apolloClient.mutate({
            mutation: CreateContentItemDocument,
            variables: {
                conferenceId: requiredContentItem.conference.id,
                contentGroupId: requiredContentItem.contentGroup.id,
                contentTypeName: requiredContentItem.contentTypeName,
                data: args.data,
                isHidden: false,
                layoutData: {},
                name: requiredContentItem.name,
                requiredContentId: requiredContentItem.id,
            },
        });
    } catch (e) {
        console.error("Failed to save new content item", e);
        return {
            success: false,
            message: "Failed to save new item.",
        };
    }

    return {
        success: true,
        message: "",
    };
}
