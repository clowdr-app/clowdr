import { gql } from "@apollo/client";
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Heading,
    HStack,
    Spinner,
    Text,
    useColorModeValue,
    useToast,
    VStack,
} from "@chakra-ui/react";
import type { ContentItemDataBlob, ZoomBlob } from "@clowdr-app/shared-types/build/content";
import { formatRelative } from "date-fns";
import * as R from "ramda";
import React, { useEffect, useMemo, useState } from "react";
import ReactPlayer from "react-player";
import { Redirect, useHistory } from "react-router-dom";
import {
    ContentGroupType_Enum,
    RoomMode_Enum,
    RoomPage_RoomDetailsFragment,
    RoomPrivacy_Enum,
    Room_CurrentEventSummaryFragment,
    Room_EventSummaryFragment,
    useRoomBackstage_GetEventBreakoutRoomQuery,
    useRoom_GetCurrentEventQuery,
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
    query Room_GetCurrentEvent($currentEventId: uuid!) {
        Event_by_pk(id: $currentEventId) {
            ...Room_CurrentEventSummary
        }
    }

    fragment Room_CurrentEventSummary on Event {
        id
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

    const [currentEventData, setCurrentEventData] = useState<Room_CurrentEventSummaryFragment | null>(null);
    const { refetch: refetchCurrentEventData } = useRoom_GetCurrentEventQuery({
        skip: true,
        fetchPolicy: "network-only",
    });

    useEffect(() => {
        async function fn() {
            if (currentRoomEvent?.id) {
                try {
                    const { data } = await refetchCurrentEventData({
                        currentEventId: currentRoomEvent.id,
                    });

                    if (data) {
                        setCurrentEventData(data.Event_by_pk ?? null);
                    }
                } catch (e) {
                    console.error("Could not fetch current event data");
                }
            } else {
                setCurrentEventData(null);
            }
        }
        fn();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRoomEvent?.id]);

    const maybeCurrentEventZoomDetails = useMemo(() => {
        try {
            const zoomItems = currentEventData?.contentGroup?.contentItems;

            if (!zoomItems || zoomItems.length < 1) {
                return undefined;
            }

            const versions = zoomItems[0].data as ContentItemDataBlob;

            return (R.last(versions)?.data as ZoomBlob).url;
        } catch (e) {
            console.error("Error finding current event Zoom details", e);
            return undefined;
        }
    }, [currentEventData?.contentGroup?.contentItems]);

    const currentAttendee = useCurrentAttendee();
    // Used to allow the user to explicitly select to watch the stream rather
    // than entering the backstage area
    const [watchStreamForEventId, setWatchStreamForEventId] = useState<string | null>(null);
    const showDefaultBreakoutRoom =
        roomEvents.length === 0 || currentRoomEvent?.intendedRoomModeName === RoomMode_Enum.Breakout;
    const hasBackstage = !!hlsUri;
    const isPresenterOfCurrentEvent =
        currentRoomEvent !== null &&
        currentRoomEvent.eventPeople.some((person) => person.attendeeId === currentAttendee.id);
    const isPresenterOfNextEvent =
        nextRoomEvent !== null && nextRoomEvent.eventPeople.some((person) => person.attendeeId === currentAttendee.id);
    const shouldBeBackstage =
        isPresenterOfCurrentEvent || (withinThreeMinutesOfBroadcastEvent && isPresenterOfNextEvent);
    const showBackstage =
        hasBackstage &&
        shouldBeBackstage &&
        watchStreamForEventId !== currentRoomEvent?.id &&
        watchStreamForEventId !== nextRoomEvent?.id;

    const controlBarEl = useMemo(
        () =>
            !showBackstage && roomDetails.roomPrivacyName !== RoomPrivacy_Enum.Public ? (
                <RoomControlBar roomDetails={roomDetails} />
            ) : undefined,
        [roomDetails, showBackstage]
    );

    const roomEventsForCurrentAttendde = useMemo(
        () =>
            roomEvents.filter((event) => event.eventPeople.some((person) => person.attendeeId === currentAttendee.id)),
        [currentAttendee.id, roomEvents]
    );
    const backStageEl = useMemo(
        () => (
            <RoomBackstage
                showBackstage={showBackstage}
                roomName={roomDetails.name}
                roomEvents={roomEventsForCurrentAttendde}
                currentRoomEventId={currentRoomEvent?.id}
                setWatchStreamForEventId={setWatchStreamForEventId}
            />
        ),
        [currentRoomEvent?.id, roomDetails.name, roomEventsForCurrentAttendde, showBackstage]
    );

    const muteStream = shouldBeBackstage;
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
                                hlsOptions: {},
                            },
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

    const contentEl = useMemo(
        () => (
            <Box flexGrow={1}>
                <RoomTitle roomDetails={roomDetails} />

                {currentRoomEvent ? (
                    <Box backgroundColor={bgColour} borderRadius={5} px={5} py={3} my={5}>
                        <Text>Started {formatRelative(Date.parse(currentRoomEvent.startTime), now)}</Text>
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
                        <Text>Starts {formatRelative(Date.parse(nextRoomEvent.startTime), now)}</Text>
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
        [bgColour, currentRoomEvent, nextBgColour, nextRoomEvent, now, roomDetails, roomEvents.length]
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
    const { refetch: refetchBreakout } = useRoomBackstage_GetEventBreakoutRoomQuery({
        skip: true,
        fetchPolicy: "network-only",
    });
    const history = useHistory();
    useEffect(() => {
        async function fn() {
            try {
                if (
                    !showBackstage &&
                    existingCurrentRoomEvent &&
                    (existingCurrentRoomEvent.intendedRoomModeName === RoomMode_Enum.Presentation ||
                        existingCurrentRoomEvent.intendedRoomModeName === RoomMode_Enum.QAndA) &&
                    existingCurrentRoomEvent.id !== currentRoomEvent?.id
                ) {
                    try {
                        const breakoutRoom = await refetchBreakout({ originatingEventId: existingCurrentRoomEvent.id });

                        if (!breakoutRoom.data || !breakoutRoom.data.Room || breakoutRoom.data.Room.length < 1) {
                            throw new Error("No matching room found");
                        }

                        toast({
                            status: "info",
                            duration: 15000,
                            isClosable: true,
                            position: "bottom-right",
                            title: "Spinoff room created",
                            description: (
                                <VStack alignItems="flex-start">
                                    <Text>You can continue the discussion asynchronously in a spinoff room.</Text>
                                    <Button
                                        onClick={() =>
                                            history.push(
                                                `/conference/${conference.slug}/room/${breakoutRoom.data.Room[0].id}`
                                            )
                                        }
                                        colorScheme="green"
                                    >
                                        Join the spinoff room
                                    </Button>
                                </VStack>
                            ),
                        });
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

                {secondsUntilZoomEvent > 0 && secondsUntilZoomEvent < 180 ? (
                    <Alert status="info">
                        <AlertIcon />
                        Event starting in {Math.round(secondsUntilZoomEvent)} seconds
                    </Alert>
                ) : (
                    <></>
                )}

                {maybeCurrentEventZoomDetails ? (
                    <ExternalLinkButton
                        to={maybeCurrentEventZoomDetails}
                        isExternal={true}
                        colorScheme="green"
                        size="lg"
                    >
                        Go to Zoom ({currentRoomEvent?.name})
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
