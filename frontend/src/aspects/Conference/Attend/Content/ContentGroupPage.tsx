import { gql } from "@apollo/client";
import { Box } from "@chakra-ui/react";
import React from "react";
import { GetContentGroupQuery, useGetContentGroupQuery } from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import ContentGroupSummary from "./ContentGroupSummary";
import { ContentGroupVideos } from "./ContentGroupVideos";

gql`
    query GetContentGroup($contentGroupId: uuid!) {
        ContentGroup_by_pk(id: $contentGroupId) {
            ...ContentGroupData
        }
    }

    fragment ContentGroupData on ContentGroup {
        id
        title
        contentGroupTypeName
        contentItems {
            ...ContentItemData
        }
        people(order_by: { priority: asc }) {
            ...ContentPersonData
        }
    }
`;

export default function ContentGroupPage({ contentGroupId }: { contentGroupId: string }): JSX.Element {
    const result = useGetContentGroupQuery({
        variables: {
            contentGroupId,
        },
    });

    return (
        <>
            <ApolloQueryWrapper queryResult={result}>
                {(data: GetContentGroupQuery) => {
                    return (
                        <>
                            {data.ContentGroup_by_pk ? (
                                <Box textAlign="center">
                                    <ContentGroupSummary contentGroupData={data.ContentGroup_by_pk} />
                                    <ContentGroupVideos contentGroupData={data.ContentGroup_by_pk} />
                                </Box>
                            ) : (
                                <></>
                            )}
                            {/* {contentItems} */}
                        </>
                    );
                }}
            </ApolloQueryWrapper>
        </>
    );
}
