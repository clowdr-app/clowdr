import { chakra, Grid, Heading, HStack, Text, useColorMode, useToken, VStack } from "@chakra-ui/react";
import React, { useMemo } from "react";
import Color from "tinycolor2";
import {
    Content_ElementType_Enum,
    ElementDataFragment,
    ExhibitionItemFragment,
    ExhibitionWithContentFragment,
    useSelectExhibitionQuery,
} from "../../../../generated/graphql";
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
    const baseBgColour = colorMode === "light" ? "blue.300" : "blue.600";
    const baseGrey = useToken("colors", baseBgColour);
    const baseColour = useMemo(() => (Color(exhibitionColour).getAlpha() !== 0 ? exhibitionColour : baseGrey), [
        baseGrey,
        exhibitionColour,
    ]);
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
    const textColour = bgColour_IsDark ? "white" : "black";

    const primaryItem: ElementDataFragment | undefined = useMemo(() => {
        const sortOrder = [
            Content_ElementType_Enum.VideoBroadcast,
            Content_ElementType_Enum.VideoFile,
            Content_ElementType_Enum.VideoPrepublish,
            Content_ElementType_Enum.VideoUrl,
            Content_ElementType_Enum.PosterFile,
            Content_ElementType_Enum.PosterUrl,
            Content_ElementType_Enum.ImageFile,
            Content_ElementType_Enum.ImageUrl,
            Content_ElementType_Enum.Abstract,
            Content_ElementType_Enum.Text,
        ];

        return [...item.elements].sort((x, y) => sortOrder.indexOf(x.typeName) - sortOrder.indexOf(y.typeName))[0];
    }, [item.elements]);

    const now = useRealTime(30000);
    const liveEvent = useMemo(() => {
        const liveEvents = item.events.filter(
            (x) => Date.parse(x.startTime) <= now + 2 * 60 * 1000 && now <= Date.parse(x.endTime)
        );
        return liveEvents.length > 0 ? liveEvents[0] : undefined;
    }, [item.events, now]);
    const liveRoomUrl = liveEvent ? `/conference/${conference.slug}/room/${liveEvent.roomId}` : undefined;

    const discussionRoomUrl = item.discussionRoom?.length
        ? `/conference/${conference.slug}/room/${item.discussionRoom[0].id}`
        : undefined;

    const itemUrl = `/conference/${conference.slug}/item/${item.id}`;

    return (
        <VStack alignItems="flex-start" backgroundColor={bgColour.toRgbString()} color={textColour} p={[1, 2, 4]}>
            <Heading as="h2" fontSize="lg" textAlign="left">
                <chakra.span mr={4}>{item.title}</chakra.span>
                <PageCountText path={`/conference/${conference.slug}/item/${item.id}`} />
            </Heading>
            <HStack spacing={2} flexWrap="wrap" rowGap={2}>
                {liveRoomUrl && !hideLiveViewButton ? (
                    <LinkButton
                        size="xs"
                        colorScheme="red"
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
                {discussionRoomUrl ? (
                    <LinkButton size="xs" colorScheme="blue" to={discussionRoomUrl} textDecoration="none">
                        <FAIcon iconStyle="s" icon="link" mr={2} />
                        <Text as="span" ml={1} mr={2}>
                            Discussion room
                        </Text>
                        <PageCountText path={discussionRoomUrl} fontSize="inherit" />
                    </LinkButton>
                ) : undefined}
                <LinkButton size="xs" colorScheme="purple" to={itemUrl} textDecoration="none">
                    <FAIcon iconStyle="s" icon="link" mr={2} />
                    <Text as="span" ml={1} mr={2}>
                        View full item
                    </Text>
                    <PageCountText path={itemUrl} fontSize="inherit" />
                </LinkButton>
            </HStack>
            <TagList tags={item.itemTags} />
            {primaryItem && <Element element={primaryItem} />}
            <AuthorList programPeopleData={item.itemPeople} noRegistrantLink />
            {/* <Text>TODO: A marker to show if any of the authors are present</Text> */}
        </VStack>
    );
}

export default function ExhibitionLayout({
    exhibition,
    hideLiveViewButton,
}: {
    exhibition: ExhibitionWithContentFragment;
    hideLiveViewButton?: boolean;
}): JSX.Element {
    const sortedGroups = useMemo(
        () => [...exhibition.items].sort((x, y) => maybeCompare(x.priority, y.priority, (a, b) => a - b)),
        [exhibition.items]
    );
    return (
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(2, 1fr)"]} mt={0} gap={[2, 2, 4]}>
            {sortedGroups.map((cgh) => (
                <ItemTile
                    key={cgh.id}
                    item={cgh.item}
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
    const exhibitionResponse = useSelectExhibitionQuery({
        variables: {
            id: exhibitionId,
        },
    });

    return exhibitionResponse.loading && !exhibitionResponse.data ? (
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
