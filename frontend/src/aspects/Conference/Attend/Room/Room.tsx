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
    Text,
    useBreakpointValue,
    useColorModeValue,
} from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import ReactPlayer from "react-player";
import type { EventPersonDetailsFragment, RoomDetailsFragment } from "../../../../generated/graphql";
import { ContentGroupSummary } from "../Content/ContentGroupSummary";
import { BreakoutVonageRoom } from "./BreakoutVonageRoom";
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
    const backgroundColor = useColorModeValue("gray.50", "gray.900");
    const stackColumns = useBreakpointValue({ base: true, lg: false });
    const { currentRoomEvent, withinThreeMinutesOfEvent } = useCurrentRoomEvent(roomDetails);

    const hlsUri = useMemo(() => {
        if (!roomDetails.mediaLiveChannel) {
            return null;
        }
        const finalUri = new URL(roomDetails.mediaLiveChannel.endpointUri);
        finalUri.hostname = roomDetails.mediaLiveChannel.cloudFrontDomain;
        return finalUri.toString();
    }, [roomDetails.mediaLiveChannel]);

    const [intendPlayStream, setIntendPlayStream] = useState<boolean>(true);
    const [currentTab, setCurrentTab] = useState<number>(0);
    const handleTabsChange = useCallback(
        (tabIndex) => {
            setCurrentTab(tabIndex);
        },
        [setCurrentTab]
    );

    const [backstage, setBackstage] = useState<boolean>(false);

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
                <Tabs
                    width="100%"
                    background={backgroundColor}
                    index={currentTab}
                    onChange={handleTabsChange}
                    display={backstage ? "none" : "block"}
                >
                    <TabList>
                        {hlsUri && withinThreeMinutesOfEvent && <Tab disabled={!withinThreeMinutesOfEvent}>Event</Tab>}
                        <Tab>Breakout Room</Tab>
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
                                    playing={
                                        (withinThreeMinutesOfEvent || !!currentRoomEvent) &&
                                        currentTab === 0 &&
                                        intendPlayStream
                                    }
                                    controls={true}
                                    onPause={() => setIntendPlayStream(false)}
                                    onPlay={() => setIntendPlayStream(true)}
                                />
                            </TabPanel>
                        )}
                        <TabPanel>
                            <BreakoutVonageRoom room={roomDetails} />
                        </TabPanel>
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
