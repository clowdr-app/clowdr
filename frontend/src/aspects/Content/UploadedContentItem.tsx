import { gql } from "@apollo/client/core";
import { Button, Spinner, Text, Tooltip, VStack } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
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
    const [disableRefresh, setDisableRefresh] = useState<boolean>(false);
    useEffect(() => {
        if (disableRefresh) {
            (async () => {
                await new Promise((resolve) => setTimeout(resolve, 60000));
                setDisableRefresh(false);
            })();
        }
    }, [disableRefresh]);

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
                                    <Button
                                        aria-label="Refresh uploaded item"
                                        onClick={async () => {
                                            setDisableRefresh(true);
                                            await refetch();
                                        }}
                                        disabled={disableRefresh}
                                    >
                                        {disableRefresh ? (
                                            "(Please wait before refreshing again)"
                                        ) : (
                                            <FAIcon iconStyle="s" icon="sync" />
                                        )}
                                    </Button>
                                </Tooltip>
                                {!item?.data ||
                                item?.data.length === 0 ||
                                item?.data[item.data.length - 1]?.data.baseType !== "video" ||
                                !item?.data[item.data.length - 1]?.data.subtitles["en_US"] ? (
                                    <RenderContentItem data={item.data} />
                                ) : undefined}
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
