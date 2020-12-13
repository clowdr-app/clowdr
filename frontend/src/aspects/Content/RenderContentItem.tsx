import {
    ContentItemDataBlob,
    ContentType_Enum,
} from "@clowdr-app/shared-types/types/content";
import AmazonS3Uri from "amazon-s3-uri";
import React, { useMemo } from "react";
import ReactPlayer from "react-player";

export default function RenderContentItem({
    data,
    id,
}: {
    data: ContentItemDataBlob;
    id: string;
}): JSX.Element {
    const latestVersion =
        data && data.length > 0 ? data[data.length - 1] : null;

    const content = useMemo(() => {
        if (latestVersion?.data.type !== ContentType_Enum.VideoBroadcast) {
            return <>Cannot render this ({id}) yet.</>;
        }

        if (latestVersion.data?.transcode?.status === "FAILED") {
            return (
                <>
                    Failed to process this item:{" "}
                    {latestVersion.data.transcode.message}
                </>
            );
        }

        if (!latestVersion.data.transcode?.s3Url) {
            return <>This item is still being processed.</>;
        }

        const { bucket, key } = AmazonS3Uri(latestVersion.data.transcode.s3Url);

        return (
            <ReactPlayer
                url={`https://${bucket}.s3.eu-west-1.amazonaws.com/${key}`}
            />
        );
    }, [id, latestVersion?.data]);

    return content;
}
