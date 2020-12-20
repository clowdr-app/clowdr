import { Text } from "@chakra-ui/react";
import type { ContentItemDataBlob } from "@clowdr-app/shared-types/build/content";
import React from "react";
import EditSubtitles from "./EditSubtitles";

export function EditContentItem({
    data,
    contentItemId,
    magicToken,
}: {
    data: ContentItemDataBlob;
    contentItemId: string;
    magicToken: string;
}): JSX.Element {
    const latestVersion = data && data.length > 0 ? data[data.length - 1] : null;

    const latestSubtitles = latestVersion?.data.baseType === "video" ? latestVersion?.data.subtitles["en_US"] : null;
    return (
        <>
            {latestSubtitles ? (
                <EditSubtitles data={latestSubtitles} contentItemId={contentItemId} magicToken={magicToken} />
            ) : (
                <Text>Subtitles are still being processed for this item. Please check back in 15 minutes.</Text>
            )}
        </>
    );
}
