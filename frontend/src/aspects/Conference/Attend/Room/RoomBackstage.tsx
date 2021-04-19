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
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Twemoji } from "react-emoji-render";
import * as portals from "react-reverse-portal";
import { RoomMode_Enum, Room_EventSummaryFragment } from "../../../../generated/graphql";
import { useRealTime } from "../../../Generic/useRealTime";
import { useSharedRoomContext } from "../../../Room/useSharedRoomContext";
import { EventVonageRoom } from "./Event/EventVonageRoom";

function isEventNow(now: number, event: Room_EventSummaryFragment): boolean {
    const startTime = Date.parse(event.startTime);
    const endTime = Date.parse(event.endTime);
    return now >= startTime && now <= endTime;
}

function isEventSoon(now: number, event: Room_EventSummaryFragment): boolean {
    const startTime = Date.parse(event.startTime);
    return now >= startTime - 25 * 60 * 1000 && now <= startTime;
}

function EventBackstage({
    event,
    selectedEventId,
    setSelectedEventId,
}: {
    event: Room_EventSummaryFragment;
    selectedEventId: string | null;
    setSelectedEventId: (value: string | null) => void;
}): JSX.Element {
    const [gray100, gray900] = useToken("colors", ["gray.100", "gray.900"]);
    const borderColour = useColorModeValue(gray900, gray100);

    const now = useRealTime(5000);
    const isNow = isEventNow(now, event);
    const isSoon = isEventSoon(now, event);
    const isActive = isNow || isSoon;
    const category = isNow ? "Happening now" : isSoon ? "Starting soon" : "Ended";
    const title = event?.contentGroup ? `${event.contentGroup.title} (${event.name})` : event.name;
    const isSelected = event.id === selectedEventId;
    const summaryInfo = useMemo(
        () => (
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
                        {formatRelative(Date.parse(event.startTime), Date.now())}
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
        ),
        [borderColour, category, event.id, event.startTime, isSelected, setSelectedEventId, title]
    );

    const vonageRoom = useMemo(() => <EventVonageRoom eventId={event.id} />, [event.id]);
    const area = useMemo(
        () =>
            selectedEventId === event.id ? (
                <Box mt={2}>
                    {vonageRoom}
                    <Alert status="info" mb={8}>
                        <AlertIcon />
                        Once this event ends, you will be automatically taken to a breakout room to continue the
                        conversation.
                    </Alert>
                </Box>
            ) : !isActive ? (
                <Alert status="warning" mb={8}>
                    <AlertIcon />
                    This event has now finished. Once you close this room, you will not be able to rejoin it.
                </Alert>
            ) : undefined,
        [event.id, isActive, selectedEventId, vonageRoom]
    );

    return (
        <>
            {summaryInfo}
            {area}
        </>
    );
}

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

    const now = useRealTime(5000);

    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    useEffect(() => {
        onEventSelected(selectedEventId);
    }, [onEventSelected, selectedEventId]);

    const [activeEvents, setActiveEvents] = useState<Room_EventSummaryFragment[] | null>(null);
    useEffect(() => {
        const newActiveEvents = sortedEvents.filter(
            (x) => isEventNow(now, x) || isEventSoon(now, x) || selectedEventId === x.id
        );
        setActiveEvents((oldActiveEvents) =>
            !oldActiveEvents ||
            newActiveEvents.some((x, idx) => idx >= oldActiveEvents.length || oldActiveEvents[idx].id !== x.id)
                ? newActiveEvents
                : oldActiveEvents
        );
    }, [now, selectedEventId, sortedEvents]);

    const eventRooms = useMemo(() => {
        return (
            <Box mt={4} w="100%">
                {activeEvents?.map((x) => (
                    <Box key={x.id} mt={2} w="100%">
                        <EventBackstage
                            event={x}
                            selectedEventId={selectedEventId}
                            setSelectedEventId={setSelectedEventId}
                        />
                    </Box>
                ))}

                {activeEvents?.length === 0 ? (
                    <Text textAlign="center" my={8} fontSize="lg">
                        No current or upcoming events in the speakers&apos; area.
                    </Text>
                ) : undefined}
            </Box>
        );
    }, [activeEvents, selectedEventId]);

    const sharedRoomContext = useSharedRoomContext();

    const [isWatchStreamConfirmOpen, setIsWatchStreamConfirmOpen] = useState<boolean>(false);
    const cancelRef = useRef<HTMLButtonElement>(null);

    const heading = useMemo(
        () => (
            <Heading as="h3" size="lg">
                {roomName}: Speakers&apos; Areas
            </Heading>
        ),
        [roomName]
    );

    const welcomeAlert = useMemo(
        () => (
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
        ),
        [roomName]
    );

    const blankRoom = useMemo(
        () =>
            !selectedEventId && sharedRoomContext ? (
                <Box display="none">
                    <portals.OutPortal
                        node={sharedRoomContext.vonagePortalNode}
                        vonageSessionId=""
                        getAccessToken={() => ""}
                        disable={true}
                        isBackstageRoom={true}
                        onRoomJoined={onRoomJoined}
                    />
                </Box>
            ) : undefined,
        [onRoomJoined, selectedEventId, sharedRoomContext]
    );

    const streamAccess = useMemo(
        () =>
            !selectedEventId ? (
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
            ) : undefined,
        [currentRoomEventId, isWatchStreamConfirmOpen, nextRoomEventId, selectedEventId, setWatchStreamForEventId]
    );

    return useMemo(
        () =>
            showBackstage ? (
                <Box display={showBackstage ? "block" : "none"} background={backgroundColour} p={5}>
                    {heading}
                    {welcomeAlert}
                    {eventRooms}
                    {blankRoom}
                    {streamAccess}
                </Box>
            ) : (
                <></>
            ),
        [backgroundColour, blankRoom, eventRooms, heading, showBackstage, streamAccess, welcomeAlert]
    );
}
