import { Text, VStack } from "@chakra-ui/react";
import { ContentBaseType, ContentItemDataBlob } from "@clowdr-app/shared-types/build/content";
import AmazonS3Uri from "amazon-s3-uri";
import React from "react";
import ReactPlayer from "react-player";
import FAIcon from "../Icons/FAIcon";

export default function RenderContentItem({ data }: { data: ContentItemDataBlob }): JSX.Element {
    const latestVersion = data && data.length > 0 ? data[data.length - 1] : null;

    function s3UrlToHttpUrl(s3Url: string): string {
        const { bucket, key } = AmazonS3Uri(s3Url);
        return `https://${bucket}.s3.eu-west-1.amazonaws.com/${key}`;
    }

    function content() {
        if (!latestVersion) {
            return <Text mt={5}>No content available to render.</Text>;
        }

        switch (latestVersion.data.baseType) {
            case ContentBaseType.File:
                return (
                    <VStack>
                        <a href={s3UrlToHttpUrl(latestVersion.data.s3Url)}>
                            <FAIcon iconStyle="s" icon="download" />
                        </a>
                        <a href={s3UrlToHttpUrl(latestVersion.data.s3Url)}>File</a>
                    </VStack>
                );
            case ContentBaseType.Link:
                return (
                    <Text>
                        <a href={latestVersion.data.url}>{latestVersion.data.text}</a>
                    </Text>
                );
            case ContentBaseType.Text:
                return <Text>{latestVersion.data.text}</Text>;
            case ContentBaseType.URL:
                return (
                    <Text>
                        URL: <a href={latestVersion.data.url}>{latestVersion.data.url}</a>
                    </Text>
                );
            case ContentBaseType.Video: {
                if (latestVersion.data?.transcode?.status === "FAILED") {
                    return <>Failed to process this item: {latestVersion.data.transcode.message}</>;
                }

                if (!latestVersion.data.transcode?.s3Url) {
                    return <Text>This item is still being processed.</Text>;
                }

                return <ReactPlayer style={{ maxWidth: "100%" }} url={s3UrlToHttpUrl(latestVersion.data.s3Url)} controls={true} />;
            }
        }
    }

    return content();
}
