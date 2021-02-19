import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    Flex,
    HStack,
    useColorModeValue,
    useDisclosure,
} from "@chakra-ui/react";
import React from "react";
import { useHistory } from "react-router-dom";
import { AttendeeFieldsFragment, RoomListRoomDetailsFragment, useGetAllRoomsQuery } from "../../generated/graphql";
import { LinkButton } from "../Chakra/LinkButton";
import { CreateRoomModal } from "../Conference/Attend/Room/CreateRoomModal";
import { RoomList } from "../Conference/Attend/Room/RoomList";
import { useConference } from "../Conference/useConference";
import ApolloQueryWrapper from "../GQL/ApolloQueryWrapper";
import { FAIcon } from "../Icons/FAIcon";
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

    const { isOpen: isCreateRoomOpen, onClose: onCreateRoomClose, onOpen: onCreateRoomOpen } = useDisclosure();
    const history = useHistory();

    const blueButtonColors = useColorModeValue("bluebuttonlight", "bluebuttondark");
    const greenButtonColors = useColorModeValue("greenbuttonlight", "greenbuttondark");

    return (
        <>
            <AccordionPanel pb={4} px={"3px"}>
                <ApolloQueryWrapper getter={(data) => data.Room} queryResult={result}>
                    {(rooms: readonly RoomListRoomDetailsFragment[]) => (
                        <RoomList rooms={rooms} layout="list" limit={5} />
                    )}
                </ApolloQueryWrapper>
                <HStack justifyContent="center" mt={2}>
                    <Button onClick={onCreateRoomOpen} backgroundColor={greenButtonColors} size="sm">
                        <FAIcon icon="plus-square" iconStyle="s" mr={3} /> New room
                    </Button>
                    <LinkButton to={`/conference/${confSlug}/rooms`} backgroundColor={blueButtonColors} size="sm">
                        View all rooms
                    </LinkButton>
                </HStack>
            </AccordionPanel>
            <CreateRoomModal
                isOpen={isCreateRoomOpen}
                onClose={onCreateRoomClose}
                onCreated={async (id: string) => {
                    // Wait, because Vonage session creation is not instantaneous
                    setTimeout(() => {
                        history.push(`/conference/${confSlug}/room/${id}`);
                    }, 2000);
                }}
            />
        </>
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
                <LeftSidebarConferenceSections_Inner
                    rootUrl={rootUrl}
                    confSlug={confSlug}
                    attendee={attendee}
                    onClose={onClose}
                />
            );
        }
    }
    return <></>;
}
