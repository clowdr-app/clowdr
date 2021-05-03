import { Box, HStack, Image, Link } from "@chakra-ui/react";
import { Content_ElementType_Enum, ElementDataBlob, isElementDataBlob } from "@clowdr-app/shared-types/build/content";
import AmazonS3URI from "amazon-s3-uri";
import * as R from "ramda";
import React, { useMemo } from "react";
import ReactPlayer from "react-player";
import type { ElementDataFragment } from "../../../../../generated/graphql";
import { ExternalLinkButton } from "../../../../Chakra/LinkButton";
import { Markdown } from "../../../../Text/Markdown";
import Schedule from "../../Schedule/Schedule";
import ItemList from "../ItemList";

export function Element({ item }: { item: ElementDataFragment }): JSX.Element {
    if (isElementDataBlob(item.data)) {
        const blob = item.data;

        return <ElementInner blob={blob} type={item.typeName} />;
    }
    return <></>;
}

function ElementInner({ blob, type }: { blob: ElementDataBlob; type: Content_ElementType_Enum }): JSX.Element {
    const el = useMemo(() => {
        const latestVersion = R.last(blob);

        switch (type) {
            case Content_ElementType_Enum.ContentGroupList:
                return <ItemList />;
            case Content_ElementType_Enum.WholeSchedule:
                return <Schedule />;
        }

        if (!latestVersion) {
            return <></>;
        }

        switch (latestVersion.data.type) {
            case Content_ElementType_Enum.Abstract:
                return (
                    <Box maxW={700}>
                        <Markdown>{latestVersion.data.text}</Markdown>
                    </Box>
                );
            case Content_ElementType_Enum.Zoom:
                return (
                    <ExternalLinkButton to={latestVersion.data.url} isExternal={true} colorScheme="green">
                        Go to Zoom
                    </ExternalLinkButton>
                );
            case Content_ElementType_Enum.Text:
                return (
                    <Box maxW={700}>
                        <Markdown>{latestVersion.data.text}</Markdown>
                    </Box>
                );
            case Content_ElementType_Enum.VideoUrl:
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
            case Content_ElementType_Enum.ImageUrl:
                return <Image src={latestVersion.data.url} style={{ maxWidth: "100%" }} />;
            case Content_ElementType_Enum.ImageFile:
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
            case Content_ElementType_Enum.Link:
                return <Link href={latestVersion.data.url}>{latestVersion.data.text}</Link>;
            case Content_ElementType_Enum.LinkButton:
                return (
                    <HStack>
                        <ExternalLinkButton colorScheme="green" to={latestVersion.data.url} linkProps={{ mx: "auto" }}>
                            {latestVersion.data.text}
                        </ExternalLinkButton>
                    </HStack>
                );
            case Content_ElementType_Enum.VideoFile:
            case Content_ElementType_Enum.VideoBroadcast:
            case Content_ElementType_Enum.VideoCountdown:
            case Content_ElementType_Enum.VideoFiller:
            case Content_ElementType_Enum.VideoPrepublish:
            case Content_ElementType_Enum.VideoSponsorsFiller:
            case Content_ElementType_Enum.VideoTitles:
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

            case Content_ElementType_Enum.PaperUrl:
                return (
                    <ExternalLinkButton to={latestVersion.data.url} isExternal={true} colorScheme="red">
                        Read the PDF
                    </ExternalLinkButton>
                );
            case Content_ElementType_Enum.PaperLink:
                return (
                    <ExternalLinkButton to={latestVersion.data.url} isExternal={true} colorScheme="blue">
                        {latestVersion.data.text}
                    </ExternalLinkButton>
                );
            case Content_ElementType_Enum.PaperFile: {
                try {
                    const { bucket, key } = new AmazonS3URI(latestVersion.data.s3Url);
                    if (!bucket || !key) {
                        throw new Error("Missing S3 URI component");
                    }
                    const url = `https://s3.${
                        import.meta.env.SNOWPACK_PUBLIC_AWS_REGION
                    }.amazonaws.com/${bucket}/${key}`;
                    return (
                        <ExternalLinkButton to={url} isExternal={true} colorScheme="blue">
                            Open the Paper File
                        </ExternalLinkButton>
                    );
                } catch (e) {
                    return <>Invalid file URL.</>;
                }
            }
            case Content_ElementType_Enum.PosterUrl:
                return (
                    <ExternalLinkButton to={latestVersion.data.url} isExternal={true} colorScheme="red">
                        Read the PDF
                    </ExternalLinkButton>
                );
            case Content_ElementType_Enum.PosterFile: {
                try {
                    const { bucket, key } = new AmazonS3URI(latestVersion.data.s3Url);
                    if (!bucket || !key) {
                        throw new Error("Missing S3 URI component");
                    }
                    const url = `https://s3.${
                        import.meta.env.SNOWPACK_PUBLIC_AWS_REGION
                    }.amazonaws.com/${bucket}/${key}`;
                    if (
                        key.endsWith(".jpg") ||
                        key.endsWith(".gif") ||
                        key.endsWith(".png") ||
                        key.endsWith(".jpeg") ||
                        key.endsWith(".webp")
                    ) {
                        return <Image src={url} />;
                    } else {
                        return (
                            <ExternalLinkButton to={url} isExternal={true} colorScheme="blue">
                                Open the Poster File
                            </ExternalLinkButton>
                        );
                    }
                } catch (e) {
                    return <>Invalid file URL.</>;
                }
            }

            case Content_ElementType_Enum.VideoLink:
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
