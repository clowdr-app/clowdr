import {
    Grid,
    GridItem,
    Heading,
    SkeletonCircle,
    SkeletonText,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Tag,
    Text,
    useBreakpointValue,
    useColorModeValue,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import ReactPlayer from "react-player";
import { RoomDetailsFragment, useUserEventRolesSubscription } from "../../../../generated/graphql";
import useUserId from "../../../Auth/useUserId";
import { VonageRoomStateProvider } from "../../../Vonage/useVonageRoom";
import { ContentGroupSummary } from "../Content/ContentGroupSummary";
import { BreakoutVonageRoom } from "./BreakoutVonageRoom";
import { EventVonageRoom } from "./Event/EventVonageRoom";
import { RoomControlBar } from "./RoomControlBar";
import { useCurrentRoomEvent } from "./useCurrentRoomEvent";

export function Room({ roomDetails }: { roomDetails: RoomDetailsFragment }): JSX.Element {
    const backgroundColor = useColorModeValue("gray.50", "gray.900");
    const stackColumns = useBreakpointValue({ base: true, lg: false });
    const { currentRoomEvent, withinThreeMinutesOfEvent, nextRoomEvent } = useCurrentRoomEvent(roomDetails);
    const userId = useUserId();

    const { data: currentEventRolesData } = useUserEventRolesSubscription({
        variables: {
            eventId: currentRoomEvent?.id,
            userId: userId ?? "",
        },
    });

    const hlsUri = useMemo(() => {
        if (!roomDetails.mediaLiveChannel) {
            return null;
        }
        const finalUri = new URL(roomDetails.mediaLiveChannel.endpointUri);
        finalUri.hostname = roomDetails.mediaLiveChannel.cloudFrontDomain;
        return finalUri.toString();
    }, [roomDetails.mediaLiveChannel]);

    const canJoinCurrentEventRoom = useMemo(() => {
        return (
            currentEventRolesData?.Event_by_pk?.eventPeople &&
            currentEventRolesData?.Event_by_pk?.eventPeople.length > 0
        );
    }, [currentEventRolesData?.Event_by_pk?.eventPeople]);

    const canJoinNextEventRoom = useMemo(() => {
        return !!nextRoomEvent?.eventPeople.find((person) => person.attendee?.userId === userId);
    }, [nextRoomEvent?.eventPeople, userId]);

    return (
        <Grid
            width="100%"
            gridColumnGap={5}
            gridTemplateColumns={["1fr", "1fr", "1fr 25%"]}
            gridTemplateRows={["min-content 1fr 1fr", "min-content 1fr 1fr", "min-content 1fr"]}
        >
            <GridItem colSpan={[1, 1, 2]}>
                <RoomControlBar roomDetails={roomDetails} />
            </GridItem>
            <GridItem textAlign="left" overflowY={stackColumns ? "visible" : "auto"} p={2}>
                <Tabs width="100%" background={backgroundColor}>
                    <TabList>
                        {hlsUri && withinThreeMinutesOfEvent && <Tab disabled={!withinThreeMinutesOfEvent}>Event</Tab>}
                        <Tab>Breakout Room</Tab>
                        {canJoinCurrentEventRoom && currentRoomEvent && (
                            <Tab>
                                Event Room ({currentRoomEvent.name}){" "}
                                <Tag ml={2} colorScheme="green">
                                    Now
                                </Tag>
                            </Tab>
                        )}
                        {canJoinNextEventRoom && nextRoomEvent && (
                            <Tab>
                                Event Room ({nextRoomEvent.name}) <Tag ml={2}>Next</Tag>
                            </Tab>
                        )}
                    </TabList>
                    <TabPanels>
                        {hlsUri && withinThreeMinutesOfEvent && (
                            <TabPanel>
                                <ReactPlayer
                                    width="100%"
                                    height="auto"
                                    url={hlsUri}
                                    config={{
                                        file: {
                                            hlsOptions: {},
                                        },
                                    }}
                                    playing={withinThreeMinutesOfEvent || !!currentRoomEvent}
                                    controls={true}
                                />
                            </TabPanel>
                        )}
                        <TabPanel>
                            <VonageRoomStateProvider>
                                <BreakoutVonageRoom room={roomDetails} />
                            </VonageRoomStateProvider>
                        </TabPanel>
                        {canJoinCurrentEventRoom && currentRoomEvent && (
                            <TabPanel>
                                <VonageRoomStateProvider>
                                    <EventVonageRoom event={currentRoomEvent} />
                                </VonageRoomStateProvider>
                            </TabPanel>
                        )}
                        {canJoinNextEventRoom && nextRoomEvent && (
                            <TabPanel>
                                <VonageRoomStateProvider>
                                    <EventVonageRoom event={nextRoomEvent} />
                                </VonageRoomStateProvider>
                            </TabPanel>
                        )}
                    </TabPanels>
                </Tabs>
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
            </GridItem>
            <GridItem border="1px solid white" p={5}>
                <SkeletonCircle size="20" />
                <SkeletonText mt={8} noOfLines={5} spacing={5} />
            </GridItem>
        </Grid>
    );
}
