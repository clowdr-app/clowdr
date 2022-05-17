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
    VStack,
} from "@chakra-ui/react";
import { gql } from "@urql/core";
import * as R from "ramda";
import React, { useMemo } from "react";
import type { MyBackstages_EventFragment } from "../../../../generated/graphql";
import { useRegistrantEventsWithBackstagesQuery } from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import FAIcon from "../../../Chakra/FAIcon";
import { LinkButton } from "../../../Chakra/LinkButton";
import { Markdown } from "../../../Chakra/Markdown";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { useRealTime } from "../../../Hooks/useRealTime";
import { useTitle } from "../../../Hooks/useTitle";
import { useConference } from "../../useConference";
import useCurrentRegistrant from "../../useCurrentRegistrant";

gql`
    fragment MyBackstages_Event on schedule_Event {
        id
        conferenceId
        itemId
        item {
            id
            title
        }
        scheduledEndTime
        modeName
        name
        roomId
        room {
            id
            name
        }
        scheduledStartTime
    }

    query RegistrantEventsWithBackstages($registrantId: uuid!) {
        schedule_Event(
            where: {
                modeName: { _eq: LIVESTREAM }
                room: {}
                _or: [
                    { eventPeople: { person: { registrantId: { _eq: $registrantId } } } }
                    { presentations: { eventPeople: { person: { registrantId: { _eq: $registrantId } } } } }
                ]
            }
        ) {
            ...MyBackstages_Event
        }
    }
`;

function MyBackstages(): JSX.Element {
    const conference = useConference();
    const { conferencePath } = useAuthParameters();
    const registrant = useCurrentRegistrant();

    const [myBackstagesResponse] = useRegistrantEventsWithBackstagesQuery({
        variables: {
            registrantId: registrant.id,
        },
        requestPolicy: "network-only",
    });

    const now = useRealTime(30000);

    const eventsGroupedByDay = useMemo(
        () =>
            myBackstagesResponse.data?.schedule_Event &&
            R.groupBy<MyBackstages_EventFragment>(
                (x) => new Date(x.scheduledStartTime).toLocaleDateString(),
                R.sortBy(
                    (x) => Date.parse(x.scheduledStartTime),
                    myBackstagesResponse.data.schedule_Event.filter((x) => Date.parse(x.scheduledEndTime) >= now)
                )
            ),
        [myBackstagesResponse.data?.schedule_Event, now]
    );
    const eventsTodayAndFuture = useMemo(
        () =>
            eventsGroupedByDay &&
            Object.values(eventsGroupedByDay).filter((group) => {
                const startAtDay = new Date(group[0].scheduledStartTime);
                startAtDay.setHours(23);
                startAtDay.setMinutes(59);
                startAtDay.setSeconds(59);
                startAtDay.setMilliseconds(999);
                return startAtDay.getTime() >= now;
            }),
        [eventsGroupedByDay, now]
    );

    const liveNowBg = useColorModeValue(
        "MyBackstages.liveNowBackgroundColor-light",
        "MyBackstages.liveNowBackgroundColor-dark"
    );
    const availableNowBg = useColorModeValue(
        "MyBackstages.backstageAvailableBackgroundColor-light",
        "MyBackstages.backstageAvailableBackgroundColor-dark"
    );
    const availableSoon = useColorModeValue(
        "MyBackstages.availableSoonBackgroundColor-light",
        "MyBackstages.availableSoonBackgroundColor-dark"
    );
    const myBackstagesNotice = useMemo(
        () =>
            "myBackstagesNotice" in conference &&
            conference.myBackstagesNotice.length > 0 &&
            conference.myBackstagesNotice[0]?.value?.length
                ? conference.myBackstagesNotice[0].value
                : undefined,
        [conference]
    );
    return (
        <>
            {myBackstagesNotice ? <Markdown autoLinkify>{myBackstagesNotice}</Markdown> : undefined}
            <Text pb={2} pt={myBackstagesNotice ? 2 : undefined}>
                If you are an author, chair or presenter, below is the list of your backstages for current and future
                live-stream (not video-chat) events. You should join your backstage when it is available.
            </Text>
            <Text pb={4}>
                Backstages are only available for live-stream events. If you are presenting at a video-chat event, you
                can go directly to your room at the start time. You will not see any backstages in this list.
            </Text>
            {myBackstagesResponse.fetching && !eventsGroupedByDay ? (
                <CenteredSpinner spinnerProps={{ label: "Loading backstages" }} caller="MyBackstages:151" />
            ) : undefined}
            {eventsTodayAndFuture ? (
                <>
                    {eventsTodayAndFuture.length === 0 ? (
                        <Text fontWeight="bold">
                            You are not assigned to any future live-stream events. If you think this is a mistake,
                            please contact your conference organisers.
                        </Text>
                    ) : (
                        <>
                            <Text>All times/dates are shown in your local timezone.</Text>
                            <Accordion allowToggle w="100%" reduceMotion defaultIndex={0}>
                                {eventsTodayAndFuture.reduce((elements, group) => {
                                    const startAtDay = new Date(group[0].scheduledStartTime);
                                    return [
                                        ...elements,
                                        <AccordionItem key={group[0].scheduledStartTime}>
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
                                                <Table size="sm" colorScheme="MyBackstages">
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
                                                            const startAt = new Date(x.scheduledStartTime);
                                                            const scheduledEndTime = Date.parse(x.scheduledEndTime);
                                                            const backstageStartTime =
                                                                startAt.getTime() - 20 * 1000 * 60;
                                                            const isNow =
                                                                backstageStartTime <= now && now <= scheduledEndTime;
                                                            const isSoon =
                                                                backstageStartTime - 40 * 1000 * 60 <= now &&
                                                                now <= scheduledEndTime;
                                                            const isLive =
                                                                startAt.getTime() <= now && now <= scheduledEndTime;
                                                            return (
                                                                <Tr
                                                                    key={x.id}
                                                                    backgroundColor={
                                                                        isLive
                                                                            ? liveNowBg
                                                                            : isNow
                                                                            ? availableNowBg
                                                                            : isSoon
                                                                            ? availableSoon
                                                                            : undefined
                                                                    }
                                                                >
                                                                    <Td maxW="10em">
                                                                        {isLive || isNow ? (
                                                                            <LinkButton
                                                                                to={`${conferencePath}/room/${x.room?.id}`}
                                                                                overflowWrap="normal"
                                                                                maxW="100%"
                                                                                height="auto"
                                                                                whiteSpace="normal"
                                                                                linkProps={{
                                                                                    maxW: "100%",
                                                                                }}
                                                                                textAlign="center"
                                                                                colorScheme={
                                                                                    isLive
                                                                                        ? "LiveActionButton"
                                                                                        : "PrimaryActionButton"
                                                                                }
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
                                                                                href={`${conferencePath}/room/${x.room.id}`}
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

export default function MyBackstagesPage(): JSX.Element {
    const title = useTitle("My Backstages");
    const registrant = useCurrentRegistrant();

    return (
        <VStack alignItems="flex-start" spacing={4} p={[2, 2, 4]}>
            {title}
            <Heading as="h1" id="page-heading" textAlign="left">
                My Backstages
            </Heading>
            <Heading as="h2" fontSize="lg" fontStyle="italic" textAlign="left">
                ({registrant.displayName})
            </Heading>
            <MyBackstages />
        </VStack>
    );
}
