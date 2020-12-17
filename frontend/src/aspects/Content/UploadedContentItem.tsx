import { gql } from "@apollo/client/core";
import { Button, Spinner, Text, Tooltip, VStack } from "@chakra-ui/react";
import React from "react";
import { useGetContentItemQuery } from "../../generated/graphql";
import FAIcon from "../Icons/FAIcon";
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

export default function UploadedContentItem({ magicToken }: { magicToken: string }): JSX.Element {
    const { loading, error, data, refetch } = useGetContentItemQuery({
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
                    {data?.getContentItem?.map((item) =>
                        item ? (
                            <VStack spacing={2} key={item.id}>
                                <Tooltip label="Refresh uploaded item">
                                    <Button aria-label="Refresh uploaded item" onClick={async () => await refetch()}>
                                        <FAIcon iconStyle="s" icon="sync" />
                                    </Button>
                                </Tooltip>
                                <RenderContentItem data={item.data} />
                                <EditContentItem data={item.data} contentItemId={item.id} magicToken={magicToken} />
                            </VStack>
                        ) : (
                            <></>
                        )
                    )}
                </>
            ) : (
                <Text mt={5}>No item has been uploaded yet.</Text>
            )}
        </>
    );
}
