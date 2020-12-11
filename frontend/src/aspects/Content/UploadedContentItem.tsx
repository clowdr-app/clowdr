import { gql } from "@apollo/client/core";
import { Heading, Spinner } from "@chakra-ui/react";
import React from "react";
import { useGetContentItemQuery } from "../../generated/graphql";
import RenderContentItem from "./RenderContentItem";

gql`
    query GetContentItem($magicToken: String!) {
        getContentItem(magicToken: $magicToken) {
            contentTypeName
            data
            layoutData
            name
            id
        }
    }
`;

export default function UploadedContentItem({
    magicToken,
}: {
    magicToken: string;
}): JSX.Element {
    const { loading, error, data } = useGetContentItemQuery({
        variables: {
            magicToken,
        },
        fetchPolicy: "network-only",
    });
    return loading ? (
        <div>
            <Spinner />
        </div>
    ) : error ? (
        <>Could not load item.</>
    ) : (
        <>
            <Heading as="h3" fontSize="1.2rem">
                Previously uploaded
            </Heading>
            {data?.getContentItem?.map((item) =>
                item ? (
                    <RenderContentItem
                        key={item.id}
                        data={item.data}
                        id={item.id}
                    />
                ) : (
                    <></>
                )
            )}
        </>
    );
}
