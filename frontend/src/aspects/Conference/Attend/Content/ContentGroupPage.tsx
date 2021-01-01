import { gql } from "@apollo/client";
import React from "react";
import { GetContentGroupQuery, useGetContentGroupQuery } from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { useConference } from "../../useConference";

gql`
    query GetContentGroup($contentGroupId: uuid!) {
        ContentGroup_by_pk(id: $contentGroupId) {
            id
            title
            contentGroupTypeName
            contentItems {
                id
                data
                layoutData
                name
                contentTypeName
            }
        }
    }
`;

export default function ContentGroupPage({ contentGroupId }: { contentGroupId: string }): JSX.Element {
    const conference = useConference();

    const result = useGetContentGroupQuery({
        variables: {
            contentGroupId,
        },
    });

    return (
        <>
            <ApolloQueryWrapper queryResult={result}>
                {(data: GetContentGroupQuery) => {
                    return <>{data.ContentGroup_by_pk?.title}</>;
                }}
            </ApolloQueryWrapper>
        </>
    );
}
