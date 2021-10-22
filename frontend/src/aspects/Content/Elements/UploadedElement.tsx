import { Button, Spinner, Text, Tooltip, VStack } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import type { GetElementQuery } from "../../../generated/graphql";
import FAIcon from "../../Icons/FAIcon";
import { EditElement } from "./EditElement";
import RenderElement from "./RenderElement";

export default function UploadedElement({
    magicToken,
    loading,
    error,
    data,
    refetch,
}: {
    magicToken: string;
    loading: boolean;
    error: boolean;
    data: GetElementQuery | undefined;
    refetch: () => void;
}): JSX.Element {
    const [disableRefresh, setDisableRefresh] = useState<boolean>(false);
    useEffect(() => {
        if (disableRefresh) {
            (async () => {
                await new Promise((resolve) => setTimeout(resolve, 60000));
                setDisableRefresh(false);
            })();
        }
    }, [disableRefresh]);

    return (
        <>
            {loading ? <Spinner /> : undefined}
            {error ? <Text>Could not load item.</Text> : undefined}
            {data?.content_ElementByPersonAccessToken?.length ? (
                data?.content_ElementByPersonAccessToken?.map((item) =>
                    item ? (
                        <VStack spacing={4} key={item.id} alignItems="flex-start" w="100%">
                            <Tooltip
                                label={
                                    disableRefresh ? "Please wait before refreshing again" : "Refresh submitted item"
                                }
                            >
                                <span>
                                    <Button
                                        aria-label="Refresh submitted item"
                                        onClick={async () => {
                                            setDisableRefresh(true);
                                            refetch();
                                        }}
                                        isDisabled={disableRefresh}
                                        size="md"
                                    >
                                        <FAIcon iconStyle="s" icon="sync" mr={2} /> Refresh
                                    </Button>
                                </span>
                            </Tooltip>
                            {!item?.data ||
                            item?.data.length === 0 ||
                            item?.data[item.data.length - 1]?.data.baseType !== "video" ||
                            !item?.data[item.data.length - 1]?.data.subtitles["en_US"] ||
                            !item?.data[item.data.length - 1]?.data.subtitles["en_US"]?.s3Url?.length ? (
                                <RenderElement data={item.data} />
                            ) : undefined}
                            <EditElement data={item.data} elementId={item.id} magicToken={magicToken} />
                        </VStack>
                    ) : undefined
                )
            ) : (
                <Text mt={5}>No item has been submitted yet.</Text>
            )}
        </>
    );
}
