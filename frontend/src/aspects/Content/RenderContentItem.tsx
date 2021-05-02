import { Text, VStack } from "@chakra-ui/react";
import { ContentBaseType, ElementDataBlob } from "@clowdr-app/shared-types/build/content";
import AmazonS3Uri from "amazon-s3-uri";
import React from "react";
import ReactPlayer from "react-player";
import { ExternalLinkButton } from "../Chakra/LinkButton";
import FAIcon from "../Icons/FAIcon";

export default function RenderElement({ data }: { data: ElementDataBlob }): JSX.Element {
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
                    <ExternalLinkButton
                        to={s3UrlToHttpUrl(latestVersion.data.s3Url)}
                        isExternal={true}
                        size="lg"
                        height="auto"
                        aria-label="Download previously uploaded file"
                    >
                        <VStack m={4}>
                            <FAIcon iconStyle="s" icon="download" />
                            <Text>Previously uploaded file</Text>
                        </VStack>
                    </ExternalLinkButton>
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
                    return <Text>This item is still being processed. Please check back in 15 minutes.</Text>;
                }

                return (
                    <ReactPlayer
                        style={{ maxWidth: "100%" }}
                        url={s3UrlToHttpUrl(latestVersion.data.transcode.s3Url)}
                        controls={true}
                    />
                );
            }
            case ContentBaseType.Component: {
                return <Text>This item type cannot be uploaded.</Text>;
            }
        }
    }

    return content();
}
