import {
    Alert,
    AlertIcon,
    Box,
    Grid,
    GridItem,
    Heading,
    SkeletonCircle,
    SkeletonText,
    Text,
    useBreakpointValue,
    useColorModeValue,
    useToken,
} from "@chakra-ui/react";
import type { ContentItemDataBlob, ZoomBlob } from "@clowdr-app/shared-types/build/content";
import * as R from "ramda";
import React, { useMemo, useState } from "react";
import ReactPlayer from "react-player";
import { ContentType_Enum, EventPersonDetailsFragment, RoomDetailsFragment } from "../../../../generated/graphql";
import LinkButton from "../../../Chakra/LinkButton";
import { ContentGroupSummary } from "../Content/ContentGroupSummary";
import { BreakoutVonageRoom } from "./BreakoutVonageRoom";
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
    const stackColumns = useBreakpointValue({ base: true, lg: false });
    const {
        currentRoomEvent,
        nextRoomEvent,
        withinThreeMinutesOfBroadcastEvent,
        secondsUntilBroadcastEvent,
        secondsUntilZoomEvent,
    } = useCurrentRoomEvent(roomDetails);

    const [green100, green700] = useToken("colors", ["green.100", "green.700"]);
    const bgColour = useColorModeValue(green100, green700);

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

    return (
        <Grid
            width="100%"
            gridColumnGap={5}
            gridTemplateColumns={["1fr", "1fr", "1fr 25%"]}
            gridTemplateRows={["min-content 1fr 1fr", "min-content 1fr 1fr", "min-content 1fr"]}
        >
            <GridItem colSpan={[1, 1, 2]}>
                <RoomControlBar roomDetails={roomDetails} onSetBackstage={setBackstage} backstage={backstage} />
            </GridItem>
            <GridItem textAlign="left" overflowY={stackColumns ? "visible" : "auto"} p={2}>
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
                    <LinkButton to={maybeCurrentEventZoomDetails} isExternal={true} colorScheme="green" size="lg">
                        Go to Zoom
                    </LinkButton>
                ) : (
                    <></>
                )}

                {hlsUri && secondsUntilBroadcastEvent < 180 ? (
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
                        <Box textAlign="center">
                            <HandUpButton
                                currentRoomEvent={currentRoomEvent}
                                eventPeople={eventPeople}
                                onGoBackstage={() => setBackstage(true)}
                            />
                        </Box>
                    </Box>
                ) : (
                    <></>
                )}

                {secondsUntilNonBreakoutEvent > 180 ? (
                    <Box display={backstage ? "none" : "block"}>
                        <BreakoutVonageRoom room={roomDetails} />
                    </Box>
                ) : (
                    <></>
                )}

                <Heading as="h2" textAlign="left" mt={5}>
                    {roomDetails.name}
                </Heading>

                {currentRoomEvent ? (
                    <>
                        <Heading as="h3" textAlign="left" size="md" mt={5}>
                            Current event
                        </Heading>
                        <Text>{currentRoomEvent.name}</Text>
                        {currentRoomEvent?.contentGroup ? (
                            <ContentGroupSummary contentGroupData={currentRoomEvent.contentGroup} />
                        ) : (
                            <></>
                        )}
                    </>
                ) : (
                    <></>
                )}
                {nextRoomEvent ? (
                    <Box backgroundColor={bgColour} borderRadius={5} px={5} py={3} my={5}>
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
            </GridItem>
            <GridItem border="1px solid white" p={5}>
                <SkeletonCircle size="20" />
                <SkeletonText mt={8} noOfLines={5} spacing={5} />
            </GridItem>
        </Grid>
    );
}
