import {
    Box,
    chakra,
    Flex,
    Grid,
    Heading,
    HStack,
    Text,
    useColorMode,
    useColorModeValue,
    useToken,
} from "@chakra-ui/react";
import type { ElementBlob, ElementDataBlob } from "@clowdr-app/shared-types/build/content";
import { ElementBaseType } from "@clowdr-app/shared-types/build/content";
import React, { useMemo } from "react";
import Color from "tinycolor2";
import type {
    ElementDataFragment,
    ExhibitionItemFragment,
    ExhibitionWithContentFragment,
} from "../../../../generated/graphql";
import { Content_ElementType_Enum, useSelectExhibitionQuery } from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useRealTime } from "../../../Generic/useRealTime";
import { FAIcon } from "../../../Icons/FAIcon";
import PageCountText from "../../../Realtime/PageCountText";
import { maybeCompare } from "../../../Utils/maybeSort";
import { useConference } from "../../useConference";
import { AuthorList } from "../Content/AuthorList";
import { Element } from "../Content/Element/Element";
import TagList from "../Content/TagList";

function ItemTile({
    item,
    exhibitionColour,
    hideLiveViewButton,
}: {
    item: ExhibitionItemFragment;
    exhibitionColour: string;
    hideLiveViewButton: boolean;
}): JSX.Element {
    const conference = useConference();

    const { colorMode } = useColorMode();
    const baseBgColour =
        colorMode === "light" ? "Exhibition.defaultBackgroundColor-light" : "Exhibition.defaultBackgroundColor-dark";
    const baseGrey = useToken("colors", baseBgColour);
    const baseColour = useMemo(
        () => (Color(exhibitionColour).getAlpha() !== 0 ? exhibitionColour : baseGrey),
        [baseGrey, exhibitionColour]
    );
    const bgColour = useMemo(() => {
        const c = Color(baseColour).desaturate(colorMode == "dark" ? 60 : 70);
        const oldBrightness = c.getBrightness();
        const newBrightnessOffset = colorMode == "light" ? 220 - oldBrightness : 50 - oldBrightness;
        if (newBrightnessOffset < 0) {
            c.darken((100 * -newBrightnessOffset) / 255);
        } else {
            c.brighten((100 * newBrightnessOffset) / 255);
        }
        return c;
    }, [baseColour, colorMode]);
    const bgColour_IsDark = useMemo(() => bgColour.isDark(), [bgColour]);
    const textColour = bgColour_IsDark ? "Exhibition.textColor-dark" : "Exhibition.textColor-light";

    const primaryItems: ElementDataFragment[] = useMemo(() => {
        const sortOrder = [
            Content_ElementType_Enum.VideoBroadcast,
            Content_ElementType_Enum.VideoFile,
            Content_ElementType_Enum.VideoPrepublish,
            Content_ElementType_Enum.VideoUrl,
            Content_ElementType_Enum.PosterFile,
            Content_ElementType_Enum.PosterUrl,
            Content_ElementType_Enum.ImageFile,
            Content_ElementType_Enum.ImageUrl,
        ];

        return [...item.elements]
            .filter((x) => {
                if (!sortOrder.includes(x.typeName)) {
                    return false;
                }

                const dataBlob = x.data as ElementDataBlob;
                if (dataBlob.length) {
                    const latestVersion: ElementBlob = dataBlob[dataBlob.length - 1].data;
                    switch (latestVersion.baseType) {
                        case ElementBaseType.Component:
                            return true;
                        case ElementBaseType.File:
                            return !!latestVersion.s3Url?.length;
                        case ElementBaseType.Link:
                            return !!latestVersion.text?.length && !!latestVersion.url?.length;
                        case ElementBaseType.Text:
                            return !!latestVersion.text?.length;
                        case ElementBaseType.URL:
                            return !!latestVersion.url?.length;
                        case ElementBaseType.Video:
                            return !!latestVersion.s3Url?.length;
                    }
                }
                return false;
            })
            .sort((x, y) => sortOrder.indexOf(x.typeName) - sortOrder.indexOf(y.typeName));
    }, [item.elements]);

    const secondaryItems: ElementDataFragment[] = useMemo(() => {
        const sortOrder = [Content_ElementType_Enum.Abstract, Content_ElementType_Enum.Text];

        return [...item.elements]
            .filter((x) => {
                if (!sortOrder.includes(x.typeName)) {
                    return false;
                }

                const dataBlob = x.data as ElementDataBlob;
                if (dataBlob.length) {
                    const latestVersion: ElementBlob = dataBlob[dataBlob.length - 1].data;
                    switch (latestVersion.baseType) {
                        case ElementBaseType.Component:
                            return true;
                        case ElementBaseType.File:
                            return !!latestVersion.s3Url?.length;
                        case ElementBaseType.Link:
                            return !!latestVersion.text?.length && !!latestVersion.url?.length;
                        case ElementBaseType.Text:
                            return !!latestVersion.text?.length;
                        case ElementBaseType.URL:
                            return !!latestVersion.url?.length;
                        case ElementBaseType.Video:
                            return !!latestVersion.s3Url?.length;
                    }
                }
                return false;
            })
            .sort((x, y) => sortOrder.indexOf(x.typeName) - sortOrder.indexOf(y.typeName));
    }, [item.elements]);

    const now = useRealTime(30000);
    const liveEvent = useMemo(() => {
        const liveEvents = item.events.filter(
            (x) => Date.parse(x.startTime) <= now + 2 * 60 * 1000 && now <= Date.parse(x.endTime)
        );
        return liveEvents.length > 0 ? liveEvents[0] : undefined;
    }, [item.events, now]);
    const liveRoomUrl = liveEvent ? `${conferenceUrl}/room/${liveEvent.roomId}` : undefined;

    const discussionRoomUrl = item.discussionRoom?.length
        ? `${conferenceUrl}/room/${item.discussionRoom[0].id}`
        : undefined;

    const itemUrl = `${conferenceUrl}/item/${item.id}`;

    const shadow = useColorModeValue("md", "light-md");
    return (
        <Flex
            flexDir="column"
            alignItems="flex-start"
            backgroundColor={bgColour.toRgbString()}
            borderRadius="md"
            boxShadow={shadow}
            color={textColour}
            p={[1, 2, 4]}
            overflow="hidden"
        >
            <HStack spacing={2}>
                <Heading as="h2" fontSize="lg" textAlign="left" mb={4}>
                    <chakra.span mr={4}>{item.title}</chakra.span>
                    <PageCountText path={`${conferenceUrl}/item/${item.id}`} />
                </Heading>
                {liveRoomUrl && !hideLiveViewButton ? (
                    <LinkButton
                        colorScheme="LiveActionButton"
                        to={liveRoomUrl}
                        title={"Event is happening now. Go to room"}
                        textDecoration="none"
                    >
                        <FAIcon iconStyle="s" icon="link" mr={2} />
                        <Text as="span" ml={1} mr={2}>
                            LIVE View
                        </Text>
                        <PageCountText path={liveRoomUrl} fontSize="inherit" />
                    </LinkButton>
                ) : undefined}
            </HStack>
            {primaryItems.length > 0 ? <Element element={primaryItems[0]} /> : undefined}
            {primaryItems.length > 1 ? (
                <LinkButton to={itemUrl} my={4} colorScheme="PrimaryActionButton" linkProps={{ alignSelf: "center" }}>
                    <FAIcon iconStyle="s" icon="video" mr={2} />
                    View {primaryItems.length - 1} more videos and images
                </LinkButton>
            ) : undefined}
            <Box mt={primaryItems.length === 1 ? 4 : undefined}>
                {secondaryItems.map((item) => (
                    <Element key={item.id} element={item} />
                ))}
            </Box>
            <HStack
                my={4}
                spacing={4}
                gridRowGap={4}
                flexWrap="wrap"
                justifyContent="center"
                alignItems="center"
                w="100%"
            >
                {discussionRoomUrl ? (
                    <LinkButton colorScheme="PrimaryActionButton" to={discussionRoomUrl} textDecoration="none">
                        <FAIcon iconStyle="s" icon="video" mr={2} />
                        <Text as="span" ml={1} mr={2}>
                            Video room
                        </Text>
                        <PageCountText path={discussionRoomUrl} fontSize="inherit" />
                    </LinkButton>
                ) : undefined}
                <LinkButton colorScheme="SecondaryActionButton" to={itemUrl} textDecoration="none">
                    <FAIcon iconStyle="s" icon="link" mr={2} />
                    <Text as="span" ml={1} mr={2}>
                        Find out more
                    </Text>
                    <PageCountText path={itemUrl} fontSize="inherit" />
                </LinkButton>
            </HStack>
            <Box my={4}>
                <AuthorList programPeopleData={item.itemPeople} />
            </Box>
            {/* <Text>TODO: A marker to show if any of the authors are present</Text> */}
            <TagList mt="auto" tags={item.itemTags} />
        </Flex>
    );
}

export default function ExhibitionLayout({
    exhibition,
    hideLiveViewButton,
}: {
    exhibition: ExhibitionWithContentFragment;
    hideLiveViewButton?: boolean;
}): JSX.Element {
    const sortedItems = useMemo(
        () => [...exhibition.items].sort((x, y) => maybeCompare(x.priority, y.priority, (a, b) => a - b)),
        [exhibition.items]
    );
    return (
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(2, 1fr)"]} mt={0} gap={[2, 2, 4]} w="100%">
            {sortedItems.map((item) => (
                <ItemTile
                    key={item.id}
                    item={item.item}
                    exhibitionColour={exhibition.colour}
                    hideLiveViewButton={hideLiveViewButton ?? false}
                />
            ))}
        </Grid>
    );
}

export function ExhibitionLayoutWrapper({
    exhibitionId,
    hideLiveViewButton,
}: {
    exhibitionId: string;
    hideLiveViewButton?: boolean;
}): JSX.Element {
    const [exhibitionResponse] = useSelectExhibitionQuery({
        variables: {
            id: exhibitionId,
        },
    });

    return exhibitionResponse.fetching && !exhibitionResponse.data ? (
        <CenteredSpinner spinnerProps={{ label: "Loading exhibition" }} />
    ) : exhibitionResponse.data?.collection_Exhibition_by_pk ? (
        <ExhibitionLayout
            exhibition={exhibitionResponse.data.collection_Exhibition_by_pk}
            hideLiveViewButton={hideLiveViewButton}
        />
    ) : (
        <></>
    );
}
