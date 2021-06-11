import { Box, Button, Divider, HStack, Image, Link } from "@chakra-ui/react";
import { Content_ElementType_Enum, ElementDataBlob, isElementDataBlob } from "@clowdr-app/shared-types/build/content";
import AmazonS3URI from "amazon-s3-uri";
import * as R from "ramda";
import React, { useMemo } from "react";
import ReactPlayer from "react-player";
import type { ElementDataFragment } from "../../../../../generated/graphql";
import { ExternalLinkButton } from "../../../../Chakra/LinkButton";
import { Markdown } from "../../../../Text/Markdown";
import ActiveSocialRooms from "../../Rooms/V2/ActiveSocialRooms";
import LiveProgramRooms from "../../Rooms/V2/LiveProgramRooms";
import SponsorBooths from "../../Rooms/V2/SponsorBooths";
import { useScheduleModal } from "../../Schedule/ProgramModal";
import Schedule from "../../Schedule/Schedule";
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
                    <Button colorScheme="purple" onClick={() => scheduleModal.onOpen(undefined, "Tags")}>
                        Explore the program
                    </Button>
                );
            case Content_ElementType_Enum.ExploreScheduleButton:
                return (
                    <Button colorScheme="purple" onClick={() => scheduleModal.onOpen(undefined, "Schedule")}>
                        Explore the schedule
                    </Button>
                );
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
                    <ExternalLinkButton to={latestVersion.data.url} isExternal={true} colorScheme="purple">
                        Go to {name}
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
                return (
                    <Image
                        src={latestVersion.data.url}
                        style={{ maxWidth: "100%" }}
                        alt="External image - no caption provided"
                    />
                );
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
                            alt="No caption provided"
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
                        <ExternalLinkButton colorScheme="purple" to={latestVersion.data.url} linkProps={{ mx: "auto" }}>
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
                return <VideoElement elementId={elementId} videoElementData={latestVersion.data} />;

            case Content_ElementType_Enum.PaperUrl:
                return (
                    <ExternalLinkButton to={latestVersion.data.url} isExternal={true} colorScheme="red">
                        Open {name}
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
                            Open {name}
                        </ExternalLinkButton>
                    );
                } catch (e) {
                    return <>Invalid file URL.</>;
                }
            }
            case Content_ElementType_Enum.PosterUrl:
                return (
                    <ExternalLinkButton to={latestVersion.data.url} isExternal={true} colorScheme="red">
                        Open {name}
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
                        return <Image src={url} alt="No caption provided" />;
                    } else {
                        return (
                            <ExternalLinkButton to={url} isExternal={true} colorScheme="blue">
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
                    <ExternalLinkButton to={latestVersion.data.url} isExternal={true} colorScheme="blue">
                        {latestVersion.data.text}
                    </ExternalLinkButton>
                );
        }

        return <Box>Cannot {name} content.</Box>;
    }, [blob, type, name, scheduleModal, elementId]);

    return el;
}
