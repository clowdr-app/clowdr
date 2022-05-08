import { ArrowDownIcon } from "@chakra-ui/icons";
import {
    AspectRatio,
    Box,
    Button,
    Center,
    chakra,
    Flex,
    Heading,
    HStack,
    Spacer,
    Text,
    useColorModeValue,
    useToast,
    VStack,
} from "@chakra-ui/react";
import type { ElementDataBlob, ExternalEventLinkBlob } from "@midspace/shared-types/content";
import { gql } from "@urql/core";
import * as R from "ramda";
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type { RoomPage_RoomDetailsFragment, Room_EventSummaryFragment } from "../../../../generated/graphql";
import {
    Content_ItemType_Enum,
    Registrant_RegistrantRole_Enum,
    Room_PersonRole_Enum,
    Schedule_EventProgramPersonRole_Enum,
    Schedule_Mode_Enum,
    useRoom_GetDefaultVideoRoomBackendQuery,
    useRoom_GetEventsQuery,
} from "../../../../generated/graphql";
import AppError from "../../../App/AppError";
import { useAppLayout } from "../../../App/AppLayoutContext";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import FAIcon from "../../../Chakra/FAIcon";
import EmojiFloatContainer from "../../../Emoji/EmojiFloatContainer";
import { useRealTime } from "../../../Hooks/useRealTime";
import { useRaiseHandState } from "../../../RaiseHand/RaiseHandProvider";
import useCurrentUser from "../../../Users/CurrentUser/useCurrentUser";
import { roundDownToNearest, roundUpToNearest } from "../../../Utils/MathUtils";
import { useEvent } from "../../../Utils/useEvent";
import useCurrentRegistrant from "../../useCurrentRegistrant";
import JoinExternalEventButton from "./JoinExternalEventButton";
import { RoomMembersButton } from "./Members/RoomMembersButton";
import { RoomContent } from "./RoomContent";
import RoomContinuationChoices from "./RoomContinuationChoices";
import RoomTimeAlert from "./RoomTimeAlert";
import { RoomTitle } from "./RoomTitle";
import { UpcomingBackstageBanner } from "./Stream/UpcomingBackstage";
import { useHLSUri } from "./Stream/useHLSUri";
import StreamTextCaptions from "./StreamTextCaptions";
import { useCurrentRoomEvent } from "./useCurrentRoomEvent";
import { VideoAspectWrapper } from "./Video/VideoAspectWrapper";
import { VideoChatRoom } from "./VideoChat/VideoChatRoom";
import { useVonageGlobalState } from "./Vonage/State/VonageGlobalStateProvider";
import type { RecordingControlRoles } from "./Vonage/State/VonageRoomProvider";
import { RecordingControlRole } from "./Vonage/State/VonageRoomProvider";

const Backstages = React.lazy(() => import("./Stream/Backstages"));
const VideoPlayer = React.lazy(() => import("./Video/VideoPlayerEventPlayer"));
const HlsPlayer = React.lazy(() => import("./Video/HlsPlayer"));

gql`
    query Room_GetEvents(
        $roomId: uuid!
        $now: timestamptz!
        $cutoff: timestamptz!
        $includeAbstract: Boolean!
        $includeItemEvents: Boolean!
    ) @cached {
        schedule_Event(
            where: {
                roomId: { _eq: $roomId }
                sessionEventId: { _is_null: true }
                scheduledEndTime: { _gte: $now }
                scheduledStartTime: { _lte: $cutoff }
            }
        ) {
            ...Room_EventSummary
        }
    }

    fragment Room_EventSummary on schedule_Event {
        id
        roomId
        conferenceId
        scheduledStartTime
        name
        scheduledEndTime
        modeName
        itemId
        exhibitionId
        streamTextEventId
        shufflePeriod {
            ...ShufflePeriodData
        }
        autoPlayElement {
            id
            name
            typeName
            itemId
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
                typeName
                itemId
            }
            externalEventItems: elements(where: { typeName: { _eq: EXTERNAL_EVENT_LINK } }, limit: 1) {
                id
                data
                name
            }
            chatId
        }
        eventPeople {
            id
            personId
            person {
                id
                name
                affiliation
                registrantId
            }
            roleName
        }
        presentations {
            ...ScheduleEvent

            eventPeople {
                id
                person {
                    id
                    registrantId
                }
                roleName
            }
        }
    }

    query Room_GetDefaultVideoRoomBackend @cached {
        system_Configuration_by_pk(key: DEFAULT_VIDEO_ROOM_BACKEND) {
            value
        }
    }
`;

export default function RoomOuter({ roomDetails }: { roomDetails: RoomPage_RoomDetailsFragment }): JSX.Element {
    const [
        { data: defaultVideoRoomBackendData, fetching: defaultvideoRoomBackendLoading },
        refetchDefaultVideoRoomBackend,
    ] = useRoom_GetDefaultVideoRoomBackendQuery({
        requestPolicy: "network-only",
    });

    useEffect(() => {
        refetchDefaultVideoRoomBackend();
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
    // Note: Rounding is necessary to ensure a consistent time string is sent to the Query hook
    //       so re-renders don't cause multiple (very slightly offset) queries to the database in
    //       quick succession.
    // Note: Rounding _down_ is necessary so that any currently ongoing event doesn't accidentally get
    //       excluded from the results if this query happens to re-run in the last 59 seconds of an event!
    //       This was identified after the issue caused some people to be ejected from the backstage at the wrong time.
    const nowStr = useMemo(() => new Date(roundDownToNearest(now, refetchEventsInterval)).toISOString(), [now]);
    const nowCutoffStr = useMemo(
        // Load events up to 1 hour in the future
        // Note: Rounding is necessary to ensure a consistent time string is sent to the Query hook
        //       so re-renders don't cause spam to the database.
        // Note: Rounding up makes sense as it's the dual of the round down above, but it's not strictly
        //       necessary - any rounding would do.
        () => new Date(roundUpToNearest(now + 60 * 60 * 1000, refetchEventsInterval)).toISOString(),
        [now]
    );

    const [{ fetching: loadingEvents, data }, refetchRoomEvents] = useRoom_GetEventsQuery({
        requestPolicy: "cache-and-network",
        variables: {
            roomId: roomDetails.id,
            now: nowStr,
            cutoff: nowCutoffStr,
            includeAbstract: true,
            includeItemEvents: false,
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
                    refetchRoomEvents={refetchRoomEvents}
                    defaultVideoBackend={defaultVideoBackend}
                />
            ) : undefined,
        [cachedRoomEvents, defaultVideoBackend, roomDetails, refetchRoomEvents]
    );

    return (
        <>
            {roomInner}
            {loadingEvents && cachedRoomEvents === null ? (
                <CenteredSpinner caller="Room:200" spinnerProps={{ label: "Loading events" }} />
            ) : undefined}
        </>
    );
}

function RoomInner({
    roomDetails,
    roomEvents,
    refetchRoomEvents,
    defaultVideoBackend,
}: {
    roomDetails: RoomPage_RoomDetailsFragment;
    roomEvents: readonly Room_EventSummaryFragment[];
    refetchRoomEvents: () => void;
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
        withinStreamLatencySinceBroadcastEvent,
        broadcastEventStartsAt,
        externalEventStartsAt,
    } = useCurrentRoomEvent(roomEvents);

    const hlsUri = useHLSUri(roomDetails.id, broadcastEventStartsAt);
    const secondsUntilBroadcastEvent = Math.round((broadcastEventStartsAt - now5s) / 1000);

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
            currentRoomEvent.modeName === Schedule_Mode_Enum.Livestream &&
            currentRoomEvent.eventPeople.some((person) => person.person.registrantId === currentRegistrant.id);

        const isPresenterOfUpcomingSoonEvent = !!nonCurrentLiveEventsInNext20Mins?.some(
            (event) =>
                event.eventPeople.some((person) => person.person.registrantId === currentRegistrant.id) ||
                event.presentations.some((presentation) =>
                    presentation.eventPeople.some((person) => person.person.registrantId === currentRegistrant.id)
                )
        );

        return isPresenterOfCurrentEvent || !!isPresenterOfUpcomingSoonEvent;
    }, [currentRegistrant.id, currentRoomEvent, nonCurrentLiveEventsInNext20Mins]);

    const [watchStreamForEventId, setWatchStreamForEventId] = useState<string | null>(null);
    const alreadyBackstage = useRef<boolean>(false);

    const hasBackstage = !!roomEvents.some((event) => Schedule_Mode_Enum.Livestream === event.modeName);

    const notExplicitlyWatchingCurrentOrNextEvent =
        !watchStreamForEventId ||
        (!!currentRoomEvent && watchStreamForEventId !== currentRoomEvent.id) ||
        (!currentRoomEvent && !!nextRoomEvent && watchStreamForEventId !== nextRoomEvent.id);
    const showBackstage =
        hasBackstage &&
        notExplicitlyWatchingCurrentOrNextEvent &&
        (presentingCurrentOrUpcomingSoonEvent || alreadyBackstage.current);

    alreadyBackstage.current = showBackstage;

    const moveToNextBackstage = useCallback(() => {
        if (nextRoomEvent) {
            setBackstageSelectedEventId(nextRoomEvent.id);
        }
    }, [nextRoomEvent]);

    const currentEventModeIsNone = currentRoomEvent?.modeName === Schedule_Mode_Enum.None;
    const showDefaultVideoChatRoom = useMemo(
        () =>
            !roomDetails.isProgramRoom ||
            (!roomDetails.isStreamingProgramRoom &&
                ((!currentRoomEvent &&
                    (!nextRoomEvent ||
                        nextRoomEvent.modeName !== Schedule_Mode_Enum.External ||
                        externalEventStartsAt - now30s > 20 * 60 * 1000)) ||
                    currentRoomEvent?.modeName === Schedule_Mode_Enum.VideoChat ||
                    (!currentRoomEvent && roomDetails.item?.typeName === Content_ItemType_Enum.Sponsor))),
        [
            currentRoomEvent,
            nextRoomEvent,
            now30s,
            roomDetails.isProgramRoom,
            roomDetails.isStreamingProgramRoom,
            roomDetails.item?.typeName,
            externalEventStartsAt,
        ]
    );

    const maybeExternalEventUrl = useMemo(() => {
        try {
            if (currentRoomEvent) {
                const currentExternalEventItems = currentRoomEvent.item?.externalEventItems;
                if (currentExternalEventItems?.length) {
                    const versions = currentExternalEventItems[0].data as ElementDataBlob;
                    const latest = R.last(versions)?.data as ExternalEventLinkBlob;
                    return { url: latest.url, name: currentExternalEventItems[0].name };
                }
            }

            if (nextRoomEvent) {
                const nextExternalEventItems = nextRoomEvent.item?.externalEventItems;
                if (
                    nextExternalEventItems?.length &&
                    now30s > Date.parse(nextRoomEvent.scheduledStartTime) - 20 * 60 * 1000
                ) {
                    const versions = nextExternalEventItems[0].data as ElementDataBlob;
                    const latest = R.last(versions)?.data as ExternalEventLinkBlob;
                    return { url: latest.url, name: nextExternalEventItems[0].name };
                }
            }

            return undefined;
        } catch (e) {
            console.error("Error finding current event ExternalEvent details", e);
            return undefined;
        }
    }, [currentRoomEvent, nextRoomEvent, now30s]);

    const videoPlayerRef = useRef<HTMLDivElement | null>(null);
    const [selectedVideoElementId, setSelectedVideoElementId] = useState<string | null>(null);
    useEffect(() => {
        if (
            selectedVideoElementId &&
            currentRoomEvent &&
            currentRoomEvent.modeName !== Schedule_Mode_Enum.VideoPlayer
        ) {
            setSelectedVideoElementId(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRoomEvent]);

    const toast = useToast();
    useEffect(() => {
        if (
            currentRoomEvent &&
            currentRoomEvent.modeName === Schedule_Mode_Enum.Livestream &&
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
                    <Button onClick={() => setWatchStreamForEventId(null)} colorScheme="PrimaryActionButton" mt={2}>
                        Go to the backstage
                    </Button>
                ),
            });
        } else if (
            nextRoomEvent &&
            nextRoomEvent.modeName === Schedule_Mode_Enum.Livestream &&
            nextRoomEvent.eventPeople.some((person) => person.person.registrantId === currentRegistrant.id) &&
            Date.parse(nextRoomEvent.scheduledStartTime) - Date.now() < 20 * 60 * 1000 &&
            !showBackstage
        ) {
            toast({
                status: "warning",
                position: "top",
                isClosable: true,
                title: "You are a presenter of the next event",
                description: (
                    <Button onClick={() => setWatchStreamForEventId(null)} colorScheme="PrimaryActionButton" mt={2}>
                        Go to the backstage
                    </Button>
                ),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRoomEvent?.id]);

    const { mainPaneHeight, mainPaneWidth } = useAppLayout();

    const scrollRef = useRef<HTMLDivElement>(null);
    const controlBarEl = useMemo(
        () => (
            <HStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gridRowGap={2} py={2} px={4}>
                <RoomTitle roomDetails={roomDetails} />
                {showBackstage ? (
                    <Heading as="h2" size="md">
                        Backstages
                    </Heading>
                ) : undefined}
                {(roomDetails.item || currentRoomEvent || nextRoomEvent) && !showBackstage ? (
                    <Button
                        rightIcon={<ArrowDownIcon />}
                        variant="link"
                        size="sm"
                        onClick={() => scrollRef?.current?.scrollIntoView(true)}
                    >
                        Scroll to content
                    </Button>
                ) : undefined}
                <Spacer />
                <Flex flex="1" justifyContent="flex-end">
                    <RoomMembersButton roomDetails={roomDetails} />
                </Flex>
            </HStack>
        ),
        [currentRoomEvent, nextRoomEvent, roomDetails, showBackstage]
    );

    const roomEventsForCurrentRegistrant = useMemo(
        () =>
            roomEvents.filter(
                (event) =>
                    event.eventPeople.some((person) => person.person.registrantId === currentRegistrant.id) ||
                    event.presentations.some((presentation) =>
                        presentation.eventPeople.some((person) => person.person.registrantId === currentRegistrant.id)
                    )
            ),
        [currentRegistrant.id, roomEvents]
    );
    const [backstageSelectedEventId, setBackstageSelectedEventId] = useState<string | null>(null);

    const raiseHand = useRaiseHandState();
    const currentUser = useCurrentUser().user;
    useEffect(() => {
        if (currentRegistrant.userId) {
            if (showBackstage) {
                const isPresenterOrChairOfCurrentEvent =
                    currentRoomEvent !== null &&
                    currentRoomEvent.modeName === Schedule_Mode_Enum.Livestream &&
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
            } else if (currentRoomEvent?.id && currentRoomEvent?.modeName === Schedule_Mode_Enum.Livestream) {
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
                          refetchRoomEvents();
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
    }, [refetchRoomEvents, currentRoomEvent?.id, currentUser.id, raiseHand]);

    const onLeaveBackstage = useCallback(() => {
        const isParticipantOfCurrentEvent =
            currentRoomEvent !== null &&
            currentRoomEvent.modeName === Schedule_Mode_Enum.Livestream &&
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
            <ErrorBoundary FallbackComponent={AppError}>
                <Suspense fallback={<CenteredSpinner caller="Room:542" />}>
                    <Backstages
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
                        hlsUri={hlsUri ?? undefined}
                    />
                </Suspense>
            </ErrorBoundary>
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
            hlsUri,
        ]
    );

    const contentEl = useMemo(
        () =>
            roomDetails.item || currentRoomEvent || nextRoomEvent ? (
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
            ) : undefined,
        [currentRoomEvent, nextRoomEvent, roomDetails, selectedVideoElementId]
    );

    const shuffleRoomEndsAt = useMemo(
        () =>
            roomDetails.shuffleRooms.length
                ? Date.parse(roomDetails.shuffleRooms[0].startedAt) +
                  roomDetails.shuffleRooms[0].durationMinutes * 60 * 1000
                : Number.POSITIVE_INFINITY,
        [roomDetails.shuffleRooms]
    );

    const bgColour = useColorModeValue("Room.videoChatBackgroundColor-light", "Room.videoChatBackgroundColor-dark");

    // Note: A video chat might be shown in a sponsor booth. That booth may
    //       have an upcoming broadcast or ExternalEvent event. Thus it's possible
    //       for the video chat to be closing even when there is no ongoing
    //       breakout event.
    const nonVideoChatEventStartsAt = Math.min(broadcastEventStartsAt, externalEventStartsAt - 20 * 60 * 1000);
    // const currentRoomEventEndTime = useMemo(
    //     () => (currentRoomEvent ? Date.parse(currentRoomEvent.scheduledEndTime) : undefined),
    //     [currentRoomEvent]
    // );
    // const breakoutEventEndsAt = useMemo(
    //     () =>
    //         currentRoomEventEndTime &&
    //         currentRoomEvent?.modeName === Schedule_Mode_Enum.VideoChat &&
    //         nextRoomEvent?.modeName !== Schedule_Mode_Enum.VideoChat
    //             ? currentRoomEventEndTime
    //             : Number.POSITIVE_INFINITY,
    //     [currentRoomEvent?.modeName, currentRoomEventEndTime, nextRoomEvent?.modeName]
    // );
    const breakoutRoomClosesAt = nonVideoChatEventStartsAt; // Math.min(breakoutEventEndsAt, nonVideoChatEventStartsAt);

    const startsSoonEl = useMemo(
        () => (
            <RoomTimeAlert
                breakoutRoomClosesAt={breakoutRoomClosesAt}
                broadcastStartsAt={broadcastEventStartsAt}
                eventIsOngoing={!!currentRoomEvent}
                showDefaultVideoChatRoom={showDefaultVideoChatRoom}
                shuffleEndsAt={shuffleRoomEndsAt}
                externalEventStartsAt={externalEventStartsAt}
                externalEventName={maybeExternalEventUrl?.name}
            />
        ),
        [
            breakoutRoomClosesAt,
            broadcastEventStartsAt,
            currentRoomEvent,
            showDefaultVideoChatRoom,
            shuffleRoomEndsAt,
            externalEventStartsAt,
            maybeExternalEventUrl?.name,
        ]
    );

    const playerEl = useMemo(() => {
        const currentEventIsVideoPlayer = currentRoomEvent?.modeName === Schedule_Mode_Enum.VideoPlayer;
        const shouldShowLivePlayer =
            !currentEventModeIsNone &&
            (!showDefaultVideoChatRoom || withinStreamLatencySinceBroadcastEvent) &&
            withinThreeMinutesOfBroadcastEvent;

        return !showBackstage ? (
            currentEventIsVideoPlayer || (selectedVideoElementId && !currentRoomEvent) ? (
                <ErrorBoundary FallbackComponent={AppError}>
                    <Box pos="relative" ref={videoPlayerRef}>
                        {selectedVideoElementId ? (
                            <Suspense fallback={<CenteredSpinner caller="Room.tsx:644" />}>
                                <VideoPlayer elementId={selectedVideoElementId} />
                            </Suspense>
                        ) : (
                            <Center>
                                <AspectRatio
                                    w="min(100%, 90vh * (16 / 9))"
                                    maxW="100%"
                                    ratio={16 / 9}
                                    border="3px solid"
                                    borderColor="gray.400"
                                    borderRadius="lg"
                                >
                                    <VStack>
                                        <Text fontSize="2xl">Select a video below</Text>
                                        <FAIcon
                                            icon="hand-point-down"
                                            aria-hidden="true"
                                            iconStyle="r"
                                            fontSize="6xl"
                                        />
                                    </VStack>
                                </AspectRatio>
                            </Center>
                        )}
                        <EmojiFloatContainer chatId={roomDetails.chatId ?? ""} />
                    </Box>
                </ErrorBoundary>
            ) : shouldShowLivePlayer && hlsUri ? (
                <Box pos="relative">
                    <VideoAspectWrapper maxHeight={mainPaneHeight} maxWidth={mainPaneWidth}>
                        {(onAspectRatioChange) => (
                            <ErrorBoundary FallbackComponent={AppError}>
                                <Suspense fallback={<CenteredSpinner caller="Room:678" />}>
                                    <HlsPlayer
                                        roomId={roomDetails.id}
                                        canPlay={withinThreeMinutesOfBroadcastEvent || !!currentRoomEvent}
                                        hlsUri={hlsUri}
                                        onAspectRatioChange={onAspectRatioChange}
                                        expectLivestream={secondsUntilBroadcastEvent < 10}
                                    />
                                    <EmojiFloatContainer chatId={roomDetails.chatId ?? ""} />
                                </Suspense>
                            </ErrorBoundary>
                        )}
                    </VideoAspectWrapper>
                </Box>
            ) : undefined
        ) : undefined;
    }, [
        currentRoomEvent,
        currentEventModeIsNone,
        showDefaultVideoChatRoom,
        withinStreamLatencySinceBroadcastEvent,
        withinThreeMinutesOfBroadcastEvent,
        showBackstage,
        selectedVideoElementId,
        roomDetails.chatId,
        roomDetails.id,
        hlsUri,
        mainPaneHeight,
        mainPaneWidth,
        secondsUntilBroadcastEvent,
    ]);

    const canControlRecordingAs = useMemo(() => {
        const reasons: RecordingControlRoles = [];
        if (currentRegistrant.conferenceRole === Registrant_RegistrantRole_Enum.Organizer) {
            reasons.push({ role: RecordingControlRole.ConferenceOrganizer });
        }
        const subconferenceMemberships = currentRegistrant.subconferenceMemberships.filter(
            (x) =>
                x.subconferenceId === roomDetails.subconferenceId && x.role === Registrant_RegistrantRole_Enum.Organizer
        );
        if (roomDetails.subconferenceId && subconferenceMemberships.length) {
            reasons.push({
                role: RecordingControlRole.SubconferenceOrganizer,
                subconferenceId: subconferenceMemberships[0].subconferenceId,
            });
        }
        if (
            roomDetails.roomMemberships.some((membership) => membership.personRoleName === Room_PersonRole_Enum.Admin)
        ) {
            reasons.push({ role: RecordingControlRole.RoomAdmin });
        }
        if (currentRoomEvent) {
            if (
                currentRoomEvent.eventPeople.some(
                    (person) =>
                        person.person?.registrantId === currentRegistrant.id &&
                        person.roleName !== Schedule_EventProgramPersonRole_Enum.Participant
                ) ||
                currentRoomEvent.presentations.some((x) =>
                    x.eventPeople.some(
                        (person) =>
                            person.person?.registrantId === currentRegistrant.id &&
                            person.roleName !== Schedule_EventProgramPersonRole_Enum.Participant
                    )
                )
            ) {
                reasons.push({ role: RecordingControlRole.EventPerson });
            }
        } else if (
            roomDetails.item?.selfPeople.some(
                (itemPerson) =>
                    itemPerson.roleName.toUpperCase() === "AUTHOR" ||
                    itemPerson.roleName.toUpperCase() === "PRESENTER" ||
                    itemPerson.roleName.toUpperCase() === "CHAIR" ||
                    itemPerson.roleName.toUpperCase() === "SESSION ORGANIZER" ||
                    itemPerson.roleName.toUpperCase() === "ORGANIZER"
            )
        ) {
            reasons.push({ role: RecordingControlRole.ItemPerson });
        }
        return reasons;
    }, [
        currentRegistrant.conferenceRole,
        currentRegistrant.id,
        currentRegistrant.subconferenceMemberships,
        currentRoomEvent,
        roomDetails.item?.selfPeople,
        roomDetails.roomMemberships,
        roomDetails.subconferenceId,
    ]);

    const vonage = useVonageGlobalState();
    const [connected, setConnected] = useState<boolean>(vonage.IsConnected.value);
    useEvent(vonage, "session-connected", setConnected);

    return (
        <>
            <VStack alignItems="stretch" flexGrow={1} w="100%" spacing={0}>
                <Flex
                    flexGrow={2.5}
                    flexDir="column"
                    textAlign="left"
                    alignItems="stretch"
                    minW="100%"
                    maxW="100%"
                    transition="height 1s ease"
                    h={
                        showDefaultVideoChatRoom && !showBackstage && connected
                            ? "calc(100vh - (6ex + 6px))"
                            : "undefined"
                    }
                >
                    {controlBarEl}

                    {!showBackstage ? (
                        <>
                            {startsSoonEl}
                            {isPresenterOfUpcomingEvent ? (
                                <UpcomingBackstageBanner event={isPresenterOfUpcomingEvent} />
                            ) : undefined}
                            {maybeExternalEventUrl && currentRoomEvent?.modeName === Schedule_Mode_Enum.External ? (
                                <JoinExternalEventButton externalEventUrl={maybeExternalEventUrl} />
                            ) : maybeExternalEventUrl &&
                              nextRoomEvent?.modeName === Schedule_Mode_Enum.External &&
                              externalEventStartsAt - now5s < 20 * 60 * 1000 &&
                              !currentRoomEvent ? (
                                <JoinExternalEventButton
                                    externalEventUrl={maybeExternalEventUrl}
                                    scheduledStartTime={externalEventStartsAt}
                                />
                            ) : undefined}

                            <Box
                                // flexDirection="column"
                                // justifyContent="center"
                                bgColor={showDefaultVideoChatRoom ? bgColour : "none"}
                                zIndex={2}
                                flexGrow={1}
                            >
                                <VideoChatRoom
                                    defaultVideoBackendName={defaultVideoBackend}
                                    roomDetails={roomDetails}
                                    enable={showDefaultVideoChatRoom}
                                    eventId={
                                        currentRoomEvent?.id ??
                                        (nextRoomEvent && nextRoomEvent.modeName === Schedule_Mode_Enum.VideoChat
                                            ? nextRoomEvent.id
                                            : undefined)
                                    }
                                    eventIsFuture={!currentRoomEvent}
                                    canControlRecordingAs={canControlRecordingAs}
                                />
                            </Box>
                        </>
                    ) : (
                        backStageEl
                    )}
                </Flex>

                {playerEl ??
                    (!showDefaultVideoChatRoom && roomDetails.isStreamingProgramRoom && !showBackstage ? (
                        <Text h="100%" p={4} fontSize="xl">
                            There is not currently a live event in this room. The live-stream video will appear here
                            when the next event starts.
                        </Text>
                    ) : undefined)}

                {!showBackstage ? (
                    <>
                        <chakra.div ref={scrollRef} />
                        <StreamTextCaptions streamTextEventId={currentRoomEvent?.streamTextEventId} />
                        {contentEl}
                    </>
                ) : undefined}
            </VStack>

            <RoomContinuationChoices
                currentRoomEvent={currentRoomEvent}
                nextRoomEvent={nextRoomEvent}
                roomDetails={roomDetails}
                showBackstage={showBackstage}
                currentRegistrantId={currentRegistrant.id}
                currentBackstageEventId={backstageSelectedEventId}
                moveToNextBackstage={moveToNextBackstage}
            />
        </>
    );
}
