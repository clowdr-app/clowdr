import { gql } from "@apollo/client";
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Center,
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
import { formatRelative } from "date-fns";
import type Hls from "hls.js";
import type { HlsConfig } from "hls.js";
import * as R from "ramda";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { Redirect, useHistory } from "react-router-dom";
import {
    ContentGroupType_Enum,
    RoomMode_Enum,
    RoomPage_RoomDetailsFragment,
    RoomPrivacy_Enum,
    Room_EventSummaryFragment,
    useRoom_GetDefaultVideoRoomBackendQuery,
    useRoom_GetEventBreakoutRoomQuery,
    useRoom_GetEventsQuery,
} from "../../../../generated/graphql";
import { ExternalLinkButton } from "../../../Chakra/LinkButton";
import { useRealTime } from "../../../Generic/useRealTime";
import useTrackView from "../../../Realtime/Analytics/useTrackView";
import { useConference } from "../../useConference";
import useCurrentAttendee from "../../useCurrentAttendee";
import { ContentGroupSummaryWrapper } from "../Content/ContentGroupSummary";
import { BreakoutChimeRoom } from "./BreakoutChimeRoom";
import { BreakoutVonageRoom } from "./BreakoutVonageRoom";
import { RoomBackstage, UpcomingBackstageBanner } from "./RoomBackstage";
import { RoomControlBar } from "./RoomControlBar";
import { RoomTitle } from "./RoomTitle";
import { RoomSponsorContent } from "./Sponsor/RoomSponsorContent";
import { useCurrentRoomEvent } from "./useCurrentRoomEvent";

gql`
    query Room_GetEvents($roomId: uuid!, $now: timestamptz!, $cutoff: timestamptz!) {
        Event(where: { roomId: { _eq: $roomId }, endTime: { _gte: $now }, startTime: { _lte: $cutoff } }) {
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
            contentGroupTypeName
            zoomItems: contentItems(where: { contentTypeName: { _eq: ZOOM } }, limit: 1) {
                id
                data
            }
            chatId
        }
        eventPeople {
            id
            person {
                id
                name
                affiliation
                attendeeId
            }
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

    query Room_GetDefaultVideoRoomBackend {
        system_Configuration_by_pk(key: DEFAULT_VIDEO_ROOM_BACKEND) {
            value
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

export default function RoomOuter({ roomDetails }: { roomDetails: RoomPage_RoomDetailsFragment }): JSX.Element {
    const {
        data: defaultVideoRoomBackendData,
        refetch: refetchDefaultVideoRoomBackend,
        loading: defaultvideoRoomBackendLoading,
    } = useRoom_GetDefaultVideoRoomBackendQuery({
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        refetchDefaultVideoRoomBackend()?.catch((e) =>
            console.error("Could not refetch default video room backend", e)
        );
    }, [refetchDefaultVideoRoomBackend, roomDetails.id]);

    const defaultVideoBackend: "CHIME" | "VONAGE" | undefined = defaultvideoRoomBackendLoading
        ? undefined
        : defaultVideoRoomBackendData?.system_Configuration_by_pk?.value ?? "NO_DEFAULT";

    return <Room roomDetails={roomDetails} defaultVideoBackend={defaultVideoBackend} />;
}

function Room({
    roomDetails,
    defaultVideoBackend,
}: {
    roomDetails: RoomPage_RoomDetailsFragment;
    defaultVideoBackend: "CHIME" | "VONAGE" | "NO_DEFAULT" | undefined;
}): JSX.Element {
    const now2m = useRealTime(120000);
    const now2mStr = useMemo(() => new Date(now2m).toISOString(), [now2m]);
    const now2mCutoffStr = useMemo(() => new Date(now2m + 60 * 60 * 1000).toISOString(), [now2m]);

    const { loading: loadingEvents, data } = useRoom_GetEventsQuery({
        fetchPolicy: "cache-and-network",
        variables: {
            roomId: roomDetails.id,
            now: now2mStr,
            cutoff: now2mCutoffStr,
        },
    });

    const [cachedRoomEvents, setCachedRoomEvents] = useState<readonly Room_EventSummaryFragment[] | null>(null);
    useEffect(() => {
        if (data?.Event) {
            setCachedRoomEvents(data.Event);
        }
    }, [data?.Event]);

    const roomInner = useMemo(
        () =>
            cachedRoomEvents !== null ? (
                <RoomInner
                    roomDetails={roomDetails}
                    roomEvents={cachedRoomEvents}
                    defaultVideoBackend={defaultVideoBackend}
                />
            ) : undefined,
        [cachedRoomEvents, defaultVideoBackend, roomDetails]
    );

    return (
        <>
            {roomInner}
            {loadingEvents && cachedRoomEvents === null ? <Spinner label="Loading events" /> : undefined}
        </>
    );
}

function RoomInner({
    roomDetails,
    roomEvents,
    defaultVideoBackend,
}: {
    roomDetails: RoomPage_RoomDetailsFragment;
    roomEvents: readonly Room_EventSummaryFragment[];
    defaultVideoBackend: "CHIME" | "VONAGE" | "NO_DEFAULT" | undefined;
}): JSX.Element {
    const currentAttendee = useCurrentAttendee();

    const now5s = useRealTime(5000);
    const now30s = useRealTime(30000);

    const {
        currentRoomEvent,
        nextRoomEvent,
        nonCurrentLiveEvents,
        nonCurrentLiveEventsInNext20Mins,
        withinThreeMinutesOfBroadcastEvent,
        secondsUntilBroadcastEvent,
        secondsUntilZoomEvent,
    } = useCurrentRoomEvent(roomEvents);

    const hlsUri = useMemo(() => {
        if (!roomDetails.mediaLiveChannel) {
            return null;
        }
        const finalUri = new URL(roomDetails.mediaLiveChannel.endpointUri);
        finalUri.hostname = roomDetails.mediaLiveChannel.cloudFrontDomain;
        return finalUri.toString();
    }, [roomDetails.mediaLiveChannel]);

    const isPresenterOfUpcomingEvent = useMemo(
        () =>
            nonCurrentLiveEvents?.find((event) =>
                event?.eventPeople.some((person) => person.person.attendeeId === currentAttendee.id)
            ) ?? false,
        [currentAttendee.id, nonCurrentLiveEvents]
    );

    const presentingCurrentOrUpcomingSoonEvent = useMemo(() => {
        const isPresenterOfCurrentEvent =
            currentRoomEvent !== null &&
            (currentRoomEvent.intendedRoomModeName === RoomMode_Enum.Presentation ||
                currentRoomEvent.intendedRoomModeName === RoomMode_Enum.QAndA) &&
            currentRoomEvent.eventPeople.some((person) => person.person.attendeeId === currentAttendee.id);

        const isPresenterOfUpcomingSoonEvent = !!nonCurrentLiveEventsInNext20Mins?.some((event) =>
            event?.eventPeople.some((person) => person.person.attendeeId === currentAttendee.id)
        );

        return isPresenterOfCurrentEvent || !!isPresenterOfUpcomingSoonEvent;
    }, [currentAttendee.id, currentRoomEvent, nonCurrentLiveEventsInNext20Mins]);

    const [watchStreamForEventId, setWatchStreamForEventId] = useState<string | null>(null);
    const [backStageRoomJoined, setBackStageRoomJoined] = useState<boolean>(false);
    const alreadyBackstage = useRef<boolean>(false);

    const hasBackstage = !!roomEvents.some((event) =>
        [RoomMode_Enum.Presentation, RoomMode_Enum.QAndA].includes(event.intendedRoomModeName)
    );

    const notExplictlyWatchingCurrentOrNextEvent =
        !watchStreamForEventId ||
        (!!currentRoomEvent && watchStreamForEventId !== currentRoomEvent.id) ||
        (!currentRoomEvent && !!nextRoomEvent && watchStreamForEventId !== nextRoomEvent.id);
    const showBackstage =
        hasBackstage &&
        notExplictlyWatchingCurrentOrNextEvent &&
        (backStageRoomJoined || presentingCurrentOrUpcomingSoonEvent || alreadyBackstage.current);

    alreadyBackstage.current = showBackstage;

    const showDefaultBreakoutRoom =
        !roomDetails.isProgramRoom || currentRoomEvent?.intendedRoomModeName === RoomMode_Enum.Breakout;

    const maybeZoomUrl = useMemo(() => {
        try {
            if (currentRoomEvent) {
                const currentZoomItems = currentRoomEvent.contentGroup?.zoomItems;
                if (currentZoomItems?.length) {
                    const versions = currentZoomItems[0].data as ContentItemDataBlob;
                    const latest = R.last(versions)?.data as ZoomBlob;
                    return latest.url;
                }
            }

            if (nextRoomEvent) {
                const nextZoomItems = nextRoomEvent.contentGroup?.zoomItems;
                if (nextZoomItems?.length && now30s > Date.parse(nextRoomEvent.startTime) - 20 * 60 * 1000) {
                    const versions = nextZoomItems[0].data as ContentItemDataBlob;
                    const latest = R.last(versions)?.data as ZoomBlob;
                    return latest.url;
                }
            }

            return undefined;
        } catch (e) {
            console.error("Error finding current event Zoom details", e);
            return undefined;
        }
    }, [currentRoomEvent, nextRoomEvent, now30s]);

    useEffect(() => {
        if (
            currentRoomEvent &&
            (currentRoomEvent.intendedRoomModeName === RoomMode_Enum.Presentation ||
                currentRoomEvent.intendedRoomModeName === RoomMode_Enum.QAndA) &&
            currentRoomEvent.eventPeople.some((person) => person.person.attendeeId === currentAttendee.id) &&
            watchStreamForEventId === currentRoomEvent.id &&
            !showBackstage
        ) {
            toast({
                status: "warning",
                position: "top",
                duration: 15000,
                isClosable: true,
                title: "You are a presenter of an event starting now",
                description: (
                    <Button onClick={() => setWatchStreamForEventId(null)} colorScheme="green" mt={2}>
                        Go to the speakers&apos; area
                    </Button>
                ),
            });
        } else if (
            nextRoomEvent &&
            (nextRoomEvent.intendedRoomModeName === RoomMode_Enum.Presentation ||
                nextRoomEvent.intendedRoomModeName === RoomMode_Enum.QAndA) &&
            nextRoomEvent.eventPeople.some((person) => person.person.attendeeId === currentAttendee.id) &&
            Date.parse(nextRoomEvent.startTime) - Date.now() < 20 * 60 * 1000 &&
            !showBackstage
        ) {
            toast({
                status: "warning",
                position: "top",
                isClosable: true,
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
            roomDetails.roomPrivacyName !== RoomPrivacy_Enum.Public ? (
                <RoomControlBar roomDetails={roomDetails} />
            ) : undefined,
        [roomDetails]
    );

    const roomEventsForCurrentAttendee = useMemo(
        () =>
            roomEvents.filter((event) =>
                event.eventPeople.some((person) => person.person.attendeeId === currentAttendee.id)
            ),
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

    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    useTrackView(isPlaying, roomDetails.id, "Room.HLSStream");

    const muteStream = showBackstage;
    const playerRef = useRef<ReactPlayer | null>(null);
    const [intendPlayStream, setIntendPlayStream] = useState<boolean>(true);
    const playerEl = useMemo(() => {
        const hlsOptions: Partial<HlsConfig> = {
            liveSyncDurationCount: 5,
            enableCEA708Captions: false,
            enableWebVTT: true,
        };
        return hlsUri && withinThreeMinutesOfBroadcastEvent ? (
            <Box display={showBackstage ? "none" : "block"}>
                <ReactPlayer
                    width="100%"
                    height="auto"
                    url={hlsUri}
                    config={{
                        file: {
                            hlsVersion: "1.0.1",
                            hlsOptions,
                        },
                    }}
                    ref={playerRef}
                    playing={
                        (withinThreeMinutesOfBroadcastEvent || !!currentRoomEvent) && !showBackstage && intendPlayStream
                    }
                    muted={muteStream}
                    controls={true}
                    onEnded={() => {
                        setIsPlaying(false);
                    }}
                    onError={() => {
                        setIsPlaying(false);
                    }}
                    onPause={() => {
                        setIsPlaying(false);
                        setIntendPlayStream(false);
                    }}
                    onPlay={() => {
                        setIsPlaying(true);
                        setIntendPlayStream(true);
                    }}
                />
            </Box>
        ) : (
            <></>
        );
    }, [hlsUri, withinThreeMinutesOfBroadcastEvent, showBackstage, currentRoomEvent, intendPlayStream, muteStream]);

    useEffect(() => {
        if (playerRef.current) {
            const hls: Hls = playerRef.current.getInternalPlayer("hls") as Hls;
            hls.subtitleDisplay = false;
        }
    }, []);

    const breakoutRoomEl = useMemo(() => {
        // console.log("default video backend", defaultVideoBackend, roomDetails.videoRoomBackendName);

        switch (roomDetails.videoRoomBackendName) {
            case "CHIME":
                return <BreakoutChimeRoom room={roomDetails} />;
            case "VONAGE":
                return <BreakoutVonageRoom room={roomDetails} />;
        }

        switch (defaultVideoBackend) {
            case "CHIME":
                return <BreakoutChimeRoom room={roomDetails} />;
            case "VONAGE":
            case "NO_DEFAULT":
                return <BreakoutVonageRoom room={roomDetails} />;
        }

        return (
            <Center>
                <Spinner mt={2} mx="auto" />
            </Center>
        );
    }, [defaultVideoBackend, roomDetails]);

    const contentEl = useMemo(
        () => (
            <RoomContent currentRoomEvent={currentRoomEvent} nextRoomEvent={nextRoomEvent} roomDetails={roomDetails} />
        ),
        [currentRoomEvent, nextRoomEvent, roomDetails]
    );

    const [sendShuffleRoomNotification, setSendShuffleRoomNotification] = useState<boolean>(false);
    useEffect(() => {
        if (roomDetails.shuffleRooms.length > 0 && isShuffleRoomEndingSoon(roomDetails.shuffleRooms[0], now5s)) {
            setSendShuffleRoomNotification(true);
        }
    }, [roomDetails.shuffleRooms, now5s]);

    const toast = useToast();
    useEffect(() => {
        if (sendShuffleRoomNotification) {
            toast({
                title: "30 seconds left...",
                description: "...then you'll be moved back to the shuffle home page",
                status: "warning",
                duration: 29000,
                isClosable: true,
                position: "top",
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
                                isClosable: true,
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
                                            Join the discussion room immediately
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
                                duration: 30000,
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
                                            Join the discussion room
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

    const bgColour = useColorModeValue("gray.200", "gray.700");

    const secondsUntilNonBreakoutEvent = Math.min(secondsUntilBroadcastEvent, secondsUntilZoomEvent);

    return roomDetails.shuffleRooms.length > 0 && hasShuffleRoomEnded(roomDetails.shuffleRooms[0]) ? (
        <Redirect
            to={`/conference/${conference.slug}/shuffle${
                !roomDetails.shuffleRooms[0].reshuffleUponEnd ? "/ended" : ""
            }`}
        />
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

                {secondsUntilZoomEvent > 0 && secondsUntilZoomEvent < 180 && !currentRoomEvent ? (
                    <Alert status="info">
                        <AlertIcon />
                        Event starting in {Math.round(secondsUntilZoomEvent)} seconds
                    </Alert>
                ) : (
                    <></>
                )}

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

                {isPresenterOfUpcomingEvent && !showBackstage ? (
                    <UpcomingBackstageBanner event={isPresenterOfUpcomingEvent} />
                ) : undefined}
                {showBackstage ? backStageEl : playerEl}

                {showDefaultBreakoutRoom ? (
                    <Box display={showBackstage ? "none" : "block"} bgColor={bgColour} m={-2}>
                        {breakoutRoomEl}
                    </Box>
                ) : (
                    <></>
                )}

                {!showBackstage ? contentEl : <></>}
            </VStack>
        </HStack>
    );
}

function RoomContent({
    currentRoomEvent,
    nextRoomEvent,
    roomDetails,
}: {
    currentRoomEvent: Room_EventSummaryFragment | null;
    nextRoomEvent: Room_EventSummaryFragment | null;
    roomDetails: RoomPage_RoomDetailsFragment;
}): JSX.Element {
    const nextBgColour = useColorModeValue("green.300", "green.600");
    const bgColour = useColorModeValue("gray.200", "gray.700");

    const currentAttendee = useCurrentAttendee();

    const currentEventRole = useMemo(
        () =>
            currentRoomEvent?.eventPeople.find((p) => p.person.attendeeId && p.person.attendeeId === currentAttendee.id)
                ?.roleName,
        [currentAttendee, currentRoomEvent?.eventPeople]
    );
    const nextEventRole = useMemo(
        () =>
            nextRoomEvent?.eventPeople.find((p) => p.person.attendeeId && p.person.attendeeId === currentAttendee.id)
                ?.roleName,
        [currentAttendee, nextRoomEvent?.eventPeople]
    );

    const now5s = useRealTime(5000);

    return (
        <Box flexGrow={1}>
            <RoomTitle roomDetails={roomDetails} />

            {currentRoomEvent ? (
                <Box backgroundColor={bgColour} borderRadius={5} px={5} py={3} my={5}>
                    <HStack justifyContent="space-between">
                        <Text>Started {formatRelative(Date.parse(currentRoomEvent.startTime), now5s)}</Text>
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
                    <Heading as="h3" textAlign="left" size="lg" mb={1}>
                        {nextRoomEvent.name}
                    </Heading>
                    <HStack justifyContent="space-between" mb={2}>
                        <Text>Starts {formatRelative(Date.parse(nextRoomEvent.startTime), now5s)}</Text>
                        {nextEventRole ? (
                            <Tag colorScheme="gray" my={2} textTransform="none">
                                You are {nextEventRole}
                            </Tag>
                        ) : undefined}
                    </HStack>
                    {nextRoomEvent?.contentGroupId ? (
                        <ContentGroupSummaryWrapper contentGroupId={nextRoomEvent.contentGroupId} linkToItem={true} />
                    ) : (
                        <></>
                    )}
                </Box>
            ) : (
                <></>
            )}

            {!currentRoomEvent && !nextRoomEvent && roomDetails.isProgramRoom ? (
                <Text p={5}>No events in this room in the near future.</Text>
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
    );
}
