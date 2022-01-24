import { AspectRatio, Box, Button, Container, Divider, HStack, Image, Link } from "@chakra-ui/react";
import type { ElementDataBlob } from "@clowdr-app/shared-types/build/content";
import { Content_ElementType_Enum, isElementDataBlob } from "@clowdr-app/shared-types/build/content";
import AmazonS3URI from "amazon-s3-uri";
import * as R from "ramda";
import React, { useMemo } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import ReactPlayer from "react-player";
import type { ElementDataFragment } from "../../../../../generated/graphql";
import { ExternalLinkButton } from "../../../../Chakra/LinkButton";
import { FAIcon } from "../../../../Icons/FAIcon";
import { Markdown } from "../../../../Text/Markdown";
import ActiveSocialRooms from "../../Rooms/V2/ActiveSocialRooms";
import LiveProgramRooms from "../../Rooms/V2/LiveProgramRooms";
import SponsorBooths from "../../Rooms/V2/SponsorBooths";
import { ProgramModalTab, useScheduleModal } from "../../Schedule/ProgramModal";
import Schedule from "../../Schedule/v1/Schedule";
import ItemList from "../ItemList";
import { VideoElement } from "./VideoElement";

export function Element({ element }: { element: ElementDataFragment }): JSX.Element {
    if (element.data && isElementDataBlob(element.data)) {
        const blob = element.data;
        return <ElementInner name={element.name} blob={blob} type={element.typeName} elementId={element.id} />;
    }
    return <></>;
}

function ElementInner({
    blob,
    type,
    name,
    elementId,
}: {
    name: string;
    blob: ElementDataBlob;
    type: Content_ElementType_Enum;
    elementId: string;
}): JSX.Element {
    const intl = useIntl();
    const scheduleModal = useScheduleModal();

    const el = useMemo(() => {
        const latestVersion = R.last(blob);

        switch (type) {
            case Content_ElementType_Enum.ContentGroupList:
                return <ItemList pt="3ex" />;
            case Content_ElementType_Enum.WholeSchedule:
                return <Schedule />;
            case Content_ElementType_Enum.LiveProgramRooms:
                return <LiveProgramRooms />;
            case Content_ElementType_Enum.ActiveSocialRooms:
                return <ActiveSocialRooms excludeLiveEventRooms={true} />;
            case Content_ElementType_Enum.Divider:
                return <Divider />;
            case Content_ElementType_Enum.SponsorBooths:
                return <SponsorBooths />;
            case Content_ElementType_Enum.ExploreProgramButton:
                return (
                    <Button
                        colorScheme="PrimaryActionButton"
                        onClick={() => scheduleModal.onOpen(undefined, ProgramModalTab.Tags)}
                    >
                        <FAIcon iconStyle="s" icon="tags" mr={2} />
                        <FormattedMessage
                            id="Conference.Attend.Content.Element.Element.BrowseContent"
                            defaultMessage="Browse content"
                        />
                    </Button>
                );
            case Content_ElementType_Enum.ExploreScheduleButton:
                return (
                    <Button
                        colorScheme="PrimaryActionButton"
                        onClick={() => scheduleModal.onOpen(undefined, ProgramModalTab.Schedule)}
                    >
                        <FAIcon iconStyle="s" icon="calendar" mr={2} />
                        <FormattedMessage
                            id="Conference.Attend.Content.Element.Element.FullSchedule"
                            defaultMessage="Full schedule"
                        />
                    </Button>
                );
        }

        if (!latestVersion) {
            return <></>;
        }

        switch (latestVersion.data.type) {
            case Content_ElementType_Enum.Abstract:
                return (
                    <Container width="100%" maxW="50em" mx={0}>
                        <Markdown>{latestVersion.data.text}</Markdown>
                    </Container>
                );
            case Content_ElementType_Enum.Zoom:
                return (
                    <ExternalLinkButton to={latestVersion.data.url} isExternal={true} colorScheme="PrimaryActionButton">
                        Go to {name}
                    </ExternalLinkButton>
                );
            case Content_ElementType_Enum.Text:
                return (
                    <Container width="100%" maxW="50em" mx={0}>
                        <Markdown>{latestVersion.data.text}</Markdown>
                    </Container>
                );
            case Content_ElementType_Enum.VideoUrl:
            case Content_ElementType_Enum.AudioUrl:
                return (
                    <AspectRatio ratio={16 / 9} w="min(100%, 90vh * (16 / 9))" maxW="800px" m={2}>
                        <ReactPlayer
                            url={latestVersion.data.url}
                            style={{ maxWidth: "100%", position: "absolute", top: 0, left: 0 }}
                            width="100%"
                            height="100%"
                            controls={true}
                        />
                    </AspectRatio>
                );
            case Content_ElementType_Enum.AudioFile:
                {
                    if (
                        latestVersion.data.s3Url.endsWith(".mp3") ||
                        latestVersion.data.s3Url.endsWith(".wav") ||
                        latestVersion.data.s3Url.endsWith(".ogg")
                    ) {
                        return <VideoElement elementId={elementId} elementData={latestVersion.data} />;
                    } else {
                        return (
                            <ExternalLinkButton
                                to={latestVersion.data.s3Url}
                                isExternal={true}
                                colorScheme="PrimaryActionButton"
                            >
                                {name}
                            </ExternalLinkButton>
                        );
                    }
                }
                break;
            case Content_ElementType_Enum.ImageUrl:
                return (
                    <Box>
                        <Image
                            src={latestVersion.data.url}
                            style={{ maxWidth: "100%" }}
                            alt={
                                latestVersion.data.title?.length
                                    ? latestVersion.data.title
                                    : intl.formatMessage({ id: 'Conference.Attend.Content.Element.Element.OffSiteImage', defaultMessage: "Off-site image - no caption provided" })
                            }
                        />
                    </Box>
                );
            case Content_ElementType_Enum.ImageFile:
                try {
                    const { bucket, key } = new AmazonS3URI(latestVersion.data.s3Url);
                    if (!bucket || !key) {
                        throw new Error("Missing S3 URI component");
                    }
                    return (
                        <Box>
                            <Image
                                src={`https://${bucket}.s3-${
                                    import.meta.env.SNOWPACK_PUBLIC_AWS_REGION
                                }.amazonaws.com/${key}`}
                                alt={
                                    latestVersion.data.altText?.length
                                        ? latestVersion.data.altText
                                        : intl.formatMessage({ id: 'Conference.Attend.Content.Element.Element.NoCaptionProvided', defaultMessage: "No caption provided" })
                                }
                            />
                        </Box>
                    );
                } catch (e) {
                    return <>
                        <FormattedMessage
                            id="Conference.Attend.Content.Element.Element.InvalidImageUrl"
                            defaultMessage="Invalid image URL."
                        />
                    </>;
                }
            case Content_ElementType_Enum.Link:
                return <Link href={latestVersion.data.url}>{latestVersion.data.text}</Link>;
            case Content_ElementType_Enum.LinkButton:
                return (
                    <HStack>
                        <ExternalLinkButton
                            colorScheme="PrimaryActionButton"
                            to={latestVersion.data.url}
                            linkProps={{ mx: "auto" }}
                            whiteSpace="normal"
                            h="auto"
                            py={2}
                        >
                            <FAIcon iconStyle="s" icon="link" mr={2} />
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
                return <VideoElement elementId={elementId} elementData={latestVersion.data} aspectRatio={true} />;

            case Content_ElementType_Enum.PaperUrl:
                return (
                    <ExternalLinkButton to={latestVersion.data.url} isExternal={true} colorScheme="PrimaryActionButton">
                        <FormattedMessage
                            id="Conference.Attend.Content.Element.Element.OpenName"
                            defaultMessage="Open {name}"
                            values={{ name: name }}
                        />
                    </ExternalLinkButton>
                );
            case Content_ElementType_Enum.PaperLink:
                return (
                    <ExternalLinkButton
                        to={latestVersion.data.url}
                        isExternal={true}
                        colorScheme="PrimaryActionButton"
                        whiteSpace="normal"
                        h="auto"
                        py={2}
                    >
                        <FAIcon iconStyle="s" icon="link" mr={2} />
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
                        <ExternalLinkButton to={url} isExternal={true} colorScheme="PrimaryActionButton">
                            <FormattedMessage
                                id="Conference.Attend.Content.Element.Element.OpenName"
                                defaultMessage="Open {name}"
                                values={{ name: name }}
                            />
                        </ExternalLinkButton>
                    );
                } catch (e) {
                    return <>
                        <FormattedMessage
                            id="Conference.Attend.Content.Element.Element.InvalidFileUrl"
                            defaultMessage="Invalid file URL."
                        />
                    </>;
                }
            }
            case Content_ElementType_Enum.PosterUrl:
                return (
                    <ExternalLinkButton to={latestVersion.data.url} isExternal={true} colorScheme="PrimaryActionButton">
                        <FormattedMessage
                            id="Conference.Attend.Content.Element.Element.OpenName"
                            defaultMessage="Open {name}"
                            values={{ name: name }}
                        />
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
                        return (
                            <Box>
                                <Image
                                    src={url}
                                    alt={
                                        latestVersion.data.altText?.length
                                            ? latestVersion.data.altText
                                            : intl.formatMessage({ id: 'Conference.Attend.Content.Element.Element.NoCaptionProvided', defaultMessage: "No caption provided" })
                                    }
                                />
                            </Box>
                        );
                    } else {
                        return (
                            <ExternalLinkButton to={url} isExternal={true} colorScheme="PrimaryActionButton">
                                Open {name}
                            </ExternalLinkButton>
                        );
                    }
                } catch (e) {
                    return <>Invalid file URL.</>;
                }
            }

            case Content_ElementType_Enum.VideoLink:
                return (
                    <ExternalLinkButton
                        to={latestVersion.data.url}
                        isExternal={true}
                        colorScheme="PrimaryActionButton"
                        whiteSpace="normal"
                        h="auto"
                        py={2}
                    >
                        <FAIcon iconStyle="s" icon="video" mr={2} />
                        {latestVersion.data.text}
                    </ExternalLinkButton>
                );

            case Content_ElementType_Enum.AudioLink:
                return (
                    <ExternalLinkButton
                        to={latestVersion.data.url}
                        isExternal={true}
                        colorScheme="PrimaryActionButton"
                        whiteSpace="normal"
                        h="auto"
                        py={2}
                    >
                        <FAIcon iconStyle="s" icon="volume-up" mr={2} />
                        {latestVersion.data.text}
                    </ExternalLinkButton>
                );
        }

        return <Box>Cannot {name} content.</Box>;
    }, [blob, type, name, scheduleModal, elementId]);

    return el;
}
