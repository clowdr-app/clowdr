import { Text } from "@chakra-ui/react";
import type { ContentItemDataBlob } from "@clowdr-app/shared-types/types/content";
import AmazonS3Uri from "amazon-s3-uri";
import React from "react";
import ReactPlayer from "react-player";

export default function RenderContentItem({
    data,
}: {
    data: ContentItemDataBlob;
}): JSX.Element {
    const latestVersion =
        data && data.length > 0 ? data[data.length - 1] : null;

    function content() {
        if (!latestVersion) {
            return <Text mt={5}>No content available to render.</Text>;
        }

        switch (latestVersion.data.baseType) {
            case "file":
                return <>Cannot render files yet</>;
            case "link":
                return <>Cannot render links yet</>;
            case "text":
                return <Text mt={5}>{latestVersion.data.text}</Text>;
            case "url":
                return <Text mt={5}>URL: {latestVersion.data.url}</Text>;
            case "video": {
                if (latestVersion.data?.transcode?.status === "FAILED") {
                    return (
                        <>
                            Failed to process this item:{" "}
                            {latestVersion.data.transcode.message}
                        </>
                    );
                }

                if (!latestVersion.data.transcode?.s3Url) {
                    return (
                        <Text mt={5}>This item is still being processed.</Text>
                    );
                }
                const { bucket, key } = AmazonS3Uri(
                    latestVersion.data.transcode.s3Url
                );
                return (
                    <ReactPlayer
                        url={`https://${bucket}.s3.eu-west-1.amazonaws.com/${key}`}
                        controls={true}
                    />
                );
            }
        }
    }

    return content();
}
