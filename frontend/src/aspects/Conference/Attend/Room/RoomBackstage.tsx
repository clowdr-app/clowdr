import {
    Alert,
    AlertDescription,
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    AlertIcon,
    AlertTitle,
    Box,
    Button,
    Heading,
    HStack,
    ListItem,
    Text,
    UnorderedList,
    useColorModeValue,
    useToken,
    VStack,
} from "@chakra-ui/react";
import { formatRelative } from "date-fns";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Twemoji } from "react-emoji-render";
import * as portals from "react-reverse-portal";
import { RoomMode_Enum, Room_EventSummaryFragment } from "../../../../generated/graphql";
import usePolling from "../../../Generic/usePolling";
import { useSharedRoomContext } from "../../../Room/useSharedRoomContext";
import { EventVonageRoom } from "./Event/EventVonageRoom";

export function RoomBackstage({
    showBackstage,
    roomName,
    roomEvents,
    currentRoomEventId,
    nextRoomEventId,
    setWatchStreamForEventId,
    onRoomJoined,
    onEventSelected,
}: {
    showBackstage: boolean;
    roomName: string;
    roomEvents: readonly Room_EventSummaryFragment[];
    currentRoomEventId: string | null;
    nextRoomEventId: string | null;
    setWatchStreamForEventId: (eventId: string | null) => void;
    onRoomJoined: (joined: boolean) => void;
    onEventSelected: (eventId: string | null) => void;
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
            return now >= startTime - 25 * 60 * 1000 && now <= startTime;
        },
        [now]
    );

    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    useEffect(() => {
        onEventSelected(selectedEventId);
    }, [onEventSelected, selectedEventId]);

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
                        maxW="100%"
                        w="100%"
                        justifyContent="space-between"
                        p={4}
                        alignItems="center"
                        borderRadius="md"
                    >
                        <Heading as="h3" size="md" width="min-content" textAlign="right" mr={8} whiteSpace="normal">
                            {category}
                        </Heading>
                        <VStack px={8} alignItems="left" flexGrow={1}>
                            <Heading as="h4" size="md" textAlign="left" mt={2} mb={1} whiteSpace="normal">
                                <Twemoji className="twemoji" text={title} />
                            </Heading>

                            <Text my={2} fontStyle="italic" whiteSpace="normal">
                                {formatRelative(Date.parse(event.startTime), now)}
                            </Text>
                        </VStack>
                        <Button
                            colorScheme={isSelected ? "red" : "green"}
                            onClick={() => (isSelected ? setSelectedEventId(null) : setSelectedEventId(event.id))}
                            height="min-content"
                            py={4}
                            whiteSpace="normal"
                        >
                            <Text fontSize="lg" whiteSpace="normal">
                                {isSelected ? "Close this area" : "Open this area"}
                            </Text>
                        </Button>
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
            <Box mt={4} w="100%">
                {sortedEvents.map((x) =>
                    isEventNow(x) ? (
                        <Box key={x.id} mt={2} w="100%">
                            {makeEventEl(x, "Happening now")}
                        </Box>
                    ) : isEventSoon(x) ? (
                        <Box key={x.id} mt={2} w="100%">
                            {makeEventEl(x, "Starting soon")}
                        </Box>
                    ) : x.id === selectedEventId ? (
                        <Box key={x.id} mt={2} w="100%">
                            {makeEventEl(x, "Ended")}
                            <Alert status="warning" mb={8}>
                                <AlertIcon />
                                This event has now finished. Once you close this room, you will not be able to rejoin
                                it.
                            </Alert>
                        </Box>
                    ) : undefined
                )}

                {sortedEvents.filter((x) => isEventNow(x) || isEventSoon(x) || selectedEventId === x.id).length ===
                0 ? (
                    <Text textAlign="center" my={8} fontSize="lg">
                        No current or upcoming events in the speakers&apos; area.
                    </Text>
                ) : undefined}
            </Box>
        ),
        [isEventNow, isEventSoon, makeEventEl, selectedEventId, sortedEvents]
    );

    const sharedRoomContext = useSharedRoomContext();

    const [isWatchStreamConfirmOpen, setIsWatchStreamConfirmOpen] = useState<boolean>(false);
    const cancelRef = useRef<HTMLButtonElement>(null);

    return showBackstage ? (
        <Box display={showBackstage ? "block" : "none"} background={backgroundColour} p={5}>
            <Heading as="h3" size="lg">
                {roomName}: Speakers&apos; Areas
            </Heading>
            <Alert status="info" my={4}>
                <AlertIcon />
                <Box flex="1">
                    <AlertTitle>Welcome to the speakers&apos; area for {roomName}</AlertTitle>
                    <AlertDescription display="block">
                        <UnorderedList>
                            <ListItem>Each event in this room has a speakers&apos; area.</ListItem>
                            <ListItem>
                                Each speakers&apos; area becomes available to join twenty minutes before the associated
                                event starts.
                            </ListItem>
                            <ListItem>Keep an eye on the chat for questions!</ListItem>
                        </UnorderedList>
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
                        isBackstageRoom={true}
                        onRoomJoined={onRoomJoined}
                    />
                </Box>
            ) : undefined}
            {!selectedEventId ? (
                currentRoomEventId || nextRoomEventId ? (
                    <>
                        <Button
                            variant="outline"
                            borderColor="red.600"
                            color="red.600"
                            onClick={() => setIsWatchStreamConfirmOpen(true)}
                            mt={4}
                        >
                            Watch stream
                        </Button>
                        <AlertDialog
                            isOpen={isWatchStreamConfirmOpen}
                            leastDestructiveRef={cancelRef}
                            onClose={() => setIsWatchStreamConfirmOpen(false)}
                        >
                            <AlertDialogOverlay>
                                <AlertDialogContent>
                                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                                        Watch stream
                                    </AlertDialogHeader>

                                    <AlertDialogBody>
                                        Watching the stream while speaking is strongly discouraged. The stream lag can
                                        cause a lot of confusion. Please stay in the speakers&apos; area. Please do not
                                        use a second device to watch the stream while you are active in the
                                        speakers&apos; area.
                                    </AlertDialogBody>

                                    <AlertDialogFooter>
                                        <Button ref={cancelRef} onClick={() => setIsWatchStreamConfirmOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button
                                            colorScheme="red"
                                            onClick={() =>
                                                currentRoomEventId
                                                    ? setWatchStreamForEventId(currentRoomEventId)
                                                    : setWatchStreamForEventId(nextRoomEventId)
                                            }
                                            ml={3}
                                        >
                                            Go to stream
                                        </Button>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialogOverlay>
                        </AlertDialog>
                    </>
                ) : (
                    <Button variant="outline" borderColor="red.600" color="red.600" isDisabled={true} mt={4}>
                        Live stream ended
                    </Button>
                )
            ) : undefined}
        </Box>
    ) : (
        <></>
    );
}
