import { Alert, AlertIcon, Box, Heading, HStack, Text, useColorModeValue, useToken, VStack } from "@chakra-ui/react";
import type { ContentItemDataBlob, ZoomBlob } from "@clowdr-app/shared-types/build/content";
import * as R from "ramda";
import React, { useMemo, useState } from "react";
import ReactPlayer from "react-player";
import {
    ContentType_Enum,
    EventPersonDetailsFragment,
    RoomDetailsFragment,
    RoomMode_Enum,
} from "../../../../generated/graphql";
import { ExternalLinkButton } from "../../../Chakra/LinkButton";
import { Chat } from "../../../Chat/Chat";
import type { ChatSources } from "../../../Chat/Configuration";
import { ContentGroupSummary } from "../Content/ContentGroupSummary";
import { BreakoutVonageRoom } from "./BreakoutVonageRoom";
import { EventEndControls } from "./EventEndControls";
import { HandUpButton } from "./HandUpButton";
import { RoomBackstage } from "./RoomBackstage";
import { RoomControlBar } from "./RoomControlBar";
import { useCurrentRoomEvent } from "./useCurrentRoomEvent";

export function Room({
    roomDetails,
    eventPeople,
}: {
    roomDetails: RoomDetailsFragment;
    eventPeople: readonly EventPersonDetailsFragment[];
}): JSX.Element {
    const {
        currentRoomEvent,
        nextRoomEvent,
        withinThreeMinutesOfBroadcastEvent,
        secondsUntilBroadcastEvent,
        secondsUntilZoomEvent,
    } = useCurrentRoomEvent(roomDetails);

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

    const maybeCurrentEventZoomDetails = useMemo(() => {
        const zoomItem = currentRoomEvent?.contentGroup?.contentItems.find(
            (contentItem) => contentItem.contentTypeName === ContentType_Enum.Zoom
        );

        if (!zoomItem) {
            return undefined;
        }

        const versions = zoomItem.data as ContentItemDataBlob;

        return (R.last(versions)?.data as ZoomBlob).url;
    }, [currentRoomEvent?.contentGroup?.contentItems]);

    const chatSources = useMemo((): ChatSources | undefined => {
        if (currentRoomEvent?.contentGroup) {
            return {
                chatIdL: roomDetails.chatId ?? undefined,
                chatIdR: currentRoomEvent?.contentGroup?.chatId ?? undefined,
                chatLabelL: "Room",
                chatLabelR: "Paper",
                defaultSelected: "L",
            };
        } else if (roomDetails.chatId) {
            return {
                chatId: roomDetails.chatId,
                chatLabel: "Room",
            };
        } else {
            return undefined;
        }
    }, [currentRoomEvent?.contentGroup, roomDetails.chatId]);

    return (
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
                <RoomControlBar
                    roomDetails={roomDetails}
                    onSetBackstage={setBackstage}
                    backstage={backstage}
                    hasBackstage={!!hlsUri}
                    breakoutRoomEnabled={
                        secondsUntilNonBreakoutEvent > 180 && !withinThreeMinutesOfBroadcastEvent && !backstage
                    }
                />
                <RoomBackstage backstage={backstage} roomDetails={roomDetails} eventPeople={eventPeople} />

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

                {hlsUri && withinThreeMinutesOfBroadcastEvent ? (
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
                                (withinThreeMinutesOfBroadcastEvent || !!currentRoomEvent) &&
                                !backstage &&
                                intendPlayStream
                            }
                            controls={true}
                            onPause={() => setIntendPlayStream(false)}
                            onPlay={() => setIntendPlayStream(true)}
                        />
                    </Box>
                ) : (
                    <></>
                )}

                {secondsUntilNonBreakoutEvent > 180 && !withinThreeMinutesOfBroadcastEvent && !backstage ? (
                    <Box display={backstage ? "none" : "block"} bgColor={bgColour} p={2} pt={5} borderRadius="md">
                        <BreakoutVonageRoom room={roomDetails} />
                    </Box>
                ) : (
                    <></>
                )}

                <HStack alignItems="flex-start">
                    <Box flexGrow={1}>
                        <Heading as="h2" textAlign="left" mt={5} ml={5}>
                            {roomDetails.name}
                        </Heading>

                        {currentRoomEvent ? (
                            <Box backgroundColor={bgColour} borderRadius={5} px={5} py={3} my={5}>
                                <Heading as="h3" textAlign="left" size="md" mt={5}>
                                    Current event
                                </Heading>
                                <Text>{currentRoomEvent.name}</Text>
                                {currentRoomEvent?.contentGroup ? (
                                    <ContentGroupSummary contentGroupData={currentRoomEvent.contentGroup} />
                                ) : (
                                    <></>
                                )}
                            </Box>
                        ) : (
                            <></>
                        )}
                        {nextRoomEvent ? (
                            <Box backgroundColor={nextBgColour} borderRadius={5} px={5} py={3} my={5}>
                                <Heading as="h3" textAlign="left" size="md" mb={2}>
                                    Up next
                                </Heading>
                                <Text>{nextRoomEvent.name}</Text>
                                {nextRoomEvent?.contentGroup ? (
                                    <ContentGroupSummary contentGroupData={nextRoomEvent.contentGroup} />
                                ) : (
                                    <></>
                                )}
                            </Box>
                        ) : (
                            <></>
                        )}

                        {!currentRoomEvent && !nextRoomEvent ? (
                            <Text p={5}>No current event in this room.</Text>
                        ) : (
                            <></>
                        )}
                    </Box>
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
            <VStack
                flexGrow={1}
                flexBasis={0}
                minW={["100%", "100%", "100%", "300px"]}
                maxHeight={["80vh", "80vh", "80vh", "850px"]}
            >
                {chatSources ? (
                    <Chat sources={{ ...chatSources }} flexBasis={0} flexGrow={1} mr={4} />
                ) : (
                    <>No chat found for this room.</>
                )}

                <Box display={currentEventIsLive ? "block" : "none"}>
                    <EventEndControls currentRoomEvent={currentRoomEvent} />
                </Box>
            </VStack>
        </HStack>
    );
}
