import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    ButtonGroup,
    Flex,
    Heading,
    HStack,
    useDisclosure,
} from "@chakra-ui/react";
import { DateTime } from "luxon";
import React from "react";
import { useHistory } from "react-router-dom";
import {
    AttendeeFieldsFragment,
    RoomListRoomDetailsFragment,
    useGetAllTodaysRoomsQuery,
} from "../../generated/graphql";
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
import { ToggleNavButton } from "./ToggleNavButton";

function RoomsPanel({ confSlug }: { confSlug: string }): JSX.Element {
    const conference = useConference();

    const result = useGetAllTodaysRoomsQuery({
        variables: {
            conferenceId: conference.id,
            todayStart: DateTime.local().startOf("day").minus({ minutes: 10 }).toISO(),
            todayEnd: DateTime.local().endOf("day").plus({ minutes: 10 }).toISO(),
        },
    });

    const { isOpen: isCreateRoomOpen, onClose: onCreateRoomClose, onOpen: onCreateRoomOpen } = useDisclosure();
    const history = useHistory();

    return (
        <>
            <AccordionPanel pb={4} px={"3px"}>
                <Flex mb={2} ml={1} mr={1}>
                    <Heading as="h3" fontWeight="normal" fontStyle="italic" fontSize="md" textAlign="left">
                        Social &amp; discussion rooms
                    </Heading>
                    <ButtonGroup ml="auto">
                        <Button onClick={onCreateRoomOpen} colorScheme="green" size="xs">
                            <FAIcon icon="plus-square" iconStyle="s" />
                        </Button>
                        <LinkButton to={`/conference/${confSlug}/rooms`} colorScheme="blue" size="xs" mt={-1}>
                            All rooms
                        </LinkButton>
                    </ButtonGroup>
                </Flex>
                <ApolloQueryWrapper getter={(data) => data.socialOrDiscussionRooms} queryResult={result}>
                    {(rooms: readonly RoomListRoomDetailsFragment[]) => (
                        <RoomList
                            rooms={rooms}
                            layout={{ type: "list" }}
                            limit={5}
                            noRoomsMessage="No social or discussion rooms at the moment."
                        />
                    )}
                </ApolloQueryWrapper>
                <ApolloQueryWrapper getter={(data) => data.programRooms} queryResult={result}>
                    {(rooms: readonly RoomListRoomDetailsFragment[]) => (
                        <RoomList rooms={rooms} layout={{ type: "list" }}>
                            <Flex mb={2} mt={4} ml={1} mr={1}>
                                <Heading as="h3" fontWeight="normal" fontStyle="italic" fontSize="md" textAlign="left">
                                    Today&apos;s Program rooms
                                </Heading>
                                <ButtonGroup ml="auto">
                                    <LinkButton to={`/conference/${confSlug}/rooms`} colorScheme="blue" size="xs">
                                        All rooms
                                    </LinkButton>
                                </ButtonGroup>
                            </Flex>
                        </RoomList>
                    )}
                </ApolloQueryWrapper>
            </AccordionPanel>
            <CreateRoomModal
                isOpen={isCreateRoomOpen}
                onClose={onCreateRoomClose}
                onCreated={async (id, cb) => {
                    // Wait, because Vonage session creation is not instantaneous
                    setTimeout(() => {
                        cb();
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
        <AccordionPanel pb={4} px={"3px"} pt={"3px"}>
            <MainMenuProgram />
        </AccordionPanel>
    );
}

function LazySchedulePanel({ isExpanded }: { isExpanded: boolean }): JSX.Element {
    return useLazyRenderAndRetain(() => <SchedulePanel />, isExpanded);
}

function LazySponsorsPanel({ isExpanded }: { isExpanded: boolean }): JSX.Element {
    return useLazyRenderAndRetain(() => <MainMenuSponsors />, isExpanded);
}

export function LeftSidebarConferenceSections_Inner({
    confSlug,
}: {
    rootUrl: string;
    confSlug: string;
    attendee: AttendeeFieldsFragment;
    onClose: () => void;
}): JSX.Element {
    return (
        <>
            <HStack spacing={2} my={2} mx={2} alignItems="flex-start">
                <Flex justifyContent="center" alignItems="center" flexWrap="wrap" gridGap={2}>
                    <LinkButton
                        linkProps={{ flexBasis: "40%", flexGrow: 1, flexShrink: 0 }}
                        size="sm"
                        to={`/conference/${confSlug}/schedule`}
                        width="100%"
                    >
                        <FAIcon icon="calendar" iconStyle="r" mr={3} />
                        Schedule
                    </LinkButton>
                    <LinkButton
                        linkProps={{ flexBasis: "40%", flexGrow: 1, flexShrink: 0 }}
                        size="sm"
                        to={`/conference/${confSlug}/attendees`}
                        width="100%"
                    >
                        <FAIcon icon="cat" iconStyle="s" mr={3} />
                        Attendees
                    </LinkButton>
                    <LinkButton
                        linkProps={{ flexBasis: "40%", flexGrow: 1, flexShrink: 0 }}
                        size="sm"
                        to={`/conference/${confSlug}/rooms`}
                        width="100%"
                    >
                        <FAIcon icon="mug-hot" iconStyle="s" mr={3} />
                        Rooms
                    </LinkButton>
                    <LinkButton
                        linkProps={{ flexBasis: "40%", flexGrow: 1, flexShrink: 0 }}
                        size="sm"
                        to={`/conference/${confSlug}/shuffle`}
                        width="100%"
                    >
                        <FAIcon icon="random" iconStyle="s" mr={3} />
                        Shuffle
                    </LinkButton>
                    <LinkButton
                        linkProps={{ flexBasis: "40%", flexGrow: 1, flexShrink: 0 }}
                        size="sm"
                        to={`/conference/${confSlug}/hallways`}
                        width="100%"
                    >
                        <FAIcon icon="images" iconStyle="r" mr={3} />
                        Exhibitions
                    </LinkButton>
                    <LinkButton
                        linkProps={{ flexBasis: "40%", flexGrow: 1, flexShrink: 0 }}
                        size="sm"
                        to={`/conference/${confSlug}/profile/backstages`}
                        width="100%"
                    >
                        <FAIcon icon="video" iconStyle="s" mr={3} />
                        My Backstages
                    </LinkButton>
                </Flex>
                <ToggleNavButton m={0} size="xs" />
            </HStack>
            <Accordion defaultIndex={[0, 2]} allowMultiple allowToggle>
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
                                    Happening soon
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
