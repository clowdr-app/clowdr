import { gql } from "@apollo/client";
import { Alert, AlertIcon, Box, Heading, HStack, Text, useColorModeValue, useToast, useToken, VStack } from "@chakra-ui/react";
import type { ContentItemDataBlob, ZoomBlob } from "@clowdr-app/shared-types/build/content";
import { formatRelative } from "date-fns";
import * as R from "ramda";
import React, { useEffect, useMemo, useState } from "react";
import ReactPlayer from "react-player";
import { Redirect } from "react-router-dom";
import {
    ContentGroupType_Enum,
    EventPersonDetailsFragment,
    RoomMode_Enum,
    RoomPage_RoomDetailsFragment,
    useRoom_GetCurrentEventQuery,
} from "../../../../generated/graphql";
import { ExternalLinkButton } from "../../../Chakra/LinkButton";
import { Chat } from "../../../Chat/Chat";
import type { ChatSources } from "../../../Chat/Configuration";
import { useRealTime } from "../../../Generic/useRealTime";
import RoomParticipantsProvider from "../../../Room/RoomParticipantsProvider";
import { useConference } from "../../useConference";
import { ContentGroupSummaryWrapper } from "../Content/ContentGroupSummary";
import { BreakoutVonageRoom } from "./BreakoutVonageRoom";
import { EventEndControls } from "./EventEndControls";
import { HandUpButton } from "./HandUpButton";
import { RoomBackstage } from "./RoomBackstage";
import { RoomControlBar } from "./RoomControlBar";
import { RoomTitle } from "./RoomTitle";
import { RoomSponsorContent } from "./Sponsor/RoomSponsorContent";
import { useCurrentRoomEvent } from "./useCurrentRoomEvent";

gql`
    query Room_GetCurrentEvent($currentEventId: uuid!) {
        Event_by_pk(id: $currentEventId) {
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
    }
`;

function hasShuffleRoomEnded({ startedAt, durationMinutes }: { startedAt: string; durationMinutes: number }): boolean {
    const startedAtMs = Date.parse(startedAt);
    const durationMs = durationMinutes * 60 * 1000;
    const now = Date.now();
    return startedAtMs + durationMs < now;
}

function isShuffleRoomEndingSoon({ startedAt, durationMinutes }: { startedAt: string; durationMinutes: number }, now: number): boolean {
    const startedAtMs = Date.parse(startedAt);
    const durationMs = durationMinutes * 60 * 1000;
    return startedAtMs + durationMs < now + 30000;
}

export function Room({
    roomDetails,
    eventPeople,
}: {
    roomDetails: RoomPage_RoomDetailsFragment;
    eventPeople: readonly EventPersonDetailsFragment[];
}): JSX.Element {
    const {
        currentRoomEvent,
        nextRoomEvent,
        withinThreeMinutesOfBroadcastEvent,
        secondsUntilBroadcastEvent,
        secondsUntilZoomEvent,
    } = useCurrentRoomEvent(roomDetails);

    const now = useRealTime(5000);

    const currentEventIsLive = useMemo(
        () =>
            currentRoomEvent &&
            [RoomMode_Enum.Presentation, RoomMode_Enum.QAndA].includes(currentRoomEvent.intendedRoomModeName),
        [currentRoomEvent]
    );

    const [green100, green700, gray100, gray800] = useToken("colors", [
        "green.100",
        "green.700",
        "gray.100",
        "gray.900",
    ]);
    const nextBgColour = useColorModeValue(green100, green700);
    const bgColour = useColorModeValue(gray100, gray800);

    const hlsUri = useMemo(() => {
        if (!roomDetails.mediaLiveChannel) {
            return null;
        }
        const finalUri = new URL(roomDetails.mediaLiveChannel.endpointUri);
        finalUri.hostname = roomDetails.mediaLiveChannel.cloudFrontDomain;
        return finalUri.toString();
    }, [roomDetails.mediaLiveChannel]);

    const [intendPlayStream, setIntendPlayStream] = useState<boolean>(true);

    const [backstage, setBackstage] = useState<boolean>(false);

    const secondsUntilNonBreakoutEvent = useMemo(() => Math.min(secondsUntilBroadcastEvent, secondsUntilZoomEvent), [
        secondsUntilBroadcastEvent,
        secondsUntilZoomEvent,
    ]);

    const { data: currentEventData } = useRoom_GetCurrentEventQuery({
        variables: {
            currentEventId: currentRoomEvent?.id ?? "00000000-0000-0000-0000-000000000000",
        },
        fetchPolicy: "network-only",
    });

    const maybeCurrentEventZoomDetails = useMemo(() => {
        try {
            const zoomItems = currentEventData?.Event_by_pk?.contentGroup?.contentItems;

            if (!zoomItems || zoomItems.length < 1) {
                return undefined;
            }

            const versions = zoomItems[0].data as ContentItemDataBlob;

            return (R.last(versions)?.data as ZoomBlob).url;
        } catch (e) {
            console.error("Error finding current event Zoom details", e);
            return undefined;
        }
    }, [currentEventData?.Event_by_pk?.contentGroup?.contentItems]);

    const chatSources = useMemo((): ChatSources | undefined => {
        if (currentEventData?.Event_by_pk?.contentGroup) {
            const rightHandTypeName = currentEventData.Event_by_pk.contentGroup?.contentGroupTypeName ?? "PAPER";
            const rightHandLabel = rightHandTypeName[0] + rightHandTypeName.slice(1).toLowerCase();
            return {
                chatIdL: roomDetails.chatId ?? undefined,
                chatIdR: currentEventData.Event_by_pk.contentGroup?.chatId ?? "Unknown chat",
                chatLabelL: "Room",
                chatLabelR: rightHandLabel,
                chatTitleL: roomDetails.name,
                chatTitleR: currentEventData.Event_by_pk.contentGroup?.title ?? "Unknown chat",
                defaultSelected: "L",
            };
        } else if (roomDetails.chatId) {
            return {
                chatId: roomDetails.chatId,
                chatLabel: "Room",
                chatTitle: roomDetails.name,
            };
        } else {
            return undefined;
        }
    }, [currentEventData?.Event_by_pk?.contentGroup, roomDetails.chatId, roomDetails.name]);

    const chatEl = useMemo(
        () =>
            chatSources ? (
                <Chat
                    sources={{ ...chatSources }}
                    flexBasis={0}
                    flexGrow={1}
                    mr={4}
                    maxHeight={["80vh", "80vh", "80vh", "850px"]}
                />
            ) : (
                <>No chat found for this room.</>
            ),
        [chatSources]
    );

    const controlBarEl = useMemo(
        () => (
            <RoomParticipantsProvider roomId={roomDetails.id}>
                <RoomControlBar
                    roomDetails={roomDetails}
                    onSetBackstage={setBackstage}
                    backstage={backstage}
                    hasBackstage={!!hlsUri}
                    breakoutRoomEnabled={
                        secondsUntilNonBreakoutEvent > 180 && !withinThreeMinutesOfBroadcastEvent && !backstage
                    }
                />
            </RoomParticipantsProvider>
        ),
        [backstage, hlsUri, roomDetails, secondsUntilNonBreakoutEvent, withinThreeMinutesOfBroadcastEvent]
    );

    const backStageEl = useMemo(
        () => <RoomBackstage backstage={backstage} roomDetails={roomDetails} eventPeople={eventPeople} />,
        [backstage, eventPeople, roomDetails]
    );

    const playerEl = useMemo(
        () =>
            hlsUri && withinThreeMinutesOfBroadcastEvent ? (
                <Box display={backstage ? "none" : "block"}>
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
                            (withinThreeMinutesOfBroadcastEvent || !!currentRoomEvent) && !backstage && intendPlayStream
                        }
                        controls={true}
                        onPause={() => setIntendPlayStream(false)}
                        onPlay={() => setIntendPlayStream(true)}
                    />
                </Box>
            ) : (
                <></>
            ),
        [backstage, currentRoomEvent, hlsUri, intendPlayStream, withinThreeMinutesOfBroadcastEvent]
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

                {!currentRoomEvent && !nextRoomEvent ? <Text p={5}>No current event in this room.</Text> : <></>}

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
        [bgColour, currentRoomEvent, nextBgColour, nextRoomEvent, now, roomDetails]
    );

    const eventEndControls = useMemo(() => <EventEndControls currentRoomEvent={currentRoomEvent} />, [
        currentRoomEvent,
    ]);

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

    const conference = useConference();
    return roomDetails.shuffleRooms.length > 0 && hasShuffleRoomEnded(roomDetails.shuffleRooms[0]) ? (
        <Redirect
            to={`/conference/${conference.slug}/shuffle${
                !roomDetails.shuffleRooms[0].reshuffleUponEnd ? "/ended" : ""
            }`}
        />
    ) : (
        <HStack width="100%" flexWrap="wrap" alignItems="stretch">
            <VStack
                textAlign="left"
                p={2}
                flexGrow={2.5}
                alignItems="stretch"
                flexBasis={0}
                minW={["100%", "100%", "100%", "700px"]}
                maxW="100%"
            >
                {controlBarEl}
                {backStageEl}

                {secondsUntilNonBreakoutEvent >= 180 && secondsUntilNonBreakoutEvent <= 300 ? (
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

                {secondsUntilBroadcastEvent > 0 && secondsUntilBroadcastEvent < 180 ? (
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

                {playerEl}

                {secondsUntilNonBreakoutEvent > 180 && !withinThreeMinutesOfBroadcastEvent && !backstage ? (
                    <Box display={backstage ? "none" : "block"} bgColor={bgColour} p={2} pt={5} borderRadius="md">
                        {breakoutVonageRoomEl}
                    </Box>
                ) : (
                    <></>
                )}

                <HStack alignItems="flex-start">
                    {contentEl}
                    <Box>
                        {backstage ? (
                            <></>
                        ) : (
                            <HandUpButton
                                currentRoomEvent={currentRoomEvent}
                                eventPeople={eventPeople}
                                onGoBackstage={() => setBackstage(true)}
                            />
                        )}
                    </Box>
                </HStack>
            </VStack>
            <VStack flexGrow={1} flexBasis={0} minW={["100%", "100%", "100%", "300px"]}>
                {chatEl}

                <Box display={currentEventIsLive ? "block" : "none"}>{eventEndControls}</Box>
            </VStack>
        </HStack>
    );
}
