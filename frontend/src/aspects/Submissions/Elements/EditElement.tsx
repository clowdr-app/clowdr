import { Text } from "@chakra-ui/react";
import type { ElementDataBlob } from "@midspace/shared-types/content";
import { ElementBaseType } from "@midspace/shared-types/content";
import React from "react";
import EditSubtitles from "./EditSubtitles";

export function EditElement({
    data,
    elementId,
    magicToken,
    refresh,
}: {
    data: ElementDataBlob;
    elementId: string;
    magicToken: string;
    refresh: () => Promise<void>;
}): JSX.Element {
    const latestVersion = data && data.length > 0 ? data[data.length - 1] : null;

    const latestSubtitles =
        latestVersion?.data.baseType === ElementBaseType.Video ? latestVersion?.data.subtitles["en_US"] : null;
    const latestTranscodeURL =
        latestVersion?.data.baseType === ElementBaseType.Video ? latestVersion?.data.transcode?.s3Url : null;
    return (
        <>
            {latestTranscodeURL && latestSubtitles?.s3Url?.length ? (
                <EditSubtitles
                    videoS3URL={latestTranscodeURL}
                    data={latestSubtitles}
                    elementId={elementId}
                    magicToken={magicToken}
                    refresh={refresh}
                />
            ) : latestVersion?.data.baseType === ElementBaseType.Video ? (
                <Text>Subtitles are still being processed for this item. Please check back in 15 minutes.</Text>
            ) : undefined}
        </>
    );
}
