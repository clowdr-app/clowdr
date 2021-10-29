import { Box, Flex } from "@chakra-ui/react";
import { assertIsElementDataBlob } from "@midspace/shared-types/content";
import * as R from "ramda";
import React, { useCallback, useMemo, useState } from "react";
import type { ItemElements_ItemDataFragment } from "../../../../generated/graphql";
import { Content_ElementType_Enum } from "../../../../generated/graphql";
import usePolling from "../../../Generic/usePolling";
import { VideoElement } from "./Element/VideoElement";

export function ItemVideos({ itemData }: { itemData: ItemElements_ItemDataFragment }): JSX.Element {
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
                    element.typeName === Content_ElementType_Enum.VideoBroadcast ||
                    element.typeName === Content_ElementType_Enum.VideoPrepublish ||
                    element.typeName === Content_ElementType_Enum.VideoFile ||
                    element.typeName === Content_ElementType_Enum.AudioFile
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
                                <VideoElement
                                    elementId={element.id}
                                    title={element.name}
                                    elementData={latestVersion.data}
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
