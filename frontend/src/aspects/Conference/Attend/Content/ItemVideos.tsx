import { Box, Flex } from "@chakra-ui/react";
import { assertIsElementDataBlob } from "@clowdr-app/shared-types/build/content";
import * as R from "ramda";
import React, { useCallback, useMemo, useState } from "react";
import { ElementType_Enum, ItemDataFragment } from "../../../../generated/graphql";
import usePolling from "../../../Generic/usePolling";
import { ElementVideo } from "./Element/ElementVideo";

export function ItemVideos({ itemData }: { itemData: ItemDataFragment }): JSX.Element {
    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
    const [slowSelectedVideoId, setSlowSelectedVideoId] = useState<string | null>(null);

    const updateSlowSelectedVideoId = useCallback(() => {
        setSlowSelectedVideoId(selectedVideoId);
    }, [selectedVideoId]);

    usePolling(updateSlowSelectedVideoId, 1500, true);

    const videoElements = useMemo(() => {
        return itemData.elements
            .filter(
                (element) =>
                    element.typeName === ElementType_Enum.VideoBroadcast ||
                    element.typeName === ElementType_Enum.VideoPrepublish ||
                    element.typeName === ElementType_Enum.VideoFile
            )
            .sort((x, y) => x.typeName.localeCompare(y.typeName))
            .map((element) => {
                try {
                    assertIsElementDataBlob(element?.data);
                    const latestVersion = R.last(element.data);

                    if (latestVersion?.data.baseType === "video") {
                        return (
                            <Box
                                key={element.id}
                                flexGrow={1}
                                flexShrink={1}
                                transition="max-width 1s, width 1s, height 1s, margin 1s"
                                maxWidth={[
                                    "100%",
                                    "100%",
                                    slowSelectedVideoId === element.id ? "70%" : slowSelectedVideoId ? "0%" : "50%",
                                ]}
                                flexBasis={0}
                                mx={5}
                                mt={3}
                                mb={5}
                                visibility={[
                                    "visible",
                                    "visible",
                                    !slowSelectedVideoId || slowSelectedVideoId === element.id ? "visible" : "hidden",
                                ]}
                                overflow={["visible", "visible", "hidden"]}
                            >
                                <ElementVideo
                                    elementId={element.id}
                                    title={element.name}
                                    videoElementData={latestVersion.data}
                                    onPlay={() => setSelectedVideoId(element.id)}
                                    onPause={() => setSelectedVideoId(null)}
                                />
                            </Box>
                        );
                    } else {
                        return <></>;
                    }
                } catch (e) {
                    return <></>;
                }
            });
    }, [itemData.elements, slowSelectedVideoId]);
    return videoElements.length === 0 ? (
        <></>
    ) : (
        <Flex
            justifyContent={["flex-start", "flex-start", "center"]}
            alignItems="center"
            background="gray.900"
            borderRadius={5}
            pb={5}
            flexDir={["column", "column", "row"]}
        >
            {videoElements}
        </Flex>
    );
}
