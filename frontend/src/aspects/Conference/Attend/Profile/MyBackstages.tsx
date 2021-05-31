import { gql } from "@apollo/client";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    chakra,
    Heading,
    HStack,
    Link,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    ModalProps,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    useColorModeValue,
} from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo, useRef } from "react";
import { MyBackstages_EventFragment, useRegistrantEventsWithBackstagesQuery } from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useRealTime } from "../../../Generic/useRealTime";
import { FAIcon } from "../../../Icons/FAIcon";
import { useTitle } from "../../../Utils/useTitle";
import { useConference } from "../../useConference";
import useCurrentRegistrant from "../../useCurrentRegistrant";

gql`
    fragment MyBackstages_Event on schedule_Event {
        id
        conferenceId
        item {
            id
            title
        }
        endTime
        intendedRoomModeName
        name
        room {
            id
            name
        }
        startTime
    }

    query RegistrantEventsWithBackstages($registrantId: uuid!) {
        schedule_Event(
            where: {
                eventPeople: { person: { registrantId: { _eq: $registrantId } } }
                intendedRoomModeName: { _in: [PRESENTATION, Q_AND_A] }
                room: {}
            }
        ) {
            ...MyBackstages_Event
        }
    }
`;

function MyBackstages(): JSX.Element {
    const conference = useConference();
    const registrant = useCurrentRegistrant();

    const myBackstagesResponse = useRegistrantEventsWithBackstagesQuery({
        variables: {
            registrantId: registrant.id,
        },
        fetchPolicy: "network-only",
    });

    const now = useRealTime(30000);

    const eventsGroupedByDay = useMemo(
        () =>
            myBackstagesResponse.data?.schedule_Event &&
            R.groupBy<MyBackstages_EventFragment>(
                (x) => new Date(x.startTime).toLocaleDateString(),
                R.sortBy(
                    (x) => Date.parse(x.startTime),
                    myBackstagesResponse.data.schedule_Event.filter((x) => Date.parse(x.endTime) >= now)
                )
            ),
        [myBackstagesResponse.data?.schedule_Event, now]
    );
    const eventsTodayAndFuture = useMemo(
        () =>
            eventsGroupedByDay &&
            Object.values(eventsGroupedByDay).filter((group) => {
                const startAtDay = new Date(group[0].startTime);
                startAtDay.setHours(23);
                startAtDay.setMinutes(59);
                startAtDay.setSeconds(59);
                startAtDay.setMilliseconds(999);
                return startAtDay.getTime() >= now;
            }),
        [eventsGroupedByDay, now]
    );

    const redBg = useColorModeValue("red.300", "red.600");
    const greenBg = useColorModeValue("purple.300", "purple.600");
    const orangeBg = useColorModeValue("yellow.300", "yellow.600");
    return (
        <>
            <Box pb={4}>
                If you are an author, chair or presenter, below is the list of your backstages for current and future
                events. You should join your backstage when it is available.
            </Box>
            {myBackstagesResponse.loading && !eventsGroupedByDay ? (
                <CenteredSpinner spinnerProps={{ label: "Loading backstages" }} />
            ) : undefined}
            {eventsTodayAndFuture ? (
                <>
                    {eventsTodayAndFuture.length === 0 ? (
                        <Box>
                            You are not assigned to any future live-stream events. If you think this is a mistake,
                            please contact your conference organisers.
                        </Box>
                    ) : (
                        <>
                            <Text>All times/dates are shown in your local timezone.</Text>
                            <Accordion allowToggle w="100%" reduceMotion defaultIndex={0}>
                                {eventsTodayAndFuture.reduce((elements, group) => {
                                    const startAtDay = new Date(group[0].startTime);
                                    return [
                                        ...elements,
                                        <AccordionItem key={group[0].startTime}>
                                            <AccordionButton>
                                                <HStack>
                                                    <AccordionIcon ml={0} pl={0} />
                                                    <Box>
                                                        {startAtDay.toLocaleString(undefined, {
                                                            day: "2-digit",
                                                            month: "short",
                                                            weekday: "long",
                                                        })}
                                                    </Box>
                                                </HStack>
                                            </AccordionButton>
                                            <AccordionPanel>
                                                <Table size="sm" colorScheme="blue">
                                                    <Thead>
                                                        <Tr>
                                                            <Th maxW="7em">You are needed</Th>
                                                            <Th maxW="9em">Backstage from</Th>
                                                            <Th maxW="5em">Event start</Th>
                                                            <Th maxW="12em">Event name</Th>
                                                            <Th maxW="25em">Content item</Th>
                                                            <Th maxW="15em">Where to find your backstage</Th>
                                                        </Tr>
                                                    </Thead>
                                                    <Tbody>
                                                        {group.map((x) => {
                                                            const startAt = new Date(x.startTime);
                                                            const endTime = Date.parse(x.endTime);
                                                            const backstageStartTime =
                                                                startAt.getTime() - 20 * 1000 * 60;
                                                            const isNow = backstageStartTime <= now && now <= endTime;
                                                            const isSoon =
                                                                backstageStartTime - 40 * 1000 * 60 <= now &&
                                                                now <= endTime;
                                                            const isLive = startAt.getTime() <= now && now <= endTime;
                                                            return (
                                                                <Tr
                                                                    key={x.id}
                                                                    backgroundColor={
                                                                        isLive
                                                                            ? redBg
                                                                            : isNow
                                                                            ? greenBg
                                                                            : isSoon
                                                                            ? orangeBg
                                                                            : undefined
                                                                    }
                                                                >
                                                                    <Td maxW="10em">
                                                                        {isLive || isNow ? (
                                                                            <LinkButton
                                                                                to={`/conference/${conference.slug}/room/${x.room.id}`}
                                                                                overflowWrap="normal"
                                                                                maxW="100%"
                                                                                height="auto"
                                                                                whiteSpace="normal"
                                                                                linkProps={{
                                                                                    maxW: "100%",
                                                                                }}
                                                                                textAlign="center"
                                                                                colorScheme={isLive ? "red" : "purple"}
                                                                                size="lg"
                                                                                p={2}
                                                                                flexDir="column"
                                                                            >
                                                                                <FAIcon
                                                                                    icon="video"
                                                                                    iconStyle="s"
                                                                                    fontSize="xs"
                                                                                    mr={2}
                                                                                />
                                                                                <chakra.span>Now!</chakra.span>
                                                                                <chakra.span fontSize="xs" mt={2}>
                                                                                    (Click here to go to your backstage)
                                                                                </chakra.span>
                                                                            </LinkButton>
                                                                        ) : isSoon ? (
                                                                            "Soon"
                                                                        ) : (
                                                                            "Not yet"
                                                                        )}
                                                                    </Td>
                                                                    <Td>
                                                                        {isNow
                                                                            ? "Now"
                                                                            : new Date(
                                                                                  backstageStartTime
                                                                              ).toLocaleTimeString(undefined, {
                                                                                  minute: "2-digit",
                                                                                  hour: "2-digit",
                                                                              })}
                                                                    </Td>
                                                                    <Td>
                                                                        {isLive
                                                                            ? "Live now"
                                                                            : startAt.toLocaleTimeString(undefined, {
                                                                                  minute: "2-digit",
                                                                                  hour: "2-digit",
                                                                              })}
                                                                    </Td>
                                                                    <Td maxW="12em">{x.name}</Td>
                                                                    <Td maxW="25em">{x.item?.title ?? ""}</Td>
                                                                    <Td maxW="15em">
                                                                        {x.room ? (
                                                                            <Link
                                                                                href={`/conference/${conference.slug}/room/${x.room.id}`}
                                                                            >
                                                                                <FAIcon
                                                                                    icon="link"
                                                                                    iconStyle="s"
                                                                                    fontSize="xs"
                                                                                    mr={2}
                                                                                />
                                                                                <chakra.span>{x.room.name}</chakra.span>
                                                                            </Link>
                                                                        ) : (
                                                                            "<Error: Unknown room>"
                                                                        )}
                                                                    </Td>
                                                                </Tr>
                                                            );
                                                        })}
                                                    </Tbody>
                                                </Table>
                                            </AccordionPanel>
                                        </AccordionItem>,
                                    ];
                                }, [] as JSX.Element[])}
                            </Accordion>
                        </>
                    )}
                </>
            ) : undefined}
        </>
    );
}

export function MyBackstagesModal(props: Omit<ModalProps, "children">): JSX.Element {
    const closeRef = useRef<HTMLButtonElement | null>(null);

    const registrant = useCurrentRegistrant();

    return (
        <Modal initialFocusRef={closeRef} size="6xl" isCentered scrollBehavior="inside" {...props}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>My Backstages ({registrant.displayName})</ModalHeader>
                <ModalCloseButton ref={closeRef} />
                <ModalBody>
                    <MyBackstages />
                </ModalBody>
                <ModalFooter></ModalFooter>
            </ModalContent>
        </Modal>
    );
}

export default function MyBackstagesPage(): JSX.Element {
    const title = useTitle("My Backstages");
    const registrant = useCurrentRegistrant();

    return (
        <>
            {title}
            <Heading as="h1" id="page-heading">
                My Backstages
            </Heading>
            <Heading as="h2" fontSize="lg" fontStyle="italic">
                ({registrant.displayName})
            </Heading>
            <MyBackstages />
        </>
    );
}
