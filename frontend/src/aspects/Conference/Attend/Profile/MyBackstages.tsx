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
import React, { useMemo } from "react";
import { useAttendeeEventsWithBackstagesQuery } from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useRealTime } from "../../../Generic/useRealTime";
import { FAIcon } from "../../../Icons/FAIcon";
import { useTitle } from "../../../Utils/useTitle";
import { useConference } from "../../useConference";
import useCurrentAttendee from "../../useCurrentAttendee";

gql`
    query AttendeeEventsWithBackstages($attendeeId: uuid!) {
        Event(
            where: {
                eventPeople: { person: { attendeeId: { _eq: $attendeeId } } }
                intendedRoomModeName: { _in: [PRESENTATION, Q_AND_A] }
            }
        ) {
            id
            conferenceId
            contentGroup {
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
    }
`;

export default function MyBackstages(): JSX.Element {
    const conference = useConference();
    const title = useTitle("My Backstages");
    const attendee = useCurrentAttendee();

    const myBackstagesResponse = useAttendeeEventsWithBackstagesQuery({
        variables: {
            attendeeId: attendee.id,
        },
        fetchPolicy: "network-only",
    });

    const now = useRealTime(30000);

    const eventsGroupedByDay = useMemo(
        () =>
            myBackstagesResponse.data?.Event &&
            R.groupBy(
                (x) => new Date(x.startTime).toLocaleDateString(),
                R.sortBy(
                    (x) => Date.parse(x.startTime),
                    myBackstagesResponse.data.Event.filter((x) => Date.parse(x.endTime) >= now)
                )
            ),
        [myBackstagesResponse.data?.Event, now]
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
    const greenBg = useColorModeValue("green.300", "green.600");
    const orangeBg = useColorModeValue("orange.300", "orange.600");
    return (
        <>
            {title}
            <Heading as="h1">My Backstages</Heading>
            <Heading as="h2" fontSize="lg" fontStyle="italic">
                ({attendee.displayName})
            </Heading>
            <Box>
                On this page, authors, presenters and chairs of events can find the list of backstages (for current and
                future events). You should join your backstage when it is available.
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
                                                                                colorScheme={isLive ? "red" : "green"}
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
                                                                    <Td maxW="25em">{x.contentGroup?.title ?? ""}</Td>
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
