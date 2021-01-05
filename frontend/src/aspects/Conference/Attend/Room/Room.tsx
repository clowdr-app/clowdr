import {
    Box,
    Flex,
    Heading,
    SkeletonCircle,
    SkeletonText,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    useBreakpointValue,
    useColorModeValue,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import ReactPlayer from "react-player";
import type { RoomDetailsFragment } from "../../../../generated/graphql";
import useUserId from "../../../Auth/useUserId";
import { VonageRoomStateProvider } from "../../../Vonage/useVonageRoom";
import { ContentGroupSummary } from "../Content/ContentGroupSummary";
import { useCurrentRoomEvent } from "./useCurrentRoomEvent";
import { BreakoutVonageRoom, EventVonageRoom } from "./VonageRoom";

export function Room({ roomDetails }: { roomDetails: RoomDetailsFragment }): JSX.Element {
    const backgroundColor = useColorModeValue("gray.50", "gray.900");
    const stackColumns = useBreakpointValue({ base: true, lg: false });
    const { currentRoomEvent, withinThreeMinutesOfEvent } = useCurrentRoomEvent(roomDetails);
    const userId = useUserId();

    const hlsUri = useMemo(() => {
        if (!roomDetails.mediaLiveChannel) {
            return null;
        }
        const finalUri = new URL(roomDetails.mediaLiveChannel.endpointUri);
        finalUri.hostname = roomDetails.mediaLiveChannel.cloudFrontDomain;
        return finalUri.toString();
    }, [roomDetails.mediaLiveChannel]);

    const canJoinEventRoom = useMemo(() => {
        return !!currentRoomEvent?.eventPeople.find((person) => person.attendee?.userId === userId);
    }, [currentRoomEvent?.eventPeople, userId]);

    return (
        <Flex width="100%" height="100%" gridColumnGap={5} flexWrap={stackColumns ? "wrap" : "nowrap"}>
            <Box textAlign="left" flexGrow={1} overflowY={stackColumns ? "visible" : "auto"} p={2}>
                <Tabs width="100%" background={backgroundColor}>
                    <TabList>
                        {hlsUri && withinThreeMinutesOfEvent && <Tab disabled={!withinThreeMinutesOfEvent}>Event</Tab>}
                        <Tab>Breakout Room</Tab>
                        {canJoinEventRoom && currentRoomEvent && <Tab>Event Room</Tab>}
                    </TabList>
                    <TabPanels>
                        {hlsUri && withinThreeMinutesOfEvent && (
                            <TabPanel width="100%" minH="80vh">
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
                        <TabPanel minHeight="80vh" height="80vh">
                            <VonageRoomStateProvider>
                                <BreakoutVonageRoom room={roomDetails} />
                            </VonageRoomStateProvider>
                        </TabPanel>
                        {canJoinEventRoom && currentRoomEvent && (
                            <TabPanel>
                                <VonageRoomStateProvider>
                                    <EventVonageRoom event={currentRoomEvent} />
                                </VonageRoomStateProvider>
                            </TabPanel>
                        )}
                    </TabPanels>
                </Tabs>
                <Heading as="h2" textAlign="left" mt={5}>
                    {roomDetails.name}
                </Heading>

                {currentRoomEvent?.contentGroup ? (
                    <ContentGroupSummary contentGroupData={currentRoomEvent.contentGroup} />
                ) : (
                    <></>
                )}
            </Box>
            <Box width={stackColumns ? "100%" : "30%"} border="1px solid white" height="100%" p={5}>
                <SkeletonCircle size="20" />
                <SkeletonText mt={8} noOfLines={5} spacing={5} />
            </Box>
        </Flex>
    );
}
