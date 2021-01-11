import { gql } from "@apollo/client";
import {
    Button,
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
    useToast,
} from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import ReactPlayer from "react-player";
import {
    EventPersonDetailsFragment,
    RoomDetailsFragment,
    RoomEventSummaryFragment,
    RoomMode_Enum,
    useMakeEventRoomJoinRequestMutation,
} from "../../../../generated/graphql";
import useCurrentAttendee from "../../useCurrentAttendee";
import { ContentGroupSummary } from "../Content/ContentGroupSummary";
import { BreakoutVonageRoom } from "./BreakoutVonageRoom";
import { RoomBackstage } from "./RoomBackstage";
import { RoomControlBar } from "./RoomControlBar";
import { useCurrentRoomEvent } from "./useCurrentRoomEvent";

gql`
    mutation MakeEventRoomJoinRequest($attendeeId: uuid!, $conferenceId: uuid!, $eventId: uuid!) {
        insert_EventRoomJoinRequest_one(
            object: { attendeeId: $attendeeId, conferenceId: $conferenceId, eventId: $eventId }
        ) {
            id
        }
    }
`;

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
                                <HandUpButton
                                    currentRoomEvent={currentRoomEvent}
                                    eventPeople={eventPeople}
                                    onGoBackstage={() => setBackstage(true)}
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

function HandUpButton({
    currentRoomEvent,
    eventPeople,
    onGoBackstage,
}: {
    currentRoomEvent: RoomEventSummaryFragment | null;
    eventPeople: readonly EventPersonDetailsFragment[];
    onGoBackstage: () => void;
}): JSX.Element {
    const [loading, setLoading] = useState<boolean>(false);
    const attendee = useCurrentAttendee();
    const toast = useToast();

    const [makeEventRoomJoinRequestMutation] = useMakeEventRoomJoinRequestMutation();
    const makeEventRoomJoinRequest = useCallback(async () => {
        setLoading(true);

        try {
            await makeEventRoomJoinRequestMutation({
                variables: {
                    attendeeId: attendee.id,
                    conferenceId: currentRoomEvent?.conferenceId,
                    eventId: currentRoomEvent?.id,
                },
            });
        } catch (e) {
            toast({
                title: "Could not request to join the room",
                status: "error",
            });
        }
        setLoading(false);
    }, [attendee.id, currentRoomEvent?.conferenceId, currentRoomEvent?.id, makeEventRoomJoinRequestMutation, toast]);

    const myEventPeople = useMemo(
        () => eventPeople?.filter((eventPerson) => attendee.id === eventPerson.attendee?.id) ?? [],
        [attendee.id, eventPeople]
    );

    const roomModeName = useMemo(() => {
        switch (currentRoomEvent?.intendedRoomModeName) {
            case undefined:
                return "";
            case RoomMode_Enum.Breakout:
                return "breakout";
            case RoomMode_Enum.Prerecorded:
                return "prerecorded";
            case RoomMode_Enum.QAndA:
                return "Q&A";
            case RoomMode_Enum.Presentation:
                return "presentation";
        }
    }, [currentRoomEvent?.intendedRoomModeName]);

    return currentRoomEvent &&
        [RoomMode_Enum.Presentation, RoomMode_Enum.QAndA].includes(currentRoomEvent.intendedRoomModeName) ? (
        myEventPeople.length > 0 ? (
            <Button mt={5} onClick={onGoBackstage}>
                Go backstage to join {roomModeName} room
            </Button>
        ) : (
            <Button mt={5} isLoading={loading} onClick={makeEventRoomJoinRequest}>
                Request to join {roomModeName} room
            </Button>
        )
    ) : (
        <></>
    );
}
