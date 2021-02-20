import { chakra, Flex, HStack, Text, VStack } from "@chakra-ui/react";
import { formatRelative } from "date-fns";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ContentGroupDataFragment,
    ContentGroupEventFragment,
    ContentGroupEventsFragment,
    ContentGroupPage_ContentGroupRoomsFragment,
    ContentGroupType_Enum,
} from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import usePolling from "../../../Generic/usePolling";
import FAIcon from "../../../Icons/FAIcon";
import PageCountText from "../../../Presence/PageCountText";
import { useConference } from "../../useConference";

export function ContentGroupLive({
    contentGroupData,
}: {
    contentGroupData: ContentGroupDataFragment &
        ContentGroupEventsFragment &
        ContentGroupPage_ContentGroupRoomsFragment;
}): JSX.Element {
    const [liveEvents, setLiveEvents] = useState<ContentGroupEventFragment[] | null>(null);
    const [nextEvent, setNextEvent] = useState<ContentGroupEventFragment | null>(null);
    const [now, setNow] = useState<number>(Date.now());
    const computeLiveEvent = useCallback(() => {
        const now = Date.now();
        const currentEvents = contentGroupData.events.filter(
            (event) => Date.parse(event.startTime) <= now && now <= Date.parse(event.endTime)
        );
        setLiveEvents(currentEvents);

        const nextEvent = R.sortWith(
            [R.ascend(R.prop("startTime"))],
            contentGroupData.events.filter((event) => Date.parse(event.startTime) > now)
        );
        setNextEvent(nextEvent.length > 0 ? nextEvent[0] : null);
        setNow(now);
    }, [contentGroupData.events]);
    usePolling(computeLiveEvent, 5000, true);
    useEffect(() => computeLiveEvent(), [computeLiveEvent]);

    const currentRoom = useMemo(() => (contentGroupData.rooms.length > 0 ? contentGroupData.rooms[0] : undefined), [
        contentGroupData.rooms,
    ]);

    const conference = useConference();

    return (
        <Flex mb={2} flexWrap="wrap">
            {currentRoom ? (
                <LinkButton
                    width="100%"
                    to={`/conference/${conference.slug}/room/${currentRoom.id}`}
                    size="lg"
                    colorScheme="blue"
                    height="auto"
                    py={2}
                    mb={2}
                    linkProps={{ mr: 2 }}
                >
                    <VStack spacing={0}>
                        <Text>
                            {contentGroupData.contentGroupTypeName === ContentGroupType_Enum.Sponsor ? (
                                <>
                                    <FAIcon iconStyle="s" icon="video" mr={2} fontSize="90%" verticalAlign="middle" />{" "}
                                    <chakra.span verticalAlign="middle" pb={0.7}>
                                        Booth
                                    </chakra.span>
                                </>
                            ) : (
                                <>
                                    <FAIcon iconStyle="s" icon="video" mr={2} fontSize="90%" verticalAlign="middle" />{" "}
                                    <chakra.span verticalAlign="middle" pb={0.7}>
                                        Discussion room
                                    </chakra.span>
                                </>
                            )}
                        </Text>
                        <PageCountText path={`/conference/${conference.slug}/room/${currentRoom.id}`} />
                    </VStack>
                </LinkButton>
            ) : undefined}
            {liveEvents?.map((event) => (
                <LinkButton
                    width="100%"
                    to={`/conference/${conference.slug}/room/${event.room.id}`}
                    key={event.id}
                    size="lg"
                    colorScheme="red"
                    height="auto"
                    py={2}
                    mb={2}
                    linkProps={{ mr: 2 }}
                >
                    <VStack spacing={0}>
                        <FAIcon iconStyle="s" icon="calendar" mr={2} fontSize="90%" verticalAlign="middle" />{" "}
                        <chakra.span verticalAlign="middle" pb={0.7}>
                            Live now
                        </chakra.span>
                    </VStack>
                </LinkButton>
            ))}
            {nextEvent ? (
                <LinkButton
                    width="100%"
                    to={`/conference/${conference.slug}/room/${nextEvent.room.id}`}
                    size="sm"
                    colorScheme="teal"
                    height="auto"
                    py={2}
                    mb={2}
                >
                    <HStack spacing={2}>
                        <FAIcon iconStyle="s" icon="calendar" mr={2} fontSize="90%" verticalAlign="middle" />{" "}
                        <chakra.span verticalAlign="middle" pb={0.7}>
                            Room for next event
                        </chakra.span>
                        <chakra.span verticalAlign="middle" pb={0.7} fontSize="sm" fontStyle="italic">
                            ({formatRelative(Date.parse(nextEvent.startTime), now)})
                        </chakra.span>
                    </HStack>
                </LinkButton>
            ) : (
                <></>
            )}
        </Flex>
    );
}
