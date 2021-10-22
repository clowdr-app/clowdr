import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Flex,
    Heading,
} from "@chakra-ui/react";
import { DateTime } from "luxon";
import React, { useEffect } from "react";
import type { RoomListRoomDetailsFragment } from "../../../generated/graphql";
import { useGetAllTodaysRoomsQuery } from "../../../generated/graphql";
import { LinkButton } from "../../Chakra/LinkButton";
import { RoomList } from "../../Conference/Attend/Rooms/V1/RoomList";
import { useConference } from "../../Conference/useConference";
import useCurrentRegistrant, { useMaybeCurrentRegistrant } from "../../Conference/useCurrentRegistrant";
import usePolling from "../../Generic/usePolling";
import { useRestorableState } from "../../Generic/useRestorableState";
import QueryWrapper from "../../GQL/QueryWrapper";
import { FAIcon } from "../../Icons/FAIcon";
import useLazyRenderAndRetain from "./LazyRenderAndRetain";
import { MainMenuProgram } from "./MainMenu/MainMenuProgram";
import { MainMenuSponsors } from "./MainMenu/MainMenuSponsors";
import { ToggleNavButton } from "./ToggleNavButton";

function RoomsPanel({ confSlug }: { confSlug: string }): JSX.Element {
    const conference = useConference();
    const registrant = useCurrentRegistrant();

    const [result, refetch] = useGetAllTodaysRoomsQuery({
        variables: {
            conferenceId: conference.id,
            todayStart: DateTime.local().startOf("day").minus({ minutes: 10 }).toISO(),
            todayEnd: DateTime.local().endOf("day").plus({ minutes: 10 }).toISO(),
            registrantId: registrant.id,
        },
        requestPolicy: "network-only",
    });
    usePolling(refetch, 5 * 60 * 1000, true);

    // const { isOpen: isCreateRoomOpen, onClose: onCreateRoomClose, onOpen: onCreateRoomOpen } = useDisclosure();
    // const history = useHistory();

    return (
        <>
            <QueryWrapper getter={(data) => data.programRooms} queryResult={result}>
                {(rooms: readonly RoomListRoomDetailsFragment[]) => (
                    <RoomList
                        rooms={rooms}
                        layout={{ type: "list" }}
                        noRoomsMessage={"Rooms for sessions will show here each day."}
                    />
                )}
            </QueryWrapper>
            <QueryWrapper getter={(data) => data.socialOrDiscussionRooms} queryResult={result} noSpinner>
                {(rooms: readonly RoomListRoomDetailsFragment[]) => (
                    <RoomList rooms={rooms} layout={{ type: "list" }} limit={5}>
                        <Flex mb={2} mt={4} ml={1} mr={1}>
                            <Heading as="h3" fontWeight="normal" fontStyle="italic" fontSize="md" textAlign="left">
                                Active social &amp; discussion rooms
                            </Heading>
                        </Flex>
                    </RoomList>
                )}
            </QueryWrapper>
            <LinkButton
                size="xs"
                to={`/conference/${confSlug}/rooms`}
                linkProps={{ width: "100%", mt: 2, px: 1 }}
                width="100%"
                colorScheme="PrimaryActionButton"
                borderRadius={0}
            >
                <FAIcon icon="mug-hot" iconStyle="s" mr={3} />
                All rooms
            </LinkButton>
            {/* <CreateRoomModal
                isOpen={isCreateRoomOpen}
                onClose={onCreateRoomClose}
                onCreated={async (id, cb) => {
                    // Wait, because Vonage session creation is not instantaneous
                    setTimeout(() => {
                        cb();
                        history.push(`/conference/${confSlug}/room/${id}`);
                    }, 2000);
                }}
            /> */}
        </>
    );
}

function LazyRoomsPanel({
    isExpanded,
    confSlug,
    setDefaultIndex,
}: {
    isExpanded: boolean;
    confSlug: string;
    setDefaultIndex: (index: number) => void;
}): JSX.Element {
    useEffect(() => {
        if (isExpanded) {
            setDefaultIndex(0);
        }
    }, [isExpanded, setDefaultIndex]);
    return useLazyRenderAndRetain(() => <RoomsPanel confSlug={confSlug} />, isExpanded);
}

function SchedulePanel(): JSX.Element {
    return <MainMenuProgram />;
}

function LazySchedulePanel({
    isExpanded,
    setDefaultIndex,
}: {
    isExpanded: boolean;
    setDefaultIndex: (index: number) => void;
}): JSX.Element {
    useEffect(() => {
        if (isExpanded) {
            setDefaultIndex(1);
        }
    }, [isExpanded, setDefaultIndex]);
    return useLazyRenderAndRetain(() => <SchedulePanel />, isExpanded);
}

function LazySponsorsPanel({
    isExpanded,
    setDefaultIndex,
}: {
    isExpanded: boolean;
    setDefaultIndex: (index: number) => void;
}): JSX.Element {
    useEffect(() => {
        if (isExpanded) {
            setDefaultIndex(2);
        }
    }, [isExpanded, setDefaultIndex]);
    return useLazyRenderAndRetain(() => <MainMenuSponsors />, isExpanded);
}

export function LeftSidebarConferenceSections_Inner(): JSX.Element {
    const conference = useConference();
    const [defaultIndex, setDefaultIndex] = useRestorableState<number>(
        "LEFT_SIDEBAR_DEFAULT_PANEL_INDEX",
        -1,
        (x) => x.toString(),
        (x) => parseInt(x, 10)
    );
    return (
        <>
            <Flex my={2} mx={2} justifyContent="center" alignItems="center" flexWrap="wrap">
                {/* <LinkButton
                        linkProps={{ flexBasis: "40%", flexGrow: 1, flexShrink: 0 }}
                        size="sm"
                        to={`/conference/${confSlug}/schedule`}
                        width="100%"
                    >
                        <FAIcon icon="calendar" iconStyle="r" mr={3} />
                        Schedule
                    </LinkButton> */}
                <LinkButton size="sm" to={`/conference/${confSlug}/exhibitions`} width="100%">
                    <FAIcon icon="images" iconStyle="r" mr={3} />
                    Exhibitions
                </LinkButton>
                {/* <LinkButton
                        linkProps={{ flexBasis: "40%", flexGrow: 1, flexShrink: 0 }}
                        size="sm"
                        to={`/conference/${confSlug}/registrants`}
                        width="100%"
                    >
                        <FAIcon icon="cat" iconStyle="s" mr={3} />
                        People
                    </LinkButton> */}
                <LinkButton size="sm" to={`/conference/${confSlug}/profile/backstages`} width="100%" mx={2}>
                    <FAIcon icon="video" iconStyle="s" mr={3} />
                    My Backstages
                </LinkButton>
                <ToggleNavButton m={0} ml="auto" size="xs" />
            </Flex>
            <Flex w="100%" justifyContent="center">
                <LinkButton
                    size="sm"
                    to={`/conference/${confSlug}/rooms`}
                    linkProps={{ width: "60%", height: 10, mt: 2, mb: 4, px: 2 }}
                    width="100%"
                    height="100%"
                    colorScheme="PrimaryActionButton"
                    borderRadius={0}
                >
                    <FAIcon icon="user-friends" iconStyle="s" mr={3} />
                    Socialise
                </LinkButton>
            </Flex>
            <Accordion defaultIndex={defaultIndex !== -1 ? defaultIndex : undefined} allowToggle>
                <AccordionItem>
                    {({ isExpanded }) => (
                        <>
                            <AccordionButton
                                fontWeight="bold"
                                borderTop="2px solid rgba(128, 128, 128, 0.7)"
                                fontSize="lg"
                            >
                                <FAIcon iconStyle="s" icon="mug-hot" mr={4} w={6} />
                                <Box flex="1" textAlign="left">
                                    Rooms
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4} px={"3px"}>
                                <LazyRoomsPanel
                                    isExpanded={isExpanded}
                                    setDefaultIndex={setDefaultIndex}
                                    confSlug={confSlug}
                                />
                            </AccordionPanel>
                        </>
                    )}
                </AccordionItem>

                <AccordionItem>
                    {({ isExpanded }) => (
                        <>
                            <AccordionButton
                                fontWeight="bold"
                                borderTop="2px solid rgba(128, 128, 128, 0.7)"
                                fontSize="lg"
                            >
                                <FAIcon iconStyle="r" icon="calendar" mr={4} w={6} />
                                <Box flex="1" textAlign="left">
                                    Explore program
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4} px={"3px"} pt={"3px"}>
                                <LazySchedulePanel isExpanded={isExpanded} setDefaultIndex={setDefaultIndex} />
                            </AccordionPanel>
                        </>
                    )}
                </AccordionItem>

                <AccordionItem>
                    {({ isExpanded }) => (
                        <>
                            <AccordionButton
                                fontWeight="bold"
                                borderTop="2px solid rgba(128, 128, 128, 0.7)"
                                fontSize="lg"
                            >
                                <FAIcon iconStyle="s" icon="star" mr={4} w={6} />
                                <Box flex="1" textAlign="left">
                                    {conference.sponsorsLabel?.[0]?.value ?? "Sponsors"}
                                </Box>
                                <AccordionIcon />
                            </AccordionButton>
                            <AccordionPanel pb={4} px={"3px"}>
                                <LazySponsorsPanel isExpanded={isExpanded} setDefaultIndex={setDefaultIndex} />
                            </AccordionPanel>
                        </>
                    )}
                </AccordionItem>
            </Accordion>
        </>
    );
}

export default function LeftSidebarConferenceSections(): JSX.Element {
    const registrant = useMaybeCurrentRegistrant();
    if (registrant) {
        return <LeftSidebarConferenceSections_Inner />;
    }
    return <></>;
}
