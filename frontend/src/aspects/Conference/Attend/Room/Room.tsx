import { gql } from "@apollo/client";
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    HStack,
    Spinner,
    Text,
    useColorModeValue,
    useToast,
    VStack,
} from "@chakra-ui/react";
import type { ElementDataBlob, VideoElementBlob, ZoomBlob } from "@clowdr-app/shared-types/build/content";
import * as R from "ramda";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Redirect, useHistory } from "react-router-dom";
import {
    Content_ItemType_Enum,
    RoomPage_RoomDetailsFragment,
    Room_EventSummaryFragment,
    Room_ManagementMode_Enum,
    Room_Mode_Enum,
    useRoom_GetDefaultVideoRoomBackendQuery,
    useRoom_GetEventBreakoutRoomQuery,
    useRoom_GetEventsQuery,
} from "../../../../generated/graphql";
import { ExternalLinkButton } from "../../../Chakra/LinkButton";
import EmojiFloatContainer from "../../../Emoji/EmojiFloatContainer";
import { useRealTime } from "../../../Generic/useRealTime";
import { useConference } from "../../useConference";
import useCurrentRegistrant from "../../useCurrentRegistrant";
import { VideoElement } from "../Content/Element/VideoElement";
import { BreakoutRoom } from "./Breakout/BreakoutRoom";
import { RoomBackstage, UpcomingBackstageBanner } from "./RoomBackstage";
import { RoomContent } from "./RoomContent";
import { RoomControlBar } from "./RoomControlBar";
import { useCurrentRoomEvent } from "./useCurrentRoomEvent";
import { HlsPlayer } from "./Video/HlsPlayer";

gql`
    query Room_GetEvents($roomId: uuid!, $now: timestamptz!, $cutoff: timestamptz!) {
        schedule_Event(where: { roomId: { _eq: $roomId }, endTime: { _gte: $now }, startTime: { _lte: $cutoff } }) {
            ...Room_EventSummary
        }
    }

    fragment Room_EventSummary on schedule_Event {
        id
        conferenceId
        startTime
        name
        endTime
        intendedRoomModeName
        itemId
        exhibitionId
        item {
            id
            title
            typeName
            zoomItems: elements(where: { typeName: { _eq: ZOOM } }, limit: 1) {
                id
                data
                name
            }
            videoItems: elements(
                where: { typeName: { _in: [VIDEO_BROADCAST, VIDEO_FILE] }, isHidden: { _eq: false } }
                limit: 1
                order_by: { createdAt: desc_nulls_last }
            ) {
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
                registrantId
            }
            roleName
        }
    }

    query Room_GetEventBreakoutRoom($originatingItemId: uuid!) {
        room_Room(
            where: { originatingEventId: { _is_null: true }, originatingItemId: { _eq: $originatingItemId } }
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
        if (data?.schedule_Event) {
            setCachedRoomEvents(data.schedule_Event);
        }
    }, [data?.schedule_Event]);

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
    const currentRegistrant = useCurrentRegistrant();

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
                event?.eventPeople.some((person) => person.person.registrantId === currentRegistrant.id)
            ) ?? false,
        [currentRegistrant.id, nonCurrentLiveEvents]
    );

    const presentingCurrentOrUpcomingSoonEvent = useMemo(() => {
        const isPresenterOfCurrentEvent =
            currentRoomEvent !== null &&
            (currentRoomEvent.intendedRoomModeName === Room_Mode_Enum.Presentation ||
                currentRoomEvent.intendedRoomModeName === Room_Mode_Enum.QAndA) &&
            currentRoomEvent.eventPeople.some((person) => person.person.registrantId === currentRegistrant.id);

        const isPresenterOfUpcomingSoonEvent = !!nonCurrentLiveEventsInNext20Mins?.some((event) =>
            event?.eventPeople.some((person) => person.person.registrantId === currentRegistrant.id)
        );

        return isPresenterOfCurrentEvent || !!isPresenterOfUpcomingSoonEvent;
    }, [currentRegistrant.id, currentRoomEvent, nonCurrentLiveEventsInNext20Mins]);

    const [watchStreamForEventId, setWatchStreamForEventId] = useState<string | null>(null);
    const [backStageRoomJoined, setBackStageRoomJoined] = useState<boolean>(false);
    const alreadyBackstage = useRef<boolean>(false);

    const hasBackstage = !!roomEvents.some((event) =>
        [Room_Mode_Enum.Presentation, Room_Mode_Enum.QAndA].includes(event.intendedRoomModeName)
    );

    const notExplicitlyWatchingCurrentOrNextEvent =
        !watchStreamForEventId ||
        (!!currentRoomEvent && watchStreamForEventId !== currentRoomEvent.id) ||
        (!currentRoomEvent && !!nextRoomEvent && watchStreamForEventId !== nextRoomEvent.id);
    const showBackstage =
        hasBackstage &&
        notExplicitlyWatchingCurrentOrNextEvent &&
        (backStageRoomJoined || presentingCurrentOrUpcomingSoonEvent || alreadyBackstage.current);

    alreadyBackstage.current = showBackstage;

    const currentEventModeIsNone = currentRoomEvent?.intendedRoomModeName === Room_Mode_Enum.None;
    const showDefaultBreakoutRoom =
        !roomDetails.isProgramRoom ||
        currentRoomEvent?.intendedRoomModeName === Room_Mode_Enum.Breakout ||
        (!currentRoomEvent && roomDetails.originatingItem?.typeName === Content_ItemType_Enum.Sponsor);

    const maybeZoomUrl = useMemo(() => {
        try {
            if (currentRoomEvent) {
                const currentZoomItems = currentRoomEvent.item?.zoomItems;
                if (currentZoomItems?.length) {
                    const versions = currentZoomItems[0].data as ElementDataBlob;
                    const latest = R.last(versions)?.data as ZoomBlob;
                    return { url: latest.url, name: currentZoomItems[0].name };
                }
            }

            if (nextRoomEvent) {
                const nextZoomItems = nextRoomEvent.item?.zoomItems;
                if (nextZoomItems?.length && now30s > Date.parse(nextRoomEvent.startTime) - 20 * 60 * 1000) {
                    const versions = nextZoomItems[0].data as ElementDataBlob;
                    const latest = R.last(versions)?.data as ZoomBlob;
                    return { url: latest.url, name: nextZoomItems[0].name };
                }
            }

            return undefined;
        } catch (e) {
            console.error("Error finding current event Zoom details", e);
            return undefined;
        }
    }, [currentRoomEvent, nextRoomEvent, now30s]);

    const maybeVideoDetails = useMemo(() => {
        try {
            if (currentRoomEvent) {
                const currentVideoItems = currentRoomEvent.item?.videoItems;
                if (currentVideoItems?.length) {
                    const versions = currentVideoItems[0].data as ElementDataBlob;
                    const latest = R.last(versions)?.data as VideoElementBlob;
                    return { data: latest, elementId: currentVideoItems[0].id };
                }
            }

            return undefined;
        } catch (e) {
            console.error("Error finding current event video details", e);
            return undefined;
        }
    }, [currentRoomEvent]);

    useEffect(() => {
        if (
            currentRoomEvent &&
            (currentRoomEvent.intendedRoomModeName === Room_Mode_Enum.Presentation ||
                currentRoomEvent.intendedRoomModeName === Room_Mode_Enum.QAndA) &&
            currentRoomEvent.eventPeople.some((person) => person.person.registrantId === currentRegistrant.id) &&
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
                        Go to the backstage
                    </Button>
                ),
            });
        } else if (
            nextRoomEvent &&
            (nextRoomEvent.intendedRoomModeName === Room_Mode_Enum.Presentation ||
                nextRoomEvent.intendedRoomModeName === Room_Mode_Enum.QAndA) &&
            nextRoomEvent.eventPeople.some((person) => person.person.registrantId === currentRegistrant.id) &&
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
                        Go to the backstage
                    </Button>
                ),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRoomEvent?.id]);

    const controlBarEl = useMemo(
        () =>
            roomDetails.managementModeName !== Room_ManagementMode_Enum.Public ? (
                <RoomControlBar roomDetails={roomDetails} />
            ) : undefined,
        [roomDetails]
    );

    const roomEventsForCurrentRegistrant = useMemo(
        () =>
            roomEvents.filter((event) =>
                event.eventPeople.some((person) => person.person.registrantId === currentRegistrant.id)
            ),
        [currentRegistrant.id, roomEvents]
    );
    const [backstageSelectedEventId, setBackstageSelectedEventId] = useState<string | null>(null);
    const backStageEl = useMemo(
        () => (
            <RoomBackstage
                showBackstage={showBackstage}
                roomName={roomDetails.name}
                roomEvents={roomEventsForCurrentRegistrant}
                currentRoomEventId={currentRoomEvent?.id}
                nextRoomEventId={nextRoomEvent?.id}
                setWatchStreamForEventId={setWatchStreamForEventId}
                onRoomJoined={setBackStageRoomJoined}
                onEventSelected={setBackstageSelectedEventId}
            />
        ),
        [currentRoomEvent?.id, nextRoomEvent, roomDetails.name, roomEventsForCurrentRegistrant, showBackstage]
    );

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
                    existingCurrentRoomEvent?.itemId &&
                    (existingCurrentRoomEvent.intendedRoomModeName === Room_Mode_Enum.Presentation ||
                        existingCurrentRoomEvent.intendedRoomModeName === Room_Mode_Enum.QAndA) &&
                    existingCurrentRoomEvent.id !== currentRoomEvent?.id
                ) {
                    try {
                        const breakoutRoom = await refetchBreakout({
                            originatingItemId: existingCurrentRoomEvent.itemId,
                        });

                        if (
                            !breakoutRoom.data ||
                            !breakoutRoom.data.room_Room ||
                            breakoutRoom.data.room_Room.length < 1
                        ) {
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
                                                    `/conference/${conference.slug}/room/${breakoutRoom.data.room_Room[0].id}`
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
                                history.push(
                                    `/conference/${conference.slug}/room/${breakoutRoom.data.room_Room[0].id}`
                                );
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
                                                    `/conference/${conference.slug}/room/${breakoutRoom.data.room_Room[0].id}`
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

    const startsSoonEl = useMemo(
        () => (
            <>
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
                ) : undefined}
                {secondsUntilZoomEvent > 0 && secondsUntilZoomEvent < 180 && !currentRoomEvent ? (
                    <Alert status="info">
                        <AlertIcon />
                        Event starting in {Math.round(secondsUntilZoomEvent)} seconds
                    </Alert>
                ) : undefined}
                {secondsUntilBroadcastEvent > 0 && secondsUntilBroadcastEvent < 180 ? (
                    <Alert status="info">
                        <AlertIcon />
                        Event starting in {Math.round(secondsUntilBroadcastEvent)} seconds
                    </Alert>
                ) : undefined}
            </>
        ),
        [
            currentRoomEvent,
            secondsUntilBroadcastEvent,
            secondsUntilNonBreakoutEvent,
            secondsUntilZoomEvent,
            showDefaultBreakoutRoom,
        ]
    );

    const playerEl = useMemo(() => {
        const currentEventIsVideoPlayer = currentRoomEvent?.intendedRoomModeName === Room_Mode_Enum.VideoPlayer;
        const shouldShowLivePlayer =
            !currentEventModeIsNone && !showDefaultBreakoutRoom && withinThreeMinutesOfBroadcastEvent;

        return !showBackstage ? (
            currentEventIsVideoPlayer ? (
                maybeVideoDetails ? (
                    <Box pos="relative">
                        <VideoElement
                            elementId={maybeVideoDetails.elementId}
                            videoElementData={maybeVideoDetails.data}
                        />
                        <EmojiFloatContainer />
                    </Box>
                ) : (
                    <>Could not find video.</>
                )
            ) : shouldShowLivePlayer && hlsUri ? (
                <Box pos="relative">
                    <HlsPlayer
                        roomId={roomDetails.id}
                        canPlay={withinThreeMinutesOfBroadcastEvent || !!currentRoomEvent}
                        hlsUri={hlsUri}
                    />
                    <EmojiFloatContainer />
                </Box>
            ) : undefined
        ) : undefined;
    }, [
        currentEventModeIsNone,
        currentRoomEvent,
        hlsUri,
        maybeVideoDetails,
        roomDetails.id,
        showBackstage,
        showDefaultBreakoutRoom,
        withinThreeMinutesOfBroadcastEvent,
    ]);

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

                {showBackstage ? backStageEl : undefined}

                {!showBackstage ? (
                    <>
                        {startsSoonEl}
                        {isPresenterOfUpcomingEvent ? (
                            <UpcomingBackstageBanner event={isPresenterOfUpcomingEvent} />
                        ) : undefined}
                        {maybeZoomUrl && !currentEventModeIsNone ? (
                            <ExternalLinkButton
                                to={maybeZoomUrl.url}
                                isExternal={true}
                                colorScheme="green"
                                size="lg"
                                w="100%"
                                mt={4}
                            >
                                Go to {maybeZoomUrl.name}
                            </ExternalLinkButton>
                        ) : undefined}
                    </>
                ) : undefined}

                {playerEl}

                {!showBackstage ? (
                    <>
                        <Box bgColor={bgColour} m={-2}>
                            <BreakoutRoom
                                defaultVideoBackendName={defaultVideoBackend}
                                roomDetails={roomDetails}
                                enable={showDefaultBreakoutRoom}
                            />
                        </Box>
                        {contentEl}
                    </>
                ) : undefined}
            </VStack>
        </HStack>
    );
}
