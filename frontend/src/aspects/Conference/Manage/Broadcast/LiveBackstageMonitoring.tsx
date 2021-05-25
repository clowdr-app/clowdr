import { gql } from "@apollo/client";
import {
    Box,
    Button,
    Center,
    chakra,
    CircularProgress,
    CircularProgressLabel,
    Code,
    Divider,
    Flex,
    HStack,
    Link,
    List,
    ListItem,
    Spinner,
    Text,
    Tooltip,
    useClipboard,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Link as ReactLink } from "react-router-dom";
import { MonitorLiveBackstages_EventFragment, useMonitorLiveBackstagesQuery } from "../../../../generated/graphql";
import { roundDownToNearest, roundUpToNearest } from "../../../Generic/MathUtils";
import { useRealTime } from "../../../Generic/useRealTime";
import FAIcon from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";

gql`
    query MonitorLiveBackstages($conferenceId: uuid!, $now: timestamptz!, $later: timestamptz!) {
        schedule_Event(
            where: {
                conferenceId: { _eq: $conferenceId }
                startTime: { _lte: $later }
                endTime: { _gte: $now }
                intendedRoomModeName: { _in: [PRESENTATION, Q_AND_A] }
            }
            order_by: [{ startTime: asc }, { endTime: asc }, { room: { name: asc } }]
        ) {
            ...MonitorLiveBackstages_Event
        }
    }

    fragment MonitorLiveBackstages_Event on schedule_Event {
        id
        name
        startTime
        endTime
        room {
            id
            name
        }
        item {
            id
            title
        }
        eventPeople {
            id
            roleName
            person {
                id
                name
                affiliation
                registrant {
                    id
                    userId
                }
            }
        }
        eventVonageSession {
            id
            sessionId
        }
        participantStreams {
            id
            registrantId
            vonageStreamType
        }
    }
`;

export default function LiveBackstageMonitoring(): JSX.Element {
    const conference = useConference();
    const now = useRealTime(1000);
    const nowRoundedDown = roundDownToNearest(now - 60 * 1000, 60 * 1000);
    const nowStr = useMemo(() => new Date(nowRoundedDown).toISOString(), [nowRoundedDown]);
    const laterStr = useMemo(() => new Date(roundUpToNearest(now + 20 * 60 * 1000, 60 * 1000)).toISOString(), [now]);
    const response = useMonitorLiveBackstagesQuery({
        variables: {
            conferenceId: conference.id,
            now: nowStr,
            later: laterStr,
        },
    });

    const shadow = useColorModeValue("md", "light-md");
    const bgColor = useColorModeValue("gray.200", "gray.600");

    const listEl = useMemo(
        () => (
            <List spacing={4} w="100%">
                {response.data?.schedule_Event.map((event) => (
                    <ListItem key={event.id} bgColor={bgColor} shadow={shadow} p={4}>
                        <BackstageTile event={event} />
                    </ListItem>
                ))}
            </List>
        ),
        [bgColor, response.data?.schedule_Event, shadow]
    );

    const secondsToNextRefresh = Math.round((nowRoundedDown + 2 * 60 * 1000 - now) / 1000);

    return (
        <VStack w="100%" spacing={4}>
            <Center h="60px">
                {response.loading ? (
                    <Spinner label="Loading backstage info" size="sm" />
                ) : (
                    <>
                        <CircularProgress value={secondsToNextRefresh + 1} max={60} min={0} size="50px" mr={2} mt={1}>
                            <CircularProgressLabel>{secondsToNextRefresh + 1}</CircularProgressLabel>
                        </CircularProgress>
                        seconds till next refresh
                    </>
                )}
            </Center>
            <Center>
                Your local time:&nbsp;
                <chakra.span fontWeight="bold">
                    {new Date(now).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                    })}
                </chakra.span>
            </Center>
            {listEl}
        </VStack>
    );
}

function BackstageTile({ event }: { event: MonitorLiveBackstages_EventFragment }): JSX.Element {
    const conference = useConference();
    const { hasCopied, onCopy } = useClipboard(event.id);
    const now = useRealTime(60 * 1000);

    const startDate = useMemo(() => new Date(event.startTime), [event.startTime]);
    const endDate = useMemo(() => new Date(event.endTime), [event.endTime]);
    const isLive = startDate.getTime() < now && now < endDate.getTime();

    const itemEl = useMemo(
        () => (
            <VStack spacing={2} justifyContent="flex-start" alignItems="flex-start">
                <Text fontSize="sm">
                    {isLive ? (
                        <>
                            <FAIcon icon="broadcast-tower" iconStyle="s" fontSize="sm" color="red.400" mb={1} mr={2} />{" "}
                            Now
                        </>
                    ) : (
                        startDate.toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                        })
                    )}{" "}
                    until{" "}
                    {endDate.toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                    })}{" "}
                    in{" "}
                    <Link as={ReactLink} to={`/conference/${conference.slug}/room/${event.room.id}`}>
                        {event.room.name}
                    </Link>
                </Text>
                <Text fontSize="lg">
                    {event.eventVonageSession && event.eventVonageSession.sessionId ? (
                        <Tooltip label="Vonage session ready">
                            <FAIcon iconStyle="s" icon="video" mb={1} mr={2} />
                        </Tooltip>
                    ) : (
                        <Tooltip label="No Vonage session!">
                            <FAIcon iconStyle="s" icon="circle-cross" color="red.400" mb={1} mr={2} />
                        </Tooltip>
                    )}
                    {event.name}
                    {event.item ? (
                        <>
                            {": "}
                            <Link as={ReactLink} to={`/conference/${conference.slug}/item/${event.item.id}`}>
                                {event.item.title}
                            </Link>
                        </>
                    ) : undefined}
                </Text>
                <Text fontSize="xs">
                    Event: <Code>{event.id}</Code>
                    <Button onClick={onCopy} ml={2} size="xs" colorScheme="purple">
                        {hasCopied ? "Copied" : "Copy"}
                    </Button>
                </Text>
                <Text fontSize="sm">
                    {event.eventPeople.length === 0 ? (
                        <FAIcon iconStyle="s" icon="exclamation-triangle" color="red.400" mb={1} mr={2} />
                    ) : undefined}
                    Expecting {event.eventPeople.length} people{event.eventPeople.length === 0 ? "!" : ""}
                </Text>
                {event.eventPeople.length ? (
                    <>
                        <Divider borderColor="gray.400" />
                        <List spacing={2} w="100%">
                            {event.eventPeople.map((eventPerson) => {
                                const registrantId = eventPerson.person.registrant?.id;
                                const userId = eventPerson.person.registrant?.userId;
                                const isCameraOrMicConnected =
                                    !!registrantId &&
                                    event.participantStreams.some(
                                        (x) => x.registrantId === registrantId && x.vonageStreamType === "camera"
                                    );
                                const isScreenshareConnected =
                                    !!registrantId &&
                                    event.participantStreams.some(
                                        (x) => x.registrantId === registrantId && x.vonageStreamType === "screen"
                                    );
                                return (
                                    <ListItem key={eventPerson.id} w="100%">
                                        <Flex justifyContent="flex-start" alignItems="flex-start" w="100%">
                                            <Text>
                                                {registrantId && userId && isCameraOrMicConnected ? (
                                                    <FAIcon
                                                        iconStyle="s"
                                                        icon="check-circle"
                                                        color="green.400"
                                                        mb={1}
                                                        mr={2}
                                                    />
                                                ) : (
                                                    <FAIcon
                                                        iconStyle="s"
                                                        icon="times-circle"
                                                        color="red.400"
                                                        mb={1}
                                                        mr={2}
                                                    />
                                                )}
                                                {eventPerson.person.name} (
                                                {eventPerson.person.affiliation
                                                    ? eventPerson.person.affiliation
                                                    : "<No affiliation>"}
                                                ) as{" "}
                                                {eventPerson.roleName[0] + eventPerson.roleName.substr(1).toLowerCase()}
                                            </Text>
                                            <HStack
                                                ml="auto"
                                                justifyContent="flex-start"
                                                alignItems="flex-start"
                                                spacing={4}
                                            >
                                                <Box>
                                                    {registrantId ? (
                                                        <Tooltip label="Person is linked to registrant">
                                                            <FAIcon iconStyle="s" icon="link" color="green.400" />
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip label="Not linked to registrant!">
                                                            <FAIcon iconStyle="s" icon="unlink" color="red.400" />
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                                <Box>
                                                    {userId ? (
                                                        <Tooltip label="Completed registration">
                                                            <FAIcon
                                                                iconStyle="s"
                                                                icon="check-circle"
                                                                color="green.400"
                                                            />
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip label="Has not completed registration!">
                                                            <FAIcon
                                                                iconStyle="s"
                                                                icon="times-circle"
                                                                color={registrantId ? "red.400" : "gray.400"}
                                                            />
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                                <Box>
                                                    {isCameraOrMicConnected ? (
                                                        <Tooltip label="Camera or microphone is enabled">
                                                            <VStack color="green.400" spacing={0}>
                                                                <FAIcon iconStyle="s" icon="video" />
                                                                <FAIcon iconStyle="s" icon="microphone" />
                                                            </VStack>
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip label="Has not enabled camera or microphone">
                                                            <VStack
                                                                color={registrantId ? "red.400" : "gray.400"}
                                                                spacing={0}
                                                            >
                                                                <FAIcon iconStyle="s" icon="video-slash" />
                                                                <FAIcon iconStyle="s" icon="microphone-slash" />
                                                            </VStack>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                                <Box>
                                                    {isScreenshareConnected ? (
                                                        <Tooltip label="Screenshare is enabled">
                                                            <FAIcon iconStyle="s" icon="desktop" color="green.400" />
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip label="Has not enabled screenshare">
                                                            <FAIcon iconStyle="s" icon="desktop" color="gray.400" />
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            </HStack>
                                        </Flex>
                                    </ListItem>
                                );
                            })}
                        </List>
                    </>
                ) : undefined}
            </VStack>
        ),
        [
            conference.slug,
            endDate,
            event.eventPeople,
            event.eventVonageSession,
            event.id,
            event.item,
            event.name,
            event.participantStreams,
            event.room.id,
            event.room.name,
            hasCopied,
            isLive,
            onCopy,
            startDate,
        ]
    );
    return itemEl;
}
