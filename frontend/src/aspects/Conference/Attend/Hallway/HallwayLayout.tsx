import { chakra, Grid, Heading, HStack, Text, useColorMode, useToken, VStack } from "@chakra-ui/react";
import React, { useMemo } from "react";
import Color from "tinycolor2";
import {
    ContentType_Enum,
    HallwayContentGroupFragment,
    HallwayWithContentFragment,
    useSelectHallwayQuery,
} from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useRealTime } from "../../../Generic/useRealTime";
import { FAIcon } from "../../../Icons/FAIcon";
import PageCountText from "../../../Realtime/PageCountText";
import { maybeCompare } from "../../../Utils/maybeSort";
import { useConference } from "../../useConference";
import { ContentItem } from "../Content/Item/ContentItem";

function ItemTile({
    contentGroup,
    hallwayColour,
    hideLiveViewButton,
}: {
    contentGroup: HallwayContentGroupFragment;
    hallwayColour: string;
    hideLiveViewButton: boolean;
}): JSX.Element {
    const conference = useConference();

    const { colorMode } = useColorMode();
    const baseBgColour = colorMode === "light" ? "blue.300" : "blue.600";
    const baseGrey = useToken("colors", baseBgColour);
    const baseColour = useMemo(() => (Color(hallwayColour).getAlpha() !== 0 ? hallwayColour : baseGrey), [
        baseGrey,
        hallwayColour,
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

    const primaryItem = useMemo(() => {
        const sortOrder = [
            ContentType_Enum.VideoBroadcast,
            ContentType_Enum.VideoFile,
            ContentType_Enum.VideoPrepublish,
            ContentType_Enum.VideoUrl,
            ContentType_Enum.PosterFile,
            ContentType_Enum.PosterUrl,
            ContentType_Enum.ImageFile,
            ContentType_Enum.ImageUrl,
            ContentType_Enum.Abstract,
            ContentType_Enum.Text,
        ];

        return [...contentGroup.contentItems].sort(
            (x, y) => sortOrder.indexOf(x.contentTypeName) - sortOrder.indexOf(y.contentTypeName)
        )[0];
    }, [contentGroup.contentItems]);

    const now = useRealTime(30000);
    const liveEvent = useMemo(() => {
        const liveEvents = contentGroup.events.filter(
            (x) => Date.parse(x.startTime) <= now + 2 * 60 * 1000 && now <= Date.parse(x.endTime)
        );
        return liveEvents.length > 0 ? liveEvents[0] : undefined;
    }, [contentGroup.events, now]);
    const liveRoomUrl = liveEvent ? `/conference/${conference.slug}/room/${liveEvent.roomId}` : undefined;

    const discussionRoomUrl = contentGroup.discussionRoom?.length
        ? `/conference/${conference.slug}/room/${contentGroup.discussionRoom[0].id}`
        : undefined;

    const itemUrl = `/conference/${conference.slug}/item/${contentGroup.id}`;

    return (
        <VStack alignItems="flex-start" backgroundColor={bgColour.toRgbString()} color={textColour} p={[1, 2, 4]}>
            <Heading as="h2" fontSize="lg" textAlign="left">
                <chakra.span mr={4}>{contentGroup.title}</chakra.span>
                <PageCountText path={`/conference/${conference.slug}/item/${contentGroup.id}`} />
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
                <LinkButton size="xs" colorScheme="green" to={itemUrl} textDecoration="none">
                    <FAIcon iconStyle="s" icon="link" mr={2} />
                    <Text as="span" ml={1} mr={2}>
                        View full item
                    </Text>
                    <PageCountText path={itemUrl} fontSize="inherit" />
                </LinkButton>
            </HStack>
            <ContentItem item={primaryItem} />
            {/* <Text>TODO: A marker to show if any of the authors are present</Text> */}
        </VStack>
    );
}

export default function HallwayLayout({
    hallway,
    hideLiveViewButton,
}: {
    hallway: HallwayWithContentFragment;
    hideLiveViewButton?: boolean;
}): JSX.Element {
    const sortedGroups = useMemo(
        () => [...hallway.contentGroups].sort((x, y) => maybeCompare(x.priority, y.priority, (a, b) => a - b)),
        [hallway.contentGroups]
    );
    return (
        <Grid templateColumns={["repeat(1, 1fr)", "repeat(1, 1fr)", "repeat(2, 1fr)"]} mt={0} gap={[2, 2, 4]}>
            {sortedGroups.map((cgh) => (
                <ItemTile
                    key={cgh.id}
                    contentGroup={cgh.contentGroup}
                    hallwayColour={hallway.colour}
                    hideLiveViewButton={hideLiveViewButton ?? false}
                />
            ))}
        </Grid>
    );
}

export function HallwayLayoutWrapper({
    hallwayId,
    hideLiveViewButton,
}: {
    hallwayId: string;
    hideLiveViewButton?: boolean;
}): JSX.Element {
    const hallwayResponse = useSelectHallwayQuery({
        variables: {
            id: hallwayId,
        },
    });

    return hallwayResponse.loading && !hallwayResponse.data ? (
        <CenteredSpinner spinnerProps={{ label: "Loading hallway" }} />
    ) : hallwayResponse.data?.Hallway_by_pk ? (
        <HallwayLayout hallway={hallwayResponse.data.Hallway_by_pk} hideLiveViewButton={hideLiveViewButton} />
    ) : (
        <></>
    );
}
