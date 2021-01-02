import { gql } from "@apollo/client";
import { Box, Flex, SkeletonCircle, SkeletonText } from "@chakra-ui/react";
import React from "react";
import { ContentGroupDataFragment, Permission_Enum, useGetContentGroupQuery } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
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
        <RequireAtLeastOnePermissionWrapper
            componentIfDenied={<PageNotFound />}
            permissions={[Permission_Enum.ConferenceView]}
        >
            <ApolloQueryWrapper queryResult={result} getter={(data) => data.ContentGroup_by_pk}>
                {(contentGroupData: ContentGroupDataFragment) => {
                    return (
                        <Flex width="100%" height="100%" gridColumnGap={5}>
                            <Box textAlign="center" flexGrow={1} overflowY="auto">
                                <ContentGroupVideos contentGroupData={contentGroupData} />
                                <ContentGroupSummary contentGroupData={contentGroupData} />
                            </Box>
                            <Box width="30%" border="1px solid white" height="100%">
                                <SkeletonCircle size="20" />
                                <SkeletonText mt={8} noOfLines={5} spacing={5} />
                            </Box>
                        </Flex>
                    );
                }}
            </ApolloQueryWrapper>
        </RequireAtLeastOnePermissionWrapper>
    );
}
