import { Box, HStack, Image, Link } from "@chakra-ui/react";
import { ContentItemDataBlob, ContentType_Enum, isContentItemDataBlob } from "@clowdr-app/shared-types/build/content";
import AmazonS3URI from "amazon-s3-uri";
import * as R from "ramda";
import React, { useMemo } from "react";
import ReactPlayer from "react-player";
import type { ContentItemDataFragment } from "../../../../../generated/graphql";
import { ExternalLinkButton } from "../../../../Chakra/LinkButton";
import { Markdown } from "../../../../Text/Markdown";
import Schedule from "../../Schedule/Schedule";
import ContentGroupList from "../ContentGroupList";

export function ContentItem({ item }: { item: ContentItemDataFragment }): JSX.Element {
    if (isContentItemDataBlob(item.data)) {
        const blob = item.data;

        return <ContentItemInner blob={blob} type={item.contentTypeName} />;
    }
    return <></>;
}

function ContentItemInner({ blob, type }: { blob: ContentItemDataBlob; type: ContentType_Enum }): JSX.Element {
    const el = useMemo(() => {
        const latestVersion = R.last(blob);

        switch (type) {
            case ContentType_Enum.ContentGroupList:
                return <ContentGroupList />;
            case ContentType_Enum.WholeSchedule:
                return <Schedule />;
        }

        if (!latestVersion) {
            return <></>;
        }

        switch (latestVersion.data.type) {
            case ContentType_Enum.Abstract:
                return (
                    <Box maxW={700}>
                        <Markdown>{latestVersion.data.text}</Markdown>
                    </Box>
                );
            case ContentType_Enum.Zoom:
                return (
                    <ExternalLinkButton to={latestVersion.data.url} isExternal={true} colorScheme="green">
                        Go to Zoom
                    </ExternalLinkButton>
                );
            case ContentType_Enum.Text:
                return (
                    <Box maxW={700}>
                        <Markdown>{latestVersion.data.text}</Markdown>
                    </Box>
                );
            case ContentType_Enum.VideoUrl:
                return (
                    // TODO: Chakra AspectRatio
                    // https://stackoverflow.com/questions/49393838/how-to-make-reactplayer-scale-with-height-and-width
                    <Box maxWidth="100%" width="100%" height="0" paddingTop="56.25%" position="relative">
                        <ReactPlayer
                            url={latestVersion.data.url}
                            style={{ maxWidth: "100%", position: "absolute", top: 0, left: 0 }}
                            width="100%"
                            height="100%"
                            controls={true}
                        />
                    </Box>
                );
            case ContentType_Enum.ImageUrl:
                return <Image src={latestVersion.data.url} style={{ maxWidth: "100%" }} />;
            case ContentType_Enum.ImageFile:
                try {
                    const { bucket, key } = new AmazonS3URI(latestVersion.data.s3Url);
                    if (!bucket || !key) {
                        throw new Error("Missing S3 URI component");
                    }
                    return (
                        <Image
                            src={`https://${bucket}.s3-${
                                import.meta.env.SNOWPACK_PUBLIC_AWS_REGION
                            }.amazonaws.com/${key}`}
                        />
                    );
                } catch (e) {
                    return <>Invalid image URL.</>;
                }
            case ContentType_Enum.Link:
                return <Link href={latestVersion.data.url}>{latestVersion.data.text}</Link>;
            case ContentType_Enum.LinkButton:
                return (
                    <HStack>
                        <ExternalLinkButton colorScheme="green" to={latestVersion.data.url} linkProps={{ mx: "auto" }}>
                            {latestVersion.data.text}
                        </ExternalLinkButton>
                    </HStack>
                );
            case ContentType_Enum.VideoFile:
            case ContentType_Enum.VideoBroadcast:
            case ContentType_Enum.VideoCountdown:
            case ContentType_Enum.VideoFiller:
            case ContentType_Enum.VideoPrepublish:
            case ContentType_Enum.VideoSponsorsFiller:
            case ContentType_Enum.VideoTitles:
                try {
                    const { bucket, key } = new AmazonS3URI(latestVersion.data.s3Url);
                    if (!bucket || !key) {
                        throw new Error("Missing S3 URI component");
                    }
                    return (
                        // TODO: Chakra AspectRatio
                        // https://stackoverflow.com/questions/49393838/how-to-make-reactplayer-scale-with-height-and-width
                        <Box maxWidth="100%" width="100%" height="0" paddingTop="56.25%" position="relative">
                            <ReactPlayer
                                url={`https://${bucket}.s3-${
                                    import.meta.env.SNOWPACK_PUBLIC_AWS_REGION
                                }.amazonaws.com/${key}`}
                                style={{ maxWidth: "100%", position: "absolute", top: 0, left: 0 }}
                                width="100%"
                                height="100%"
                                controls={true}
                            />
                        </Box>
                    );
                } catch (e) {
                    return <>Invalid video URL.</>;
                }

            case ContentType_Enum.PaperUrl:
                return (
                    <ExternalLinkButton to={latestVersion.data.url} isExternal={true} colorScheme="red">
                        Read the PDF
                    </ExternalLinkButton>
                );
            case ContentType_Enum.PaperLink:
                return (
                    <ExternalLinkButton to={latestVersion.data.url} isExternal={true} colorScheme="blue">
                        {latestVersion.data.text}
                    </ExternalLinkButton>
                );
            case ContentType_Enum.PaperFile: {
                const { bucket, key } = new AmazonS3URI(latestVersion.data.s3Url);
                const url = `https://s3.${import.meta.env.SNOWPACK_PUBLIC_AWS_REGION}.amazonaws.com/${bucket}/${key}`;
                return (
                    <ExternalLinkButton to={url} isExternal={true} colorScheme="blue">
                        Open the Paper File
                    </ExternalLinkButton>
                );
            }
            case ContentType_Enum.PosterUrl:
                return (
                    <ExternalLinkButton to={latestVersion.data.url} isExternal={true} colorScheme="red">
                        Read the PDF
                    </ExternalLinkButton>
                );
            case ContentType_Enum.PosterFile: {
                const { bucket, key } = new AmazonS3URI(latestVersion.data.s3Url);
                const url = `https://s3.${import.meta.env.SNOWPACK_PUBLIC_AWS_REGION}.amazonaws.com/${bucket}/${key}`;
                return (
                    <ExternalLinkButton to={url} isExternal={true} colorScheme="blue">
                        Open the Poster File
                    </ExternalLinkButton>
                );
            }

            case ContentType_Enum.VideoLink:
                return (
                    <ExternalLinkButton to={latestVersion.data.url} isExternal={true} colorScheme="blue">
                        {latestVersion.data.text}
                    </ExternalLinkButton>
                );
        }

        return <Box>Cannot render this content.</Box>;
    }, [blob, type]);

    return el;
}
