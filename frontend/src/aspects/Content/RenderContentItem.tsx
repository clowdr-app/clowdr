import type { ContentItemDataBlob } from "@clowdr-app/shared-types/types/content";
import AmazonS3Uri from "amazon-s3-uri";
import React, { useMemo } from "react";
import ReactPlayer from "react-player";
import { ContentType_Enum } from "../../generated/graphql";

export default function RenderContentItem({
    data,
    id,
}: {
    data: ContentItemDataBlob;
    id: string;
}): JSX.Element {
    const latestVersion =
        data.versions && data.versions.length > 0
            ? data.versions[data.versions.length - 1]
            : null;

    const content = useMemo(() => {
        if (latestVersion?.data.type !== ContentType_Enum.VideoBroadcast) {
            return <>Cannot render this ({id}) yet.</>;
        }

        if (!latestVersion.data.transcodedS3Url) {
            return <>The item is still being processed</>;
        }

        const { bucket, key } = AmazonS3Uri(latestVersion.data.transcodedS3Url);

        return (
            <ReactPlayer
                url={`https://${bucket}.s3.eu-west-1.amazonaws.com/${key}`}
            />
        );
    }, [id, latestVersion?.data]);

    return content;
}
