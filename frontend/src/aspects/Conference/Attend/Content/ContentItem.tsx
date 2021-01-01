import { gql } from "@apollo/client";
import { Heading } from "@chakra-ui/react";
import React from "react";
import type { ContentItemDataFragment } from "../../../../generated/graphql";

gql`
    fragment ContentItemData on ContentItem {
        id
        data
        layoutData
        name
        contentTypeName
    }
`;

export default function ContentItem({ contentItemData }: { contentItemData: ContentItemDataFragment }): JSX.Element {
    return (
        <>
            <Heading as="h3" fontSize={24}>
                {contentItemData.name}
            </Heading>
        </>
    );
}
