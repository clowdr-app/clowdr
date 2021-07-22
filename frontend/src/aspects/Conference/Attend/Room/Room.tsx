import { gql, useApolloClient } from "@apollo/client";
import {
    Alert,
    AlertIcon,
    AspectRatio,
    Box,
    Button,
    Center,
    HStack,
    keyframes,
    Spinner,
    Text,
    useColorModeValue,
    useToast,
    VStack,
} from "@chakra-ui/react";
import type { ElementDataBlob, ZoomBlob } from "@clowdr-app/shared-types/build/content";
import { ContinuationDefaultFor } from "@clowdr-app/shared-types/build/continuation";
import { formatRelative } from "date-fns";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Content_ItemType_Enum,
    RoomPage_RoomDetailsFragment,
    Room_EventSummaryFragment,
    Room_EventSummaryFragmentDoc,
    Room_ManagementMode_Enum,
    Room_Mode_Enum,
    Schedule_EventProgramPersonRole_Enum,
    useRoomPage_GetRoomChannelStackQuery,
    useRoom_GetDefaultVideoRoomBackendQuery,
    useRoom_GetEventsQuery,
} from "../../../../generated/graphql";
import { ExternalLinkButton } from "../../../Chakra/LinkButton";
import { defaultOutline_AsBoxShadow } from "../../../Chakra/Outline";
import EmojiFloatContainer from "../../../Emoji/EmojiFloatContainer";
import { roundDownToNearest, roundUpToNearest } from "../../../Generic/MathUtils";
import { useRealTime } from "../../../Generic/useRealTime";
import { FAIcon } from "../../../Icons/FAIcon";
import { useRaiseHandState } from "../../../RaiseHand/RaiseHandProvider";
import useCurrentUser from "../../../Users/CurrentUser/useCurrentUser";
import useCurrentRegistrant from "../../useCurrentRegistrant";
import ContinuationChoices from "../Continuation/ContinuationChoices";
import { BreakoutRoom } from "./Breakout/BreakoutRoom";
import { RoomBackstage, UpcomingBackstageBanner } from "./RoomBackstage";
import { RoomContent } from "./RoomContent";
import { RoomControlBar } from "./RoomControlBar";
import { useCurrentRoomEvent } from "./useCurrentRoomEvent";
import { HlsPlayer } from "./Video/HlsPlayer";
import { VideoPlayer } from "./Video/VideoPlayer";

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
        shufflePeriod {
            ...ShufflePeriodData
        }
        item {
            id
            title
            typeName
            videoElements: elements(
                where: { typeName: { _in: [VIDEO_BROADCAST, VIDEO_FILE, VIDEO_PREPUBLISH] }, isHidden: { _eq: false } }
                order_by: { name: asc }
            ) {
                id
                name
            }
            zoomItems: elements(where: { typeName: { _eq: ZOOM } }, limit: 1) {
                id
                data
                name
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

    query Room_GetDefaultVideoRoomBackend {
        system_Configuration_by_pk(key: DEFAULT_VIDEO_ROOM_BACKEND) {
            value
        }
    }
`;

function shuffleTimeRemainingMs(
    { startedAt, durationMinutes }: { startedAt: string; durationMinutes: number },
    now: number
): number {
    const startedAtMs = Date.parse(startedAt);
    const durationMs = durationMinutes * 60 * 1000;
    return startedAtMs + durationMs - now;
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

const refetchEventsInterval = 10 * 60 * 1000;
function Room({
    roomDetails,
    defaultVideoBackend,
}: {
    roomDetails: RoomPage_RoomDetailsFragment;
    defaultVideoBackend: "CHIME" | "VONAGE" | "NO_DEFAULT" | undefined;
}): JSX.Element {
    const now = useRealTime(refetchEventsInterval);
    // Load events from the nearest N-minute boundary onwards
    // Note: Rounding is necessary to ensure a consistent time string is sent to the Apollo Query hook
    //       so re-renders don't cause multiple (very slightly offset) queries to the database in
    //       quick succession.
    // Note: Rounding _down_ is necessary so that any currently ongoing event doesn't accidentally get
    //       excluded from the results if this query happens to re-run in the last 59 seconds of an event!
    //       This was identified after the issue caused some people to be ejected from the backstage at the wrong time.
    const nowStr = useMemo(() => new Date(roundDownToNearest(now, refetchEventsInterval)).toISOString(), [now]);
    const nowCutoffStr = useMemo(
        // Load events up to 1 hour in the future
        // Note: Rounding is necessary to ensure a consistent time string is sent to the Apollo Query hook
        //       so re-renders don't cause spam to the database.
        // Note: Rounding up makes sense as it's the dual of the round down above, but it's not strictly
        //       necessary - any rounding would do.
        () => new Date(roundUpToNearest(now + 60 * 60 * 1000, refetchEventsInterval)).toISOString(),
        [now]
    );

    const { loading: loadingEvents, data } = useRoom_GetEventsQuery({
        fetchPolicy: "cache-and-network",
        nextFetchPolicy: "cache-first",
        variables: {
            roomId: roomDetails.id,
            now: nowStr,
            cutoff: nowCutoffStr,
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

    const [refetchChannelStackInterval, setRefetchChannelStackInterval] = useState<number>(2 * 60 * 1000);
    const [skipGetChannelStack, setSkipGetChannelStack] = useState<boolean>(true);
    const roomChannelStackResponse = useRoomPage_GetRoomChannelStackQuery({
        variables: {
            roomId: roomDetails.id,
        },
        fetchPolicy: "network-only",
        pollInterval: refetchChannelStackInterval,
        skip: skipGetChannelStack,
    });
    useEffect(() => {
        if (secondsUntilBroadcastEvent < 5 * 60 * 1000) {
            setSkipGetChannelStack(false);
        }
    }, [secondsUntilBroadcastEvent]);
    useEffect(() => {
        if (roomChannelStackResponse.data?.video_ChannelStack?.[0]) {
            setRefetchChannelStackInterval(5 * 60 * 1000);
        }
    }, [roomChannelStackResponse.data?.video_ChannelStack]);

    const hlsUri = useMemo(() => {
        if (!roomChannelStackResponse.data?.video_ChannelStack?.[0]) {
            return null;
        }
        const finalUri = new URL(roomChannelStackResponse.data.video_ChannelStack[0].endpointUri);
        finalUri.hostname = roomChannelStackResponse.data.video_ChannelStack[0].cloudFrontDomain;
        return finalUri.toString();
    }, [roomChannelStackResponse.data?.video_ChannelStack]);

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
        (presentingCurrentOrUpcomingSoonEvent || alreadyBackstage.current);

    alreadyBackstage.current = showBackstage;

    const currentEventModeIsNone = currentRoomEvent?.intendedRoomModeName === Room_Mode_Enum.None;
    const showDefaultBreakoutRoom = useMemo(
        () =>
            !roomDetails.isProgramRoom ||
            currentRoomEvent?.intendedRoomModeName === Room_Mode_Enum.Breakout ||
            (!currentRoomEvent &&
                nextRoomEvent &&
                nextRoomEvent.intendedRoomModeName === Room_Mode_Enum.Breakout &&
                Date.parse(nextRoomEvent.startTime) <= now30s + 20 * 60 * 1000) ||
            (!currentRoomEvent && roomDetails.originatingItem?.typeName === Content_ItemType_Enum.Sponsor),
        [currentRoomEvent, nextRoomEvent, now30s, roomDetails.isProgramRoom, roomDetails.originatingItem?.typeName]
    );

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

    const videoPlayerRef = useRef<HTMLDivElement | null>(null);
    const [selectedVideoElementId, setSelectedVideoElementId] = useState<string | null>(null);

    useEffect(() => {
        if (
            selectedVideoElementId &&
            currentRoomEvent &&
            currentRoomEvent.intendedRoomModeName !== Room_Mode_Enum.VideoPlayer
        ) {
            setSelectedVideoElementId(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRoomEvent]);

    const toast = useToast();

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
                    <Button onClick={() => setWatchStreamForEventId(null)} colorScheme="purple" mt={2}>
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
                    <Button onClick={() => setWatchStreamForEventId(null)} colorScheme="purple" mt={2}>
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

    const raiseHand = useRaiseHandState();
    const apolloClient = useApolloClient();
    const currentUser = useCurrentUser().user;
    useEffect(() => {
        if (currentRegistrant.userId) {
            if (showBackstage) {
                const isPresenterOrChairOfCurrentEvent =
                    currentRoomEvent !== null &&
                    (currentRoomEvent.intendedRoomModeName === Room_Mode_Enum.Presentation ||
                        currentRoomEvent.intendedRoomModeName === Room_Mode_Enum.QAndA) &&
                    currentRoomEvent.eventPeople.some(
                        (person) =>
                            person.person.registrantId === currentRegistrant.id &&
                            person.roleName !== Schedule_EventProgramPersonRole_Enum.Participant
                    );

                raiseHand.setCurrentEventId(
                    backstageSelectedEventId === currentRoomEvent?.id ? backstageSelectedEventId : null,
                    currentRegistrant.userId,
                    isPresenterOrChairOfCurrentEvent
                        ? Schedule_EventProgramPersonRole_Enum.Chair
                        : Schedule_EventProgramPersonRole_Enum.Participant
                );
            } else if (
                currentRoomEvent?.id &&
                (currentRoomEvent?.intendedRoomModeName === Room_Mode_Enum.Presentation ||
                    currentRoomEvent?.intendedRoomModeName === Room_Mode_Enum.QAndA)
            ) {
                raiseHand.setCurrentEventId(
                    currentRoomEvent.id,
                    currentRegistrant.userId,
                    Schedule_EventProgramPersonRole_Enum.Participant
                );
            } else {
                raiseHand.setCurrentEventId(
                    null,
                    currentRegistrant.userId,
                    Schedule_EventProgramPersonRole_Enum.Participant
                );
            }
        }

        return () => {
            if (currentRegistrant.userId) {
                raiseHand.setCurrentEventId(
                    null,
                    currentRegistrant.userId,
                    Schedule_EventProgramPersonRole_Enum.Participant
                );
            }
        };
    }, [
        showBackstage,
        backstageSelectedEventId,
        currentRegistrant.id,
        currentRegistrant.userId,
        currentRoomEvent,
        raiseHand,
    ]);

    // RAISE_HAND_TODO: setStartTimeOfNextBackstage

    useEffect(() => {
        raiseHand.setIsBackstage(showBackstage);
        return () => {
            raiseHand.setIsBackstage(false);
        };
    }, [raiseHand, showBackstage, currentRoomEvent?.id, backstageSelectedEventId]);
    useEffect(() => {
        const unobserve = currentRoomEvent?.id
            ? raiseHand.observe(currentRoomEvent.id, (update) => {
                  if ("userId" in update && update.userId === currentUser.id && update.wasAccepted) {
                      setTimeout(() => {
                          // alert("Auto revealing backstage room");
                          const fragmentId = apolloClient.cache.identify({
                              __typename: "schedule_Event",
                              id: currentRoomEvent.id,
                          });
                          const eventFragment = apolloClient.cache.readFragment<Room_EventSummaryFragment>({
                              fragment: Room_EventSummaryFragmentDoc,
                              id: fragmentId,
                              fragmentName: "Room_EventSummary",
                          });
                          if (eventFragment) {
                              apolloClient.cache.writeFragment({
                                  fragment: Room_EventSummaryFragmentDoc,
                                  id: fragmentId,
                                  fragmentName: "Room_EventSummary",
                                  data: {
                                      ...eventFragment,
                                      eventPeople: !eventFragment.eventPeople.some(
                                          (x) => x.id === update.eventPerson.id
                                      )
                                          ? [
                                                ...eventFragment.eventPeople,
                                                {
                                                    id: update.eventPerson.id,
                                                    roleName: update.eventPerson.roleName,
                                                    person: update.eventPerson.person,
                                                },
                                            ]
                                          : eventFragment.eventPeople,
                                  },
                              });
                          }
                          setWatchStreamForEventId(null);
                          setBackstageSelectedEventId(currentRoomEvent.id);
                      }, 150);
                  }
              })
            : () => {
                  // Intentionally empty
              };

        return () => {
            unobserve();
        };
    }, [apolloClient.cache, currentRoomEvent?.id, currentUser.id, raiseHand]);

    const onLeaveBackstage = useCallback(() => {
        const isParticipantOfCurrentEvent =
            currentRoomEvent !== null &&
            (currentRoomEvent.intendedRoomModeName === Room_Mode_Enum.Presentation ||
                currentRoomEvent.intendedRoomModeName === Room_Mode_Enum.QAndA) &&
            currentRoomEvent.eventPeople.some(
                (person) =>
                    person.person.registrantId === currentRegistrant.id &&
                    person.roleName === Schedule_EventProgramPersonRole_Enum.Participant
            );

        const isPresenterOfUpcomingSoonEvent = !!nonCurrentLiveEventsInNext20Mins?.some((event) =>
            event?.eventPeople.some((person) => person.person.registrantId === currentRegistrant.id)
        );

        if (isParticipantOfCurrentEvent && currentRoomEvent) {
            setBackstageSelectedEventId(null);
            if (!isPresenterOfUpcomingSoonEvent) {
                setWatchStreamForEventId(currentRoomEvent.id);
            }
        }
    }, [currentRegistrant.id, currentRoomEvent, nonCurrentLiveEventsInNext20Mins]);

    const backStageEl = useMemo(
        () => (
            <RoomBackstage
                showBackstage={showBackstage}
                roomName={roomDetails.name}
                roomEvents={roomEventsForCurrentRegistrant}
                currentRoomEventId={currentRoomEvent?.id}
                nextRoomEventId={nextRoomEvent?.id}
                selectedEventId={backstageSelectedEventId}
                setWatchStreamForEventId={setWatchStreamForEventId}
                onEventSelected={setBackstageSelectedEventId}
                roomChatId={roomDetails.chatId}
                onLeave={onLeaveBackstage}
            />
        ),
        [
            showBackstage,
            roomDetails.name,
            roomDetails.chatId,
            roomEventsForCurrentRegistrant,
            currentRoomEvent?.id,
            nextRoomEvent?.id,
            backstageSelectedEventId,
            onLeaveBackstage,
        ]
    );

    const contentEl = useMemo(
        () => (
            <RoomContent
                currentRoomEvent={currentRoomEvent}
                nextRoomEvent={nextRoomEvent}
                roomDetails={roomDetails}
                onChooseVideo={(id) => {
                    setSelectedVideoElementId(id);
                    videoPlayerRef?.current?.focus();
                    videoPlayerRef?.current?.scrollIntoView();
                }}
                currentlySelectedVideoElementId={selectedVideoElementId ?? undefined}
            />
        ),
        [currentRoomEvent, nextRoomEvent, roomDetails, selectedVideoElementId]
    );

    const shuffleTimeRemaining = useMemo(
        () =>
            roomDetails.shuffleRooms.length
                ? shuffleTimeRemainingMs(roomDetails.shuffleRooms[0], now5s)
                : Number.POSITIVE_INFINITY,
        [roomDetails.shuffleRooms, now5s]
    );

    const bgColour = useColorModeValue("gray.200", "gray.700");

    // Note: A video chat might be shown in a sponsor booth. That booth may
    //       have an upcoming broadcast or Zoom event. Thus it's possible
    //       for the video chat to be closing even when there is no ongoing
    //       breakout event.
    const secondsUntilNonBreakoutEvent = Math.min(secondsUntilBroadcastEvent, secondsUntilZoomEvent);
    const currentRoomEventEndTime = useMemo(
        () => (currentRoomEvent ? Date.parse(currentRoomEvent.endTime) : undefined),
        [currentRoomEvent]
    );
    const secondsUntilBreakoutEventEnds = useMemo(
        () =>
            currentRoomEventEndTime && currentRoomEvent?.intendedRoomModeName === Room_Mode_Enum.Breakout
                ? (currentRoomEventEndTime - now5s) / 1000
                : Number.POSITIVE_INFINITY,
        [currentRoomEvent?.intendedRoomModeName, currentRoomEventEndTime, now5s]
    );
    const secondsUntilBreakoutRoomCloses = Math.min(secondsUntilBreakoutEventEnds, secondsUntilNonBreakoutEvent);

    const startsSoonEl = useMemo(
        () => (
            <>
                {shuffleTimeRemaining <= 30000 ? (
                    <Alert status="warning" pos="sticky" top={0} zIndex={10000}>
                        <AlertIcon />
                        Shuffle room ends in {Math.max(0, Math.round(shuffleTimeRemaining))} seconds
                    </Alert>
                ) : undefined}
                {showDefaultBreakoutRoom && secondsUntilBreakoutRoomCloses <= 180 ? (
                    <Alert status="warning" pos="sticky" top={0} zIndex={10000}>
                        <AlertIcon />
                        Video-chat closes in {Math.round(secondsUntilBreakoutRoomCloses)} seconds
                    </Alert>
                ) : undefined}
                {secondsUntilZoomEvent > 0 && secondsUntilZoomEvent < 180 && !currentRoomEvent ? (
                    <Alert status="info" pos="sticky" top={0} zIndex={10000}>
                        <AlertIcon />
                        Zoom event starting in {Math.round(secondsUntilZoomEvent)} seconds
                    </Alert>
                ) : undefined}
                {secondsUntilBroadcastEvent > 0 && secondsUntilBroadcastEvent < 180 ? (
                    <Alert status="info" pos="sticky" top={0} zIndex={10000}>
                        <AlertIcon />
                        Livestream event starting in {Math.round(secondsUntilBroadcastEvent)} seconds
                    </Alert>
                ) : undefined}
            </>
        ),
        [
            currentRoomEvent,
            secondsUntilBreakoutRoomCloses,
            secondsUntilBroadcastEvent,
            secondsUntilZoomEvent,
            showDefaultBreakoutRoom,
            shuffleTimeRemaining,
        ]
    );

    const playerEl = useMemo(() => {
        const currentEventIsVideoPlayer = currentRoomEvent?.intendedRoomModeName === Room_Mode_Enum.VideoPlayer;
        const shouldShowLivePlayer =
            !currentEventModeIsNone && !showDefaultBreakoutRoom && withinThreeMinutesOfBroadcastEvent;

        return !showBackstage ? (
            currentEventIsVideoPlayer || (selectedVideoElementId && !currentRoomEvent) ? (
                <Box pos="relative" ref={videoPlayerRef}>
                    {selectedVideoElementId ? (
                        <VideoPlayer elementId={selectedVideoElementId} />
                    ) : (
                        <Center>
                            <AspectRatio
                                w="100%"
                                maxW="800px"
                                maxH="90vh"
                                ratio={16 / 9}
                                border="3px solid"
                                borderColor="gray.400"
                                borderRadius="lg"
                            >
                                <VStack>
                                    <Text fontSize="2xl">Select a video below</Text>
                                    <FAIcon icon="hand-point-down" aria-hidden="true" iconStyle="r" fontSize="6xl" />
                                </VStack>
                            </AspectRatio>
                        </Center>
                    )}
                    <EmojiFloatContainer chatId={roomDetails.chatId ?? ""} />
                </Box>
            ) : shouldShowLivePlayer && hlsUri ? (
                <Box pos="relative">
                    <HlsPlayer
                        roomId={roomDetails.id}
                        canPlay={withinThreeMinutesOfBroadcastEvent || !!currentRoomEvent}
                        hlsUri={hlsUri}
                    />
                    <EmojiFloatContainer chatId={roomDetails.chatId ?? ""} />
                </Box>
            ) : undefined
        ) : undefined;
    }, [
        currentRoomEvent,
        currentEventModeIsNone,
        showDefaultBreakoutRoom,
        withinThreeMinutesOfBroadcastEvent,
        showBackstage,
        selectedVideoElementId,
        roomDetails.chatId,
        roomDetails.id,
        hlsUri,
    ]);

    const zoomButtonBgKeyframes = keyframes`
0% {
    background-position: 0% 100%;
}
50% {
    background-position: 100% 0%;
}
100% {
    background-position: 0% 100%;
}
    `;
    const shadow = useColorModeValue("lg", "light-md");

    const [continuationChoicesFrom, setContinuationChoicesFrom] = useState<
        | { eventId: string; itemId: string | null; endsAt: number }
        | { shufflePeriodId: string; shuffleRoomEndsAt: number }
        | null
    >(null);
    const [continuationIsBackstage, setContinuationIsBackstage] = useState<boolean>(false);
    const [continuationNoBackstage, setContinuationNoBackstage] = useState<boolean>(false);
    const [continuationRole, setContinuationRole] = useState<ContinuationDefaultFor>(ContinuationDefaultFor.None);

    useEffect(() => {
        if (currentRoomEvent) {
            const startTime = Date.parse(currentRoomEvent.startTime);
            if (now5s - startTime > 45000) {
                setContinuationChoicesFrom((old) =>
                    !old || !("eventId" in old) || old.eventId !== currentRoomEvent.id
                        ? {
                              eventId: currentRoomEvent.id,
                              itemId: currentRoomEvent.itemId ?? null,
                              endsAt: currentRoomEvent.endTime ? Date.parse(currentRoomEvent.endTime) : 0,
                          }
                        : old
                );
                const noBackstage =
                    currentRoomEvent.intendedRoomModeName !== Room_Mode_Enum.Presentation &&
                    currentRoomEvent.intendedRoomModeName !== Room_Mode_Enum.QAndA;
                setContinuationIsBackstage(showBackstage);
                setContinuationNoBackstage(noBackstage);
                const roleName = !noBackstage
                    ? currentRoomEvent?.eventPeople.find((x) => x.person?.registrantId === currentRegistrant.id)
                          ?.roleName
                    : undefined;
                if (roleName === Schedule_EventProgramPersonRole_Enum.Chair) {
                    setContinuationRole(ContinuationDefaultFor.Chairs);
                } else if (roleName === Schedule_EventProgramPersonRole_Enum.Presenter) {
                    setContinuationRole(ContinuationDefaultFor.Presenters);
                } else if (!noBackstage) {
                    setContinuationRole(ContinuationDefaultFor.Viewers);
                } else {
                    setContinuationRole(ContinuationDefaultFor.None);
                }
            }
        } else if (roomDetails.shuffleRooms.length > 0) {
            setContinuationChoicesFrom((old) =>
                !old ||
                !("shufflePeriodId" in old) ||
                old.shufflePeriodId !== roomDetails.shuffleRooms[0].shufflePeriodId
                    ? {
                          shufflePeriodId: roomDetails.shuffleRooms[0].shufflePeriodId,
                          shuffleRoomEndsAt:
                              Date.parse(roomDetails.shuffleRooms[0].startedAt) +
                              roomDetails.shuffleRooms[0].durationMinutes * 60 * 1000,
                      }
                    : old
            );
            setContinuationIsBackstage(false);
            setContinuationNoBackstage(true);
            setContinuationRole(ContinuationDefaultFor.None);
        } else {
            setContinuationChoicesFrom((old) => (!old || ("endsAt" in old && now5s > old.endsAt + 45000) ? null : old));
        }
    }, [currentRoomEvent, roomDetails.shuffleRooms, now5s, showBackstage, currentRegistrant.id]);

    return (
        <>
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
                            {maybeZoomUrl && currentRoomEvent?.intendedRoomModeName === Room_Mode_Enum.Zoom ? (
                                <ExternalLinkButton
                                    to={maybeZoomUrl.url}
                                    isExternal={true}
                                    mt={20}
                                    mb={4}
                                    mx={2}
                                    p={8}
                                    linkProps={{
                                        textAlign: "center",
                                        minH: "18em",
                                    }}
                                    whiteSpace="normal"
                                    h="auto"
                                    lineHeight="150%"
                                    fontSize="1.5em"
                                    colorScheme="purple"
                                    color="white"
                                    borderRadius="2xl"
                                    shadow={shadow}
                                    animation={`${zoomButtonBgKeyframes} 10s ease-in-out infinite`}
                                    transition="none"
                                    background="linear-gradient(135deg, rgba(195,0,146,1) 20%, rgba(0,105,231,1) 50%, rgba(195,0,146,1) 80%);"
                                    backgroundSize="400% 400%"
                                    _hover={{
                                        background:
                                            "linear-gradient(135deg, rgba(168,0,126,1) 20%, rgba(0,82,180,1) 50%, rgba(168,0,126,1) 80%);",
                                        backgroundSize: "400% 400%",
                                    }}
                                    _focus={{
                                        background:
                                            "linear-gradient(135deg, rgba(168,0,126,1) 20%, rgba(0,82,180,1) 50%, rgba(168,0,126,1) 80%);",
                                        backgroundSize: "400% 400%",
                                        boxShadow: defaultOutline_AsBoxShadow,
                                    }}
                                    _active={{
                                        background:
                                            "linear-gradient(135deg, rgba(118,0,89,1) 20%, rgba(0,55,121,1) 50%, rgba(118,0,89,1) 80%);",
                                        backgroundSize: "400% 400%",
                                    }}
                                >
                                    <FAIcon iconStyle="s" icon="link" ml="auto" mr={4} />
                                    Click to join {maybeZoomUrl.name}
                                    <FAIcon iconStyle="s" icon="mouse-pointer" ml={4} />
                                </ExternalLinkButton>
                            ) : maybeZoomUrl &&
                              nextRoomEvent?.intendedRoomModeName === Room_Mode_Enum.Zoom &&
                              Date.parse(nextRoomEvent.startTime) - now5s < 10 * 60 * 1000 ? (
                                <ExternalLinkButton
                                    to={maybeZoomUrl.url}
                                    isExternal={true}
                                    mt={20}
                                    mb={4}
                                    mx={2}
                                    p={8}
                                    linkProps={{
                                        textAlign: "center",
                                        minH: "30em",
                                    }}
                                    whiteSpace="normal"
                                    h="auto"
                                    lineHeight="150%"
                                    fontSize="1.5em"
                                    colorScheme="purple"
                                    color="white"
                                    borderRadius="2xl"
                                    shadow={shadow}
                                    animation={`${zoomButtonBgKeyframes} 10s ease-in-out infinite`}
                                    transition="none"
                                    background="linear-gradient(135deg, rgba(195,0,146,1) 20%, rgba(0,105,231,1) 50%, rgba(195,0,146,1) 80%);"
                                    backgroundSize="400% 400%"
                                    _hover={{
                                        background:
                                            "linear-gradient(135deg, rgba(168,0,126,1) 20%, rgba(0,82,180,1) 50%, rgba(168,0,126,1) 80%);",
                                        backgroundSize: "400% 400%",
                                    }}
                                    _focus={{
                                        background:
                                            "linear-gradient(135deg, rgba(168,0,126,1) 20%, rgba(0,82,180,1) 50%, rgba(168,0,126,1) 80%);",
                                        backgroundSize: "400% 400%",
                                        boxShadow: defaultOutline_AsBoxShadow,
                                    }}
                                    _active={{
                                        background:
                                            "linear-gradient(135deg, rgba(118,0,89,1) 20%, rgba(0,55,121,1) 50%, rgba(118,0,89,1) 80%);",
                                        backgroundSize: "400% 400%",
                                    }}
                                >
                                    <FAIcon iconStyle="s" icon="link" ml="auto" mr={4} />
                                    Starting {formatRelative(Date.parse(nextRoomEvent.startTime), now5s)}
                                    <br />
                                    Click to join {maybeZoomUrl.name}
                                    <FAIcon iconStyle="s" icon="mouse-pointer" ml={4} />
                                </ExternalLinkButton>
                            ) : undefined}
                        </>
                    ) : undefined}

                    {playerEl}

                    {!showBackstage ? (
                        <>
                            <Box bgColor={bgColour}>
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

            {continuationChoicesFrom ? (
                <ContinuationChoices
                    from={continuationChoicesFrom}
                    isBackstage={continuationIsBackstage}
                    noBackstage={continuationNoBackstage}
                    currentRole={continuationRole}
                    currentRoomId={roomDetails.id}
                />
            ) : undefined}
        </>
    );
}
