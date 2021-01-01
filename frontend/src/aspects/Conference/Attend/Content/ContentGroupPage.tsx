import { gql } from "@apollo/client";
import { Heading } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { GetContentGroupQuery, useGetContentGroupQuery } from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { AuthorList } from "./AuthorList";
import ContentItem from "./ContentItem";

gql`
    query GetContentGroup($contentGroupId: uuid!) {
        ContentGroup_by_pk(id: $contentGroupId) {
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
    }
`;

export default function ContentGroupPage({ contentGroupId }: { contentGroupId: string }): JSX.Element {
    const result = useGetContentGroupQuery({
        variables: {
            contentGroupId,
        },
    });

    const contentItems = useMemo(() => {
        return result.data?.ContentGroup_by_pk?.contentItems.map((item) => {
            return <ContentItem key={item.id} contentItemData={item} />;
        });
    }, [result.data?.ContentGroup_by_pk?.contentItems]);

    return (
        <>
            <ApolloQueryWrapper queryResult={result}>
                {(data: GetContentGroupQuery) => {
                    return (
                        <>
                            <Heading as="h2"> {data.ContentGroup_by_pk?.title}</Heading>
                            {<AuthorList contentPeopleData={data.ContentGroup_by_pk?.people ?? []} />}
                            {contentItems}
                        </>
                    );
                }}
            </ApolloQueryWrapper>
        </>
    );
}
