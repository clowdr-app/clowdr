import { gql } from "@apollo/client";
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Heading,
    HStack,
    Spinner,
    Tag,
    Text,
    useColorModeValue,
    useToast,
    VStack,
} from "@chakra-ui/react";
import type { ContentItemDataBlob, ZoomBlob } from "@clowdr-app/shared-types/build/content";
import { notEmpty } from "@clowdr-app/shared-types/build/utils";
import { formatRelative } from "date-fns";
import type Hls from "hls.js";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { Redirect, useHistory } from "react-router-dom";
import {
    ContentGroupType_Enum,
    RoomMode_Enum,
    RoomPage_RoomDetailsFragment,
    RoomPrivacy_Enum,
    Room_CurrentEventSummaryFragment,
    Room_EventSummaryFragment,
    useRoom_GetCurrentEventsQuery,
    useRoom_GetEventBreakoutRoomQuery,
    useRoom_GetEventsQuery,
} from "../../../../generated/graphql";
import { ExternalLinkButton } from "../../../Chakra/LinkButton";
import usePolling from "../../../Generic/usePolling";
import { useRealTime } from "../../../Generic/useRealTime";
import { useConference } from "../../useConference";
import useCurrentAttendee from "../../useCurrentAttendee";
import { ContentGroupSummaryWrapper } from "../Content/ContentGroupSummary";
import { BreakoutVonageRoom } from "./BreakoutVonageRoom";
import { RoomBackstage } from "./RoomBackstage";
import { RoomControlBar } from "./RoomControlBar";
import { RoomTitle } from "./RoomTitle";
import { RoomSponsorContent } from "./Sponsor/RoomSponsorContent";
import { useCurrentRoomEvent } from "./useCurrentRoomEvent";

gql`
    query Room_GetCurrentEvents($currentEventIds: [uuid!]!) {
        Event(where: { id: { _in: $currentEventIds } }) {
            ...Room_CurrentEventSummary
        }
    }

    fragment Room_CurrentEventSummary on Event {
        id
        name
        startTime
        contentGroup {
            id
            title
            contentGroupTypeName
            contentItems(where: { contentTypeName: { _eq: ZOOM } }, limit: 1) {
                id
                data
            }
            chatId
        }
    }

    query Room_GetEvents($roomId: uuid!) {
        Event(where: { roomId: { _eq: $roomId } }) {
            ...Room_EventSummary
        }
    }

    fragment Room_EventSummary on Event {
        id
        conferenceId
        startTime
        name
        endTime
        intendedRoomModeName
        contentGroupId
        contentGroup {
            id
            title
        }
        eventPeople {
            id
            attendeeId
            roleName
        }
    }

    query Room_GetEventBreakoutRoom($originatingContentGroupId: uuid!) {
        Room(
            where: {
                originatingEventId: { _is_null: true }
                originatingContentGroupId: { _eq: $originatingContentGroupId }
            }
            order_by: { created_at: asc }
            limit: 1
        ) {
            id
        }
    }
`;

function hasShuffleRoomEnded({ startedAt, durationMinutes }: { startedAt: string; durationMinutes: number }): boolean {
    const startedAtMs = Date.parse(startedAt);
    const durationMs = durationMinutes * 60 * 1000;
    const now = Date.now();
    return startedAtMs + durationMs < now;
}

function isShuffleRoomEndingSoon(
    { startedAt, durationMinutes }: { startedAt: string; durationMinutes: number },
    now: number
): boolean {
    const startedAtMs = Date.parse(startedAt);
    const durationMs = durationMinutes * 60 * 1000;
    return startedAtMs + durationMs < now + 30000;
}

export function Room({ roomDetails }: { roomDetails: RoomPage_RoomDetailsFragment }): JSX.Element {
    const [roomEvents, setRoomEvents] = useState<readonly Room_EventSummaryFragment[]>([]);
    const { loading: loadingEvents, data, refetch } = useRoom_GetEventsQuery({
        variables: {
            roomId: roomDetails.id,
        },
    });

    useEffect(() => {
        if (data?.Event) {
            setRoomEvents(data.Event);
        }
    }, [data?.Event]);
    usePolling(refetch, 120000, true);

    const {
        currentRoomEvent,
        nextRoomEvent,
        withinThreeMinutesOfBroadcastEvent,
        secondsUntilBroadcastEvent,
        secondsUntilZoomEvent,
    } = useCurrentRoomEvent(roomEvents);

    const now = useRealTime(5000);

    const nextBgColour = useColorModeValue("green.300", "green.600");
    const bgColour = useColorModeValue("gray.200", "gray.700");

    const hlsUri = useMemo(() => {
        if (!roomDetails.mediaLiveChannel) {
            return null;
        }
        const finalUri = new URL(roomDetails.mediaLiveChannel.endpointUri);
        finalUri.hostname = roomDetails.mediaLiveChannel.cloudFrontDomain;
        return finalUri.toString();
    }, [roomDetails.mediaLiveChannel]);

    const [intendPlayStream, setIntendPlayStream] = useState<boolean>(true);

    const secondsUntilNonBreakoutEvent = Math.min(secondsUntilBroadcastEvent, secondsUntilZoomEvent);

    const [currentEventsData, setCurrentEventsData] = useState<readonly Room_CurrentEventSummaryFragment[]>([]);
    const { refetch: refetchCurrentEventsData } = useRoom_GetCurrentEventsQuery({
        skip: true,
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        async function fn() {
            const eventIds = [currentRoomEvent?.id, nextRoomEvent?.id].filter(notEmpty);
            try {
                const { data } = await refetchCurrentEventsData({
                    currentEventIds: eventIds,
                });

                if (data) {
                    setCurrentEventsData(data.Event ?? []);
                }
            } catch (e) {
                console.error("Could not fetch current events data");
            }
        }
        fn();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRoomEvent?.id, nextRoomEvent?.id]);

    const [zoomNow, setZoomNow] = useState<number>(Date.now());
    const computeZoomNow = useCallback(() => setZoomNow(Date.now()), [setZoomNow]);
    usePolling(computeZoomNow, 30000, true);
    const maybeZoomUrl = useMemo(() => {
        try {
            const currentEventData = currentRoomEvent
                ? currentEventsData.find((e) => e.id === currentRoomEvent?.id)
                : undefined;
            const nextEventData = nextRoomEvent ? currentEventsData.find((e) => e.id === nextRoomEvent?.id) : undefined;

            const currentZoomItems = currentEventData?.contentGroup?.contentItems;
            if (currentZoomItems && currentZoomItems.length > 0 && currentEventData) {
                const versions = currentZoomItems[0].data as ContentItemDataBlob;
                const latest = R.last(versions)?.data as ZoomBlob;
                return latest.url;
            }

            const nextZoomItems = nextEventData?.contentGroup?.contentItems;
            if (
                nextZoomItems &&
                nextZoomItems.length > 0 &&
                nextEventData &&
                zoomNow > Date.parse(nextEventData.startTime) - 20 * 60 * 1000
            ) {
                const versions = nextZoomItems[0].data as ContentItemDataBlob;
                const latest = R.last(versions)?.data as ZoomBlob;
                return latest.url;
            }

            return undefined;
        } catch (e) {
            console.error("Error finding current event Zoom details", e);
            return undefined;
        }
    }, [currentEventsData, currentRoomEvent, nextRoomEvent, zoomNow]);

    const currentAttendee = useCurrentAttendee();

    const presentingCurrentOrNextEvent = useMemo(() => {
        const isPresenterOfCurrentEvent =
            currentRoomEvent !== null &&
            currentRoomEvent.eventPeople.some((person) => person.attendeeId === currentAttendee.id);
        const isPresenterOfNextEvent =
            nextRoomEvent !== null &&
            nextRoomEvent.eventPeople.some((person) => person.attendeeId === currentAttendee.id);
        return isPresenterOfCurrentEvent || isPresenterOfNextEvent;
    }, [currentAttendee.id, currentRoomEvent, nextRoomEvent]);

    const [backStageRoomJoined, setBackStageRoomJoined] = useState<boolean>(false);

    const [watchStreamForEventId, setWatchStreamForEventId] = useState<string | null>(null);
    const showDefaultBreakoutRoom =
        roomEvents.length === 0 || currentRoomEvent?.intendedRoomModeName === RoomMode_Enum.Breakout;
    const hasBackstage = !!hlsUri;

    const alreadyBackstage = useRef<boolean>(false);

    const notExplictlyWatchingCurrentOrNextEvent =
        !watchStreamForEventId ||
        (!!currentRoomEvent && watchStreamForEventId !== currentRoomEvent.id) ||
        (!currentRoomEvent && !!nextRoomEvent && watchStreamForEventId !== nextRoomEvent.id);
    const showBackstage =
        hasBackstage &&
        notExplictlyWatchingCurrentOrNextEvent &&
        (backStageRoomJoined || presentingCurrentOrNextEvent || alreadyBackstage.current);
    alreadyBackstage.current = showBackstage;

    useEffect(() => {
        if (showBackstage) {
            toast({
                status: "info",
                position: "bottom-right",
                title: "You have been taken to the speakers' area",
                description: "You are a presenter of a current or upcoming event",
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showBackstage]);

    useEffect(() => {
        if (
            currentRoomEvent &&
            currentRoomEvent.eventPeople.some((person) => person.attendeeId === currentAttendee.id) &&
            watchStreamForEventId === currentRoomEvent.id &&
            !showBackstage
        ) {
            toast({
                status: "info",
                position: "bottom-right",
                title: "You are a presenter of an event starting now",
                description: (
                    <Button onClick={() => setWatchStreamForEventId(null)} colorScheme="green" mt={2}>
                        Go to the speakers&apos; area
                    </Button>
                ),
            });
        } else if (
            nextRoomEvent &&
            nextRoomEvent.eventPeople.some((person) => person.attendeeId === currentAttendee.id) &&
            !showBackstage
        ) {
            toast({
                status: "info",
                position: "bottom-right",
                title: "You are a presenter of the next event",
                description: (
                    <Button onClick={() => setWatchStreamForEventId(null)} colorScheme="green" mt={2}>
                        Go to the speakers&apos; area
                    </Button>
                ),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRoomEvent?.id]);

    const controlBarEl = useMemo(
        () =>
            !showBackstage && roomDetails.roomPrivacyName !== RoomPrivacy_Enum.Public ? (
                <RoomControlBar roomDetails={roomDetails} />
            ) : undefined,
        [roomDetails, showBackstage]
    );

    const roomEventsForCurrentAttendee = useMemo(
        () =>
            roomEvents.filter((event) => event.eventPeople.some((person) => person.attendeeId === currentAttendee.id)),
        [currentAttendee.id, roomEvents]
    );
    const [backstageSelectedEventId, setBackstageSelectedEventId] = useState<string | null>(null);
    const backStageEl = useMemo(
        () => (
            <RoomBackstage
                showBackstage={showBackstage}
                roomName={roomDetails.name}
                roomEvents={roomEventsForCurrentAttendee}
                currentRoomEventId={currentRoomEvent?.id}
                nextRoomEventId={nextRoomEvent?.id}
                setWatchStreamForEventId={setWatchStreamForEventId}
                onRoomJoined={setBackStageRoomJoined}
                onEventSelected={setBackstageSelectedEventId}
            />
        ),
        [currentRoomEvent?.id, nextRoomEvent, roomDetails.name, roomEventsForCurrentAttendee, showBackstage]
    );

    const muteStream = showBackstage;
    const playerRef = useRef<ReactPlayer | null>(null);
    const playerEl = useMemo(
        () =>
            hlsUri && withinThreeMinutesOfBroadcastEvent ? (
                <Box display={showBackstage ? "none" : "block"}>
                    <ReactPlayer
                        width="100%"
                        height="auto"
                        url={hlsUri}
                        config={{
                            file: {
                                hlsVersion: "1.0.0-beta.6",
                            },
                        }}
                        ref={playerRef}
                        onReady={() => {
                            const hlsPlayer = playerRef.current?.getInternalPlayer("hls") as Hls;

                            hlsPlayer.subtitleDisplay = false;
                        }}
                        playing={
                            (withinThreeMinutesOfBroadcastEvent || !!currentRoomEvent) &&
                            !showBackstage &&
                            intendPlayStream
                        }
                        muted={muteStream}
                        controls={true}
                        onPause={() => setIntendPlayStream(false)}
                        onPlay={() => setIntendPlayStream(true)}
                    />
                </Box>
            ) : (
                <></>
            ),
        [hlsUri, withinThreeMinutesOfBroadcastEvent, showBackstage, currentRoomEvent, intendPlayStream, muteStream]
    );

    const breakoutVonageRoomEl = useMemo(() => <BreakoutVonageRoom room={roomDetails} />, [roomDetails]);

    const currentEventRole = currentRoomEvent?.eventPeople.find(
        (p) => p.attendeeId && p.attendeeId === currentAttendee.id
    )?.roleName;
    const nextEventRole = nextRoomEvent?.eventPeople.find((p) => p.attendeeId && p.attendeeId === currentAttendee.id)
        ?.roleName;

    const contentEl = useMemo(
        () => (
            <Box flexGrow={1}>
                <RoomTitle roomDetails={roomDetails} />

                {currentRoomEvent ? (
                    <Box backgroundColor={bgColour} borderRadius={5} px={5} py={3} my={5}>
                        <HStack justifyContent="space-between">
                            <Text>Started {formatRelative(Date.parse(currentRoomEvent.startTime), now)}</Text>
                            {currentEventRole ? (
                                <Tag colorScheme="green" my={2}>
                                    {currentEventRole}
                                </Tag>
                            ) : undefined}
                        </HStack>
                        <Heading as="h3" textAlign="left" size="lg" mb={2}>
                            {currentRoomEvent.name}
                        </Heading>
                        {currentRoomEvent?.contentGroupId ? (
                            <ContentGroupSummaryWrapper
                                contentGroupId={currentRoomEvent.contentGroupId}
                                linkToItem={true}
                            />
                        ) : (
                            <></>
                        )}
                    </Box>
                ) : (
                    <></>
                )}
                {nextRoomEvent ? (
                    <Box backgroundColor={nextBgColour} borderRadius={5} px={5} py={3} my={5}>
                        <HStack justifyContent="space-between">
                            <Text>Starts {formatRelative(Date.parse(nextRoomEvent.startTime), now)}</Text>
                            {nextEventRole ? (
                                <Tag colorScheme="gray" my={2}>
                                    {nextEventRole}
                                </Tag>
                            ) : undefined}
                        </HStack>
                        <Heading as="h3" textAlign="left" size="lg" mb={2}>
                            {nextRoomEvent.name}
                        </Heading>
                        {nextRoomEvent?.contentGroupId ? (
                            <ContentGroupSummaryWrapper
                                contentGroupId={nextRoomEvent.contentGroupId}
                                linkToItem={true}
                            />
                        ) : (
                            <></>
                        )}
                    </Box>
                ) : (
                    <></>
                )}

                {!currentRoomEvent && !nextRoomEvent && roomEvents.length > 0 ? (
                    <Text p={5}>No current event in this room.</Text>
                ) : (
                    <></>
                )}

                {roomDetails.originatingContentGroup?.id &&
                roomDetails.originatingContentGroup.contentGroupTypeName !== ContentGroupType_Enum.Sponsor ? (
                    <Box backgroundColor={bgColour} borderRadius={5} px={5} py={3} my={5}>
                        <ContentGroupSummaryWrapper
                            contentGroupId={roomDetails.originatingContentGroup.id}
                            linkToItem={true}
                        />
                    </Box>
                ) : (
                    <></>
                )}

                {roomDetails.originatingContentGroup ? (
                    <RoomSponsorContent contentGroupId={roomDetails.originatingContentGroup.id} />
                ) : (
                    <></>
                )}
            </Box>
        ),
        [
            bgColour,
            currentEventRole,
            currentRoomEvent,
            nextBgColour,
            nextEventRole,
            nextRoomEvent,
            now,
            roomDetails,
            roomEvents.length,
        ]
    );

    const [sendShuffleRoomNotification, setSendShuffleRoomNotification] = useState<boolean>(false);
    useEffect(() => {
        if (roomDetails.shuffleRooms.length > 0 && isShuffleRoomEndingSoon(roomDetails.shuffleRooms[0], now)) {
            setSendShuffleRoomNotification(true);
        }
    }, [roomDetails.shuffleRooms, now]);

    const toast = useToast();
    useEffect(() => {
        if (sendShuffleRoomNotification) {
            toast({
                title: "30 seconds left...",
                description: "...then you'll be moved back to the shuffle home page",
                status: "warning",
                duration: 27000,
                isClosable: true,
                position: "top-right",
            });
        }
    }, [sendShuffleRoomNotification, toast]);

    // Q&A spinoff
    const [existingCurrentRoomEvent, setExistingCurrentRoomEvent] = useState<Room_EventSummaryFragment | null>(
        currentRoomEvent
    );
    const conference = useConference();
    const { refetch: refetchBreakout } = useRoom_GetEventBreakoutRoomQuery({
        skip: true,
        fetchPolicy: "network-only",
    });
    const history = useHistory();
    useEffect(() => {
        async function fn() {
            try {
                if (
                    existingCurrentRoomEvent?.contentGroupId &&
                    (existingCurrentRoomEvent.intendedRoomModeName === RoomMode_Enum.Presentation ||
                        existingCurrentRoomEvent.intendedRoomModeName === RoomMode_Enum.QAndA) &&
                    existingCurrentRoomEvent.id !== currentRoomEvent?.id
                ) {
                    try {
                        const breakoutRoom = await refetchBreakout({
                            originatingContentGroupId: existingCurrentRoomEvent.contentGroupId,
                        });

                        if (!breakoutRoom.data || !breakoutRoom.data.Room || breakoutRoom.data.Room.length < 1) {
                            throw new Error("No matching room found");
                        }

                        if (showBackstage && backstageSelectedEventId === existingCurrentRoomEvent.id) {
                            toast({
                                status: "info",
                                duration: 5000,
                                position: "bottom-right",
                                title: "Going to the discussion room",
                                description: (
                                    <VStack alignItems="flex-start">
                                        <Text>You will be redirected to the discussion room in a few seconds.</Text>
                                        <Button
                                            onClick={() =>
                                                history.push(
                                                    `/conference/${conference.slug}/room/${breakoutRoom.data.Room[0].id}`
                                                )
                                            }
                                            colorScheme="green"
                                        >
                                            Join the discusion room immediately
                                        </Button>
                                    </VStack>
                                ),
                            });
                            setTimeout(() => {
                                history.push(`/conference/${conference.slug}/room/${breakoutRoom.data.Room[0].id}`);
                            }, 5000);
                        } else {
                            toast({
                                status: "info",
                                duration: 15000,
                                isClosable: true,
                                position: "bottom-right",
                                title: "Discussion room available",
                                description: (
                                    <VStack alignItems="flex-start">
                                        <Text>
                                            You can continue the discussion asynchronously in a discussion room.
                                        </Text>
                                        <Button
                                            onClick={() =>
                                                history.push(
                                                    `/conference/${conference.slug}/room/${breakoutRoom.data.Room[0].id}`
                                                )
                                            }
                                            colorScheme="green"
                                        >
                                            Join the discusion room
                                        </Button>
                                    </VStack>
                                ),
                            });
                        }
                    } catch (e) {
                        console.error(
                            "Error while moving to breakout room at end of event",
                            existingCurrentRoomEvent.id,
                            e
                        );
                        return;
                    }
                }
            } finally {
                setExistingCurrentRoomEvent(currentRoomEvent);
            }
        }
        fn();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRoomEvent]);

    const eventStartingAlert = useMemo(
        () =>
            secondsUntilZoomEvent > 0 && secondsUntilZoomEvent < 180 && !currentRoomEvent ? (
                <Alert status="info">
                    <AlertIcon />
                    Event starting in {Math.round(secondsUntilZoomEvent)} seconds
                </Alert>
            ) : (
                <></>
            ),
        [secondsUntilZoomEvent, currentRoomEvent]
    );

    return roomDetails.shuffleRooms.length > 0 && hasShuffleRoomEnded(roomDetails.shuffleRooms[0]) ? (
        <Redirect
            to={`/conference/${conference.slug}/shuffle${
                !roomDetails.shuffleRooms[0].reshuffleUponEnd ? "/ended" : ""
            }`}
        />
    ) : loadingEvents && !data ? (
        <Spinner label="Loading events" />
    ) : (
        <HStack width="100%" flexWrap="wrap" alignItems="stretch">
            <VStack textAlign="left" flexGrow={2.5} alignItems="stretch" flexBasis={0} minW="100%" maxW="100%">
                {controlBarEl}

                {showDefaultBreakoutRoom &&
                secondsUntilNonBreakoutEvent >= 180 &&
                secondsUntilNonBreakoutEvent <= 300 ? (
                    <Alert status="warning">
                        <AlertIcon />
                        Event starting soon. Breakout room closes in {Math.round(
                            secondsUntilNonBreakoutEvent - 180
                        )}{" "}
                        seconds
                    </Alert>
                ) : (
                    <></>
                )}

                {!showBackstage && secondsUntilBroadcastEvent > 0 && secondsUntilBroadcastEvent < 180 ? (
                    <Alert status="info">
                        <AlertIcon />
                        Event starting in {Math.round(secondsUntilBroadcastEvent)} seconds
                    </Alert>
                ) : (
                    <></>
                )}

                {eventStartingAlert}

                {maybeZoomUrl ? (
                    <ExternalLinkButton
                        to={maybeZoomUrl}
                        isExternal={true}
                        colorScheme="green"
                        size="lg"
                        w="100%"
                        mt={4}
                    >
                        Go to Zoom
                    </ExternalLinkButton>
                ) : (
                    <></>
                )}

                {showBackstage ? backStageEl : playerEl}

                {showDefaultBreakoutRoom ? (
                    <Box display={showBackstage ? "none" : "block"} bgColor={bgColour}>
                        {breakoutVonageRoomEl}
                    </Box>
                ) : (
                    <></>
                )}

                {!showBackstage ? contentEl : <></>}
            </VStack>
        </HStack>
    );
}
