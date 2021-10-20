import { Box, Container, Text, VStack } from "@chakra-ui/react";
import type { ElementDataBlob } from "@clowdr-app/shared-types/build/content";
import { ElementBaseType } from "@clowdr-app/shared-types/build/content";
import AmazonS3Uri from "amazon-s3-uri";
import React from "react";
import { ExternalLinkButton } from "../../Chakra/LinkButton";
import { VideoElement } from "../../Conference/Attend/Content/Element/VideoElement";
import FAIcon from "../../Icons/FAIcon";
import { Markdown } from "../../Text/Markdown";

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
            case ElementBaseType.File:
                return (
                    <>
                        <ExternalLinkButton
                            to={s3UrlToHttpUrl(latestVersion.data.s3Url)}
                            isExternal={true}
                            size="lg"
                            height="auto"
                            aria-label="Download previously submitted file"
                        >
                            <VStack m={4}>
                                <FAIcon iconStyle="s" icon="download" />
                                <Text>Previously submitted file</Text>
                            </VStack>
                        </ExternalLinkButton>
                        <Text>
                            Alternative text:{" "}
                            {latestVersion.data.altText?.length ? latestVersion.data.altText : "None provided"}
                        </Text>
                    </>
                );
            case ElementBaseType.Link:
                return (
                    <>
                        <Text>
                            URL: <a href={latestVersion.data.url}>{latestVersion.data.url}</a>
                        </Text>
                        <Text>Text: {latestVersion.data.text}</Text>
                    </>
                );
            case ElementBaseType.Text:
                return (
                    <Container maxW="container.md">
                        <Markdown>{latestVersion.data.text}</Markdown>
                    </Container>
                );
            case ElementBaseType.URL:
                return (
                    <>
                        <Text>
                            URL: <a href={latestVersion.data.url}>{latestVersion.data.url}</a>
                        </Text>
                        <Text>
                            Title: {latestVersion.data.title?.length ? latestVersion.data.title : "None provided"}
                        </Text>
                    </>
                );
            case ElementBaseType.Video: {
                if (latestVersion.data?.transcode?.status === "FAILED") {
                    return <>Failed to process this item: {latestVersion.data.transcode.message}</>;
                }

                if (!latestVersion.data.transcode?.s3Url) {
                    return <Text>This item is still being processed. Please check back in 15 minutes.</Text>;
                }

                return <VideoElement elementData={latestVersion.data} />;
            }
            case ElementBaseType.Audio: {
                return <VideoElement elementData={latestVersion.data} />;
            }
            case ElementBaseType.Component: {
                return <Text>This item type cannot be submitted.</Text>;
            }
        }
    }

    return (
        <Box border="1px solid" borderColor="gray.400" w="100%" p={2} borderRadius="md" overflow="auto">
            {content()}
        </Box>
    );
}
