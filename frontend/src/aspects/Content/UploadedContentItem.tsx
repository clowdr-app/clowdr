import { gql } from "@apollo/client/core";
import { Heading, Spinner } from "@chakra-ui/react";
import React from "react";
import { useGetContentItemQuery } from "../../generated/graphql";
import { EditContentItem } from "./EditContentItem";
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
            {data?.getContentItem?.length && data.getContentItem.length > 0 ? (
                <>
                    <Heading as="h3" fontSize="1.2rem">
                        Previously uploaded
                    </Heading>
                    {data?.getContentItem?.map((item) =>
                        item ? (
                            <div key={item.id}>
                                <RenderContentItem
                                    data={item.data}
                                    contentItemId={item.id}
                                />
                                <EditContentItem
                                    data={item.data}
                                    contentItemId={item.id}
                                    magicToken={magicToken}
                                />
                            </div>
                        ) : (
                            <></>
                        )
                    )}
                </>
            ) : (
                <>No item has been uploaded yet.</>
            )}
        </>
    );
}
