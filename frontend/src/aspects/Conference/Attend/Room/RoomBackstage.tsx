import { gql } from "@apollo/client";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    Divider,
    Heading,
    HStack,
    Text,
    useColorModeValue,
    useToast,
    useToken,
    VStack,
} from "@chakra-ui/react";
import { formatRelative } from "date-fns";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as portals from "react-reverse-portal";
import { useHistory } from "react-router-dom";
import {
    RoomMode_Enum,
    Room_EventSummaryFragment,
    useRoomBackstage_GetEventBreakoutRoomQuery,
} from "../../../../generated/graphql";
import usePolling from "../../../Generic/usePolling";
import { useSharedRoomContext } from "../../../Room/useSharedRoomContext";
import { useConference } from "../../useConference";
import { EventVonageRoom } from "./Event/EventVonageRoom";

gql`
    query RoomBackstage_GetEventBreakoutRoom($originatingEventId: uuid!) {
        Room(where: { originatingEventId: { _eq: $originatingEventId } }) {
            id
        }
    }
`;

export function RoomBackstage({
    backstage,
    roomName,
    roomEvents,
    currentRoomEventId,
}: {
    backstage: boolean;
    roomName: string;
    roomEvents: readonly Room_EventSummaryFragment[];
    currentRoomEventId: string | null;
}): JSX.Element {
    const [gray100, gray900] = useToken("colors", ["gray.100", "gray.900"]);
    const backgroundColour = useColorModeValue(gray100, gray900);
    const borderColour = useColorModeValue(gray900, gray100);

    const sortedEvents = useMemo(
        () =>
            R.sortWith(
                [R.ascend(R.prop("startTime"))],
                roomEvents.filter((event) =>
                    [RoomMode_Enum.Presentation, RoomMode_Enum.QAndA].includes(event.intendedRoomModeName)
                )
            ),
        [roomEvents]
    );

    const [now, setNow] = useState<number>(Date.now());
    const updateNow = useCallback(() => {
        setNow(Date.now());
    }, []);
    usePolling(updateNow, 5000, true);

    const isEventNow = useCallback(
        (event: Room_EventSummaryFragment): boolean => {
            const startTime = Date.parse(event.startTime);
            const endTime = Date.parse(event.endTime);
            return now >= startTime && now <= endTime;
        },
        [now]
    );

    const isEventSoon = useCallback(
        (event: Room_EventSummaryFragment): boolean => {
            const startTime = Date.parse(event.startTime);
            return now >= startTime - 10 * 60 * 1000 && now <= startTime;
        },
        [now]
    );

    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

    const makeEventEl = useCallback(
        (event: Room_EventSummaryFragment, category: string) => {
            const eventData = roomEvents.find((x) => x.id === event.id);
            const title = eventData?.contentGroup ? `${eventData.contentGroup.title} (${event.name})` : event.name;
            const isSelected = event.id === selectedEventId;
            return (
                <>
                    <HStack
                        key={event.id}
                        border={`1px ${borderColour} solid`}
                        width="max-content"
                        p={4}
                        alignItems="center"
                        borderRadius="md"
                        flexWrap="wrap"
                    >
                        <Heading as="h3" size="md" width="min-content" textAlign="right" mr={8}>
                            {category}
                        </Heading>
                        <Button
                            colorScheme={isSelected ? "red" : "green"}
                            onClick={() => (isSelected ? setSelectedEventId(null) : setSelectedEventId(event.id))}
                            height="min-content"
                            py={4}
                        >
                            <VStack>
                                <Text fontSize="lg">{isSelected ? "Close backstage room" : "Open backstage room"}</Text>
                                <Text>{title}</Text>
                            </VStack>
                        </Button>

                        <VStack px={8} alignItems="left">
                            <Heading as="h4" size="md" textAlign="left" mt={2} mb={1}>
                                {title}
                            </Heading>

                            <Text my={2} fontStyle="italic">
                                {formatRelative(Date.parse(event.startTime), now)}
                            </Text>
                        </VStack>
                    </HStack>

                    {selectedEventId === event.id ? (
                        <Box mt={2}>
                            <EventVonageRoom eventId={event.id} />
                            <Alert status="info" mb={8}>
                                <AlertIcon />
                                Once this event ends, you will be automatically taken to a breakout room to continue the
                                conversation.
                            </Alert>
                        </Box>
                    ) : undefined}
                </>
            );
        },
        [borderColour, now, roomEvents, selectedEventId]
    );

    const eventRooms = useMemo(
        () => (
            <Box mt={4}>
                {sortedEvents.map((x) =>
                    isEventNow(x) ? (
                        <Box key={x.id}>
                            {makeEventEl(x, "Happening now")}
                            <Divider my={4} borderColor={borderColour} />
                        </Box>
                    ) : isEventSoon(x) ? (
                        <Box key={x.id}>
                            {makeEventEl(x, "Starting soon")}
                            <Divider my={4} borderColor={borderColour} />
                        </Box>
                    ) : x.id === selectedEventId ? (
                        <Box key={x.id}>
                            {makeEventEl(x, "Already joined")}
                            <Alert status="warning" mb={8}>
                                <AlertIcon />
                                This event has now finished. Once you close this room, you will not be able to rejoin
                                it.
                            </Alert>
                            <Divider my={4} borderColor={borderColour} />
                        </Box>
                    ) : (
                        <></>
                    )
                )}

                {sortedEvents.filter((x) => isEventNow(x) || isEventSoon(x) || selectedEventId === x.id).length ===
                0 ? (
                    <Text textAlign="center" my={8} fontSize="lg">
                        No current or upcoming events in this room
                    </Text>
                ) : undefined}
            </Box>
        ),
        [borderColour, isEventNow, isEventSoon, makeEventEl, selectedEventId, sortedEvents]
    );

    const { refetch } = useRoomBackstage_GetEventBreakoutRoomQuery({
        skip: true,
        fetchPolicy: "network-only",
    });

    const [existingCurrentRoomEventId, setExistingCurrentRoomEventId] = useState<string | null>(currentRoomEventId);
    const conference = useConference();
    const history = useHistory();
    const toast = useToast();

    useEffect(() => {
        async function fn() {
            try {
                if (
                    backstage &&
                    selectedEventId &&
                    selectedEventId === existingCurrentRoomEventId &&
                    existingCurrentRoomEventId !== currentRoomEventId
                ) {
                    try {
                        const breakoutRoom = await refetch({ originatingEventId: selectedEventId });

                        if (!breakoutRoom.data || !breakoutRoom.data.Room || breakoutRoom.data.Room.length < 1) {
                            throw new Error("No matching room found");
                        }

                        history.push(`/conference/${conference.slug}/room/${breakoutRoom.data.Room[0].id}`);
                    } catch (e) {
                        console.error("Error while moving to breakout room at end of event", selectedEventId, e);
                        toast({
                            status: "error",
                            title: "Could not find breakout room to move to at end of the event",
                        });
                        return;
                    }
                }
            } finally {
                setExistingCurrentRoomEventId(currentRoomEventId);
            }
        }
        fn();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRoomEventId]);

    const sharedRoomContext = useSharedRoomContext();

    return backstage ? (
        <Box display={backstage ? "block" : "none"} background={backgroundColour} p={5}>
            <Heading as="h3" size="lg">
                {roomName}: Live Q&amp;A
            </Heading>
            <Alert status="info" my={4}>
                <AlertIcon />
                <Box flex="1">
                    <AlertTitle>Welcome to the backstage area for {roomName}</AlertTitle>
                    <AlertDescription display="block">
                        <p>You can join a room here to ask and answer questions live on air.</p>
                        <p>
                            If you are a presenter, author or session chair, keep an eye on the chat to see any
                            questions that are asked!
                        </p>
                        <p>Event rooms become available to join ten minutes before the event itself starts.</p>
                    </AlertDescription>
                </Box>
            </Alert>
            {eventRooms}
            {!selectedEventId && sharedRoomContext ? (
                <Box display="none">
                    <portals.OutPortal
                        node={sharedRoomContext.portalNode}
                        vonageSessionId=""
                        getAccessToken={() => ""}
                        disable={true}
                    />
                </Box>
            ) : undefined}
        </Box>
    ) : (
        <></>
    );
}
