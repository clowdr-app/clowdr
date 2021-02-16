import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, Box, Flex } from "@chakra-ui/react";
import React from "react";
import { AttendeeFieldsFragment, RoomListRoomDetailsFragment, useGetAllRoomsQuery } from "../../generated/graphql";
import { LinkButton } from "../Chakra/LinkButton";
import { RoomList } from "../Conference/Attend/Room/RoomList";
import AttendeesContextProvider from "../Conference/AttendeesContext";
import ConferenceProvider, { useConference } from "../Conference/useConference";
import ApolloQueryWrapper from "../GQL/ApolloQueryWrapper";
import { FAIcon } from "../Icons/FAIcon";
import PresenceCountProvider from "../Presence/PresenceCountProvider";
import RoomParticipantsProvider from "../Room/RoomParticipantsProvider";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import useLazyRenderAndRetain from "./LazyRenderAndRetain";
import { MainMenuProgram } from "./MainMenuProgram";
import { MainMenuSponsors } from "./MainMenuSponsors";

function RoomsPanel({ confSlug }: { confSlug: string }): JSX.Element {
    const conference = useConference();

    const result = useGetAllRoomsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    return (
        <AccordionPanel pb={4} px={"3px"}>
            <ApolloQueryWrapper getter={(data) => data.Room} queryResult={result}>
                {(rooms: readonly RoomListRoomDetailsFragment[]) => <RoomList rooms={rooms} layout="list" limit={5} />}
            </ApolloQueryWrapper>
            <LinkButton
                to={`/conference/${confSlug}/rooms`}
                colorScheme="green"
                linkProps={{ mt: 4, width: "100%" }}
                w="100%"
            >
                View all rooms
            </LinkButton>
        </AccordionPanel>
    );
}

function LazyRoomsPanel({ isExpanded, confSlug }: { isExpanded: boolean; confSlug: string }): JSX.Element {
    return useLazyRenderAndRetain(() => <RoomsPanel confSlug={confSlug} />, isExpanded);
}

function SchedulePanel(): JSX.Element {
    return (
        <AccordionPanel pb={4} px={"3px"}>
            <MainMenuProgram />
        </AccordionPanel>
    );
}

function LazySchedulePanel({ isExpanded }: { isExpanded: boolean }): JSX.Element {
    return useLazyRenderAndRetain(() => <SchedulePanel />, isExpanded);
}

function SponsorsPanel(): JSX.Element {
    return (
        <AccordionPanel pb={4} px={"3px"}>
            <MainMenuSponsors />
        </AccordionPanel>
    );
}

function LazySponsorsPanel({ isExpanded }: { isExpanded: boolean }): JSX.Element {
    return useLazyRenderAndRetain(() => <SponsorsPanel />, isExpanded);
}

export function LeftSidebarConferenceSections_Inner({
    confSlug,
    attendee,
    onClose,
}: {
    rootUrl: string;
    confSlug: string;
    attendee: AttendeeFieldsFragment;
    onClose: () => void;
}): JSX.Element {
    return (
        <>
            <Flex my={4} mx={4} justifyContent="space-around" alignItems="center" flexWrap="wrap" gridGap={2}>
                <LinkButton
                    linkProps={{ flexBasis: "40%", flexGrow: 0, flexShrink: [0, 1] }}
                    size="sm"
                    to={`/conference/${confSlug}/schedule`}
                    width="100%"
                >
                    <FAIcon icon="calendar" iconStyle="r" mr={3} />
                    Schedule
                </LinkButton>
                <LinkButton
                    linkProps={{ flexBasis: "40%", flexGrow: 0, flexShrink: [0, 1] }}
                    size="sm"
                    to={`/conference/${confSlug}/attendees`}
                    width="100%"
                >
                    <FAIcon icon="cat" iconStyle="s" mr={3} />
                    Attendees
                </LinkButton>
                <LinkButton
                    linkProps={{ flexBasis: "40%", flexGrow: 0, flexShrink: [0, 1] }}
                    size="sm"
                    to={`/conference/${confSlug}/rooms`}
                    width="100%"
                >
                    <FAIcon icon="mug-hot" iconStyle="s" mr={3} />
                    Rooms
                </LinkButton>
                <LinkButton
                    linkProps={{ flexBasis: "40%", flexGrow: 0, flexShrink: [0, 1] }}
                    size="sm"
                    to={`/conference/${confSlug}/shuffle`}
                    width="100%"
                >
                    <FAIcon icon="mug-hot" iconStyle="s" mr={3} />
                    Shuffle
                </LinkButton>
            </Flex>
            <Accordion defaultIndex={[0, 3]} allowMultiple allowToggle>
                <AccordionItem>
                    {({ isExpanded }) => (
                        <>
                            <AccordionButton>
                                <Box flex="1" textAlign="left">
                                    Rooms
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <LazyRoomsPanel isExpanded={isExpanded} confSlug={confSlug} />
                        </>
                    )}
                </AccordionItem>

                <AccordionItem>
                    {({ isExpanded }) => (
                        <>
                            <AccordionButton>
                                <Box flex="1" textAlign="left">
                                    Schedule
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <LazySchedulePanel isExpanded={isExpanded} />
                        </>
                    )}
                </AccordionItem>

                <AccordionItem>
                    {({ isExpanded }) => (
                        <>
                            <AccordionButton>
                                <Box flex="1" textAlign="left">
                                    Sponsors
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <LazySponsorsPanel isExpanded={isExpanded} />
                        </>
                    )}
                </AccordionItem>
            </Accordion>
        </>
    );
}

export default function LeftSidebarConferenceSections({
    rootUrl,
    confSlug,
    onClose,
}: {
    rootUrl: string;
    confSlug: string;
    onClose: () => void;
}): JSX.Element {
    const user = useMaybeCurrentUser();
    if (user.user && user.user.attendees.length > 0) {
        const attendee = user.user.attendees.find((x) => x.conference.slug === confSlug);
        if (attendee) {
            return (
                <ConferenceProvider confSlug={confSlug}>
                    <PresenceCountProvider>
                        <AttendeesContextProvider>
                            <RoomParticipantsProvider>
                                <LeftSidebarConferenceSections_Inner
                                    rootUrl={rootUrl}
                                    confSlug={confSlug}
                                    attendee={attendee}
                                    onClose={onClose}
                                />
                            </RoomParticipantsProvider>
                        </AttendeesContextProvider>
                    </PresenceCountProvider>
                </ConferenceProvider>
            );
        }
    }
    return <></>;
}
