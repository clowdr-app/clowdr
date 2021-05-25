import { gql, useApolloClient } from "@apollo/client";
import {
    Alert,
    AlertIcon,
    AspectRatio,
    Box,
    Button,
    Center,
    HStack,
    Spinner,
    Text,
    useColorModeValue,
    useToast,
    VStack,
} from "@chakra-ui/react";
import type { ElementDataBlob, ZoomBlob } from "@clowdr-app/shared-types/build/content";
import { formatRelative } from "date-fns";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Redirect, useHistory } from "react-router-dom";
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
    useRoom_GetEventBreakoutRoomQuery,
    useRoom_GetEventsQuery,
} from "../../../../generated/graphql";
import { ExternalLinkButton } from "../../../Chakra/LinkButton";
import EmojiFloatContainer from "../../../Emoji/EmojiFloatContainer";
import { roundDownToNearest, roundUpToNearest } from "../../../Generic/MathUtils";
import { useRealTime } from "../../../Generic/useRealTime";
import { FAIcon } from "../../../Icons/FAIcon";
import { useRaiseHandState } from "../../../RaiseHand/RaiseHandProvider";
import useCurrentUser from "../../../Users/CurrentUser/useCurrentUser";
import { useConference } from "../../useConference";
import useCurrentRegistrant from "../../useCurrentRegistrant";
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
            id
            name
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
                                duration: 60000,
                                position: "bottom-right",
                                isClosable: true,
                                title: "Your event has ended!",
                                description: (
                                    <VStack alignItems="flex-start">
                                        <Text>
                                            This event is coming to an end. You can join the discussion room to continue
                                            talking with the audience.
                                        </Text>
                                        <Button
                                            onClick={() =>
                                                history.push(
                                                    `/conference/${conference.slug}/room/${breakoutRoom.data.room_Room[0].id}`
                                                )
                                            }
                                            colorScheme="purple"
                                            fontSize="lg"
                                        >
                                            Go to the discussion room
                                        </Button>
                                    </VStack>
                                ),
                            });
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
                                            colorScheme="purple"
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
                {showDefaultBreakoutRoom && secondsUntilNonBreakoutEvent <= 180 ? (
                    <Alert status="warning">
                        <AlertIcon />
                        Event starting soon. Breakout room closes in {Math.round(secondsUntilNonBreakoutEvent)} seconds
                    </Alert>
                ) : undefined}
                {secondsUntilZoomEvent > 0 && secondsUntilZoomEvent < 180 && !currentRoomEvent ? (
                    <Alert status="info">
                        <AlertIcon />
                        Zoom event starting in {Math.round(secondsUntilZoomEvent)} seconds
                    </Alert>
                ) : undefined}
                {secondsUntilBroadcastEvent > 0 && secondsUntilBroadcastEvent < 180 ? (
                    <Alert status="info">
                        <AlertIcon />
                        Livestream event starting in {Math.round(secondsUntilBroadcastEvent)} seconds
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
            currentEventIsVideoPlayer || (selectedVideoElementId && !currentRoomEvent) ? (
                <Box pos="relative" ref={videoPlayerRef}>
                    {selectedVideoElementId ? (
                        <VideoPlayer elementId={selectedVideoElementId} />
                    ) : (
                        <Center>
                            <AspectRatio
                                w="100%"
                                maxW="600px"
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
                        {maybeZoomUrl && currentRoomEvent?.intendedRoomModeName === Room_Mode_Enum.Zoom ? (
                            <ExternalLinkButton
                                to={maybeZoomUrl.url}
                                isExternal={true}
                                colorScheme="purple"
                                size="lg"
                                w="100%"
                                mt={4}
                            >
                                Go to {maybeZoomUrl.name}
                            </ExternalLinkButton>
                        ) : maybeZoomUrl &&
                          nextRoomEvent?.intendedRoomModeName === Room_Mode_Enum.Zoom &&
                          Date.parse(nextRoomEvent.startTime) - now5s < 10 * 60 * 1000 ? (
                            <ExternalLinkButton
                                to={maybeZoomUrl.url}
                                isExternal={true}
                                colorScheme="purple"
                                size="lg"
                                w="100%"
                                mt={4}
                            >
                                Coming up: Go to {maybeZoomUrl.name} (starts{" "}
                                {formatRelative(Date.parse(nextRoomEvent.startTime), now5s)})
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
