import { Box, Flex } from "@chakra-ui/react";
import { assertIsContentItemDataBlob } from "@clowdr-app/shared-types/build/content";
import * as R from "ramda";
import React, { useCallback, useMemo, useState } from "react";
import { ContentGroupDataFragment, ContentType_Enum } from "../../../../generated/graphql";
import usePolling from "../../../Generic/usePolling";
import { ContentItemVideo } from "./Item/ContentItemVideo";

export function ContentGroupVideos({ contentGroupData }: { contentGroupData: ContentGroupDataFragment }): JSX.Element {
    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
    const [slowSelectedVideoId, setSlowSelectedVideoId] = useState<string | null>(null);

    const updateSlowSelectedVideoId = useCallback(() => {
        setSlowSelectedVideoId(selectedVideoId);
    }, [selectedVideoId]);

    usePolling(updateSlowSelectedVideoId, 1500, true);

    const videoContentItems = useMemo(() => {
        return contentGroupData.contentItems
            .filter(
                (contentItem) =>
                    contentItem.contentTypeName === ContentType_Enum.VideoBroadcast ||
                    contentItem.contentTypeName === ContentType_Enum.VideoPrepublish ||
                    contentItem.contentTypeName === ContentType_Enum.VideoFile
            )
            .sort((x, y) => x.contentTypeName.localeCompare(y.contentTypeName))
            .map((contentItem) => {
                try {
                    assertIsContentItemDataBlob(contentItem?.data);
                    const latestVersion = R.last(contentItem.data);

                    if (latestVersion?.data.baseType === "video") {
                        return (
                            <Box
                                key={contentItem.id}
                                flexGrow={1}
                                flexShrink={1}
                                transition="max-width 1s, width 1s, height 1s, margin 1s"
                                maxWidth={[
                                    "100%",
                                    "100%",
                                    slowSelectedVideoId === contentItem.id ? "70%" : slowSelectedVideoId ? "0%" : "50%",
                                ]}
                                flexBasis={0}
                                mx={5}
                                mt={3}
                                mb={5}
                                visibility={[
                                    "visible",
                                    "visible",
                                    !slowSelectedVideoId || slowSelectedVideoId === contentItem.id
                                        ? "visible"
                                        : "hidden",
                                ]}
                                overflow={["visible", "visible", "hidden"]}
                            >
                                <ContentItemVideo
                                    contentItemId={contentItem.id}
                                    title={contentItem.name}
                                    videoContentItemData={latestVersion.data}
                                    onPlay={() => setSelectedVideoId(contentItem.id)}
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
    }, [contentGroupData.contentItems, slowSelectedVideoId]);
    return videoContentItems.length === 0 ? (
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
            {videoContentItems}
        </Flex>
    );
}
