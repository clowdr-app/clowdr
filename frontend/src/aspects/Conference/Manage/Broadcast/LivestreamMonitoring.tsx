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
    Grid,
    GridItem,
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
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import * as R from "ramda";
import React, { Suspense, useEffect, useMemo, useState } from "react";
import { Link as ReactLink } from "react-router-dom";
import type {
    MonitorLivestreams_EventFragment,
    MonitorLivestreams_PersonFragment,
} from "../../../../generated/graphql";
import {
    Schedule_EventProgramPersonRole_Enum,
    useMonitorLivestreamsQuery,
    useRoomPage_GetRoomChannelStackQuery,
} from "../../../../generated/graphql";
import FAIcon from "../../../Chakra/FAIcon";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { makeContext } from "../../../GQL/make-context";
import { useRealTime } from "../../../Hooks/useRealTime";
import { usePresenceState } from "../../../Realtime/PresenceStateProvider";
import { roundDownToNearest, roundUpToNearest } from "../../../Utils/MathUtils";
import { useConference } from "../../useConference";

const HlsPlayer = React.lazy(() => import("../../Attend/Room/Video/HlsPlayer"));

gql`
    query MonitorLivestreams($conferenceId: uuid!, $now: timestamptz!, $later: timestamptz!) {
        liveEvents: schedule_Event(
            where: {
                conferenceId: { _eq: $conferenceId }
                startTime: { _lte: $later }
                endTime: { _gte: $now }
                intendedRoomModeName: { _in: [PRESENTATION, Q_AND_A] }
            }
            order_by: [{ startTime: asc }, { endTime: asc }, { room: { name: asc } }]
        ) {
            ...MonitorLivestreams_Event
        }
        prerecordedEvents: schedule_Event(
            where: {
                conferenceId: { _eq: $conferenceId }
                startTime: { _lte: $later }
                endTime: { _gte: $now }
                intendedRoomModeName: { _in: [PRERECORDED] }
            }
            order_by: [{ startTime: asc }, { endTime: asc }, { room: { name: asc } }]
        ) {
            ...MonitorLivestreams_PrerecEvent
        }
    }

    fragment MonitorLivestreams_PrerecEvent on schedule_Event {
        id
        conferenceId
        startTime
        endTime
        intendedRoomModeName
        roomId
        room {
            id
            name
            priority
        }
    }

    fragment MonitorLivestreams_Person on schedule_EventProgramPerson {
        id
        roleName
        personId
        eventId
        person {
            id
            name
            affiliation
            registrantId
            registrant {
                id
                userId
            }
        }
    }

    fragment MonitorLivestreams_Event on schedule_Event {
        id
        conferenceId
        intendedRoomModeName
        name
        startTime
        endTime
        roomId
        room {
            id
            name
            priority
        }
        itemId
        item {
            id
            title
        }
        eventPeople {
            ...MonitorLivestreams_Person
        }
        eventVonageSession {
            id
            sessionId
            eventId
            participantStreams {
                id
                registrantId
                vonageStreamType
                vonageSessionId
            }
        }
    }
`;

interface PersonStatus {
    person: MonitorLivestreams_PersonFragment;

    registrantId: string | undefined;
    userId: string | undefined;
    isCameraOrMicConnected: boolean;
    isScreenshareConnected: boolean;
}

interface EventStatus {
    event: MonitorLivestreams_EventFragment;
    startTimeMs: number;
    endTimeMs: number;

    isLive: boolean;
    severityLevel: number;

    previousSeverityLevel: number | undefined;

    people: PersonStatus[];
}

export default function LivestreamMonitoring(): JSX.Element {
    const conference = useConference();
    const { conferencePath } = useAuthParameters();
    const now = useRealTime(1000);
    const nowRoundedDown = roundDownToNearest(now, 60 * 1000);
    const nowRoundedUp = roundUpToNearest(now, 60 * 1000);
    const nowStr = useMemo(() => new Date(nowRoundedDown + 3000).toISOString(), [nowRoundedDown]);
    const laterStr = useMemo(() => new Date(roundUpToNearest(now + 20 * 60 * 1000, 60 * 1000)).toISOString(), [now]);
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
            }),
        []
    );
    const [response] = useMonitorLivestreamsQuery({
        variables: {
            conferenceId: conference.id,
            now: nowStr,
            later: laterStr,
        },
        context,
    });

    const shadow = useColorModeValue("md", "light-md");
    const bgColor = useColorModeValue("gray.200", "gray.600");

    const [liveEvents, setLiveEvents] = useState<EventStatus[]>([]);

    useEffect(() => {
        if (response.data?.liveEvents) {
            const newData = response.data.liveEvents;
            setLiveEvents((oldLiveEvents) =>
                R.sortWith(
                    [
                        (x, y) => x.startTimeMs - y.startTimeMs,
                        (x, y) => x.event.room.priority - y.event.room.priority,
                        (x, y) => x.event.room.name.localeCompare(y.event.room.name),
                    ],
                    newData.map<EventStatus>((event) => {
                        const people = event.eventPeople.map((eventPerson) => {
                            const registrantId: string | undefined = eventPerson.person.registrant?.id ?? undefined;
                            const userId = eventPerson.person.registrant?.userId ?? undefined;
                            const isCameraOrMicConnected =
                                !!registrantId &&
                                !!event.eventVonageSession?.participantStreams.some(
                                    (x) => x.registrantId === registrantId && x.vonageStreamType === "camera"
                                );
                            const isScreenshareConnected =
                                !!registrantId &&
                                !!event.eventVonageSession?.participantStreams.some(
                                    (x) => x.registrantId === registrantId && x.vonageStreamType === "screen"
                                );
                            return {
                                person: eventPerson,
                                registrantId,
                                userId,
                                isCameraOrMicConnected,
                                isScreenshareConnected,
                            };
                        });

                        const startTimeMs = Date.parse(event.startTime);
                        const endTimeMs = Date.parse(event.endTime);

                        const peopleForSeverity = people.filter((x) => !!x.userId);
                        const oldEvent = oldLiveEvents.find((x) => x.event.id === event.id);
                        const previouslyIsLive = !!oldEvent?.isLive;
                        const isLive = startTimeMs <= nowRoundedUp && nowRoundedUp <= endTimeMs;
                        const previousSeverityLevel = oldEvent?.severityLevel;
                        let currentSeverityLevel: number;

                        const atLeastOnePersonListed = peopleForSeverity.length > 0;
                        const atLeastOnePresenterListed = peopleForSeverity.some(
                            (x) => x.person.roleName === Schedule_EventProgramPersonRole_Enum.Presenter
                        );
                        const atLeastOneChairListed = peopleForSeverity.some(
                            (x) => x.person.roleName === Schedule_EventProgramPersonRole_Enum.Chair
                        );
                        const atLeastOnePresenterMicOrCamOn = peopleForSeverity.some(
                            (x) =>
                                x.person.roleName === Schedule_EventProgramPersonRole_Enum.Presenter &&
                                x.isCameraOrMicConnected
                        );
                        const atLeastOneChairMicOrCamOn = peopleForSeverity.some(
                            (x) =>
                                x.person.roleName === Schedule_EventProgramPersonRole_Enum.Chair &&
                                x.isCameraOrMicConnected
                        );

                        if (
                            atLeastOnePersonListed &&
                            (!atLeastOnePresenterListed || atLeastOnePresenterMicOrCamOn) &&
                            (!atLeastOneChairListed || atLeastOneChairMicOrCamOn)
                        ) {
                            currentSeverityLevel = 0;
                        } else if (
                            atLeastOnePresenterMicOrCamOn &&
                            atLeastOneChairListed &&
                            !atLeastOneChairMicOrCamOn
                        ) {
                            currentSeverityLevel = 1;
                        } else if (
                            atLeastOnePresenterListed &&
                            !atLeastOnePresenterMicOrCamOn &&
                            atLeastOneChairMicOrCamOn
                        ) {
                            currentSeverityLevel = 2;
                        } else if (
                            atLeastOnePersonListed &&
                            !atLeastOnePresenterMicOrCamOn &&
                            !atLeastOneChairMicOrCamOn
                        ) {
                            currentSeverityLevel = 3;
                        } else {
                            currentSeverityLevel = 4;
                        }

                        let severityLevel = currentSeverityLevel;
                        if (
                            previouslyIsLive &&
                            previousSeverityLevel !== undefined &&
                            previousSeverityLevel <= 0 &&
                            currentSeverityLevel === 3
                        ) {
                            severityLevel = -2;
                        } else if (
                            previouslyIsLive &&
                            previousSeverityLevel !== undefined &&
                            previousSeverityLevel <= 2 &&
                            currentSeverityLevel === 1
                        ) {
                            severityLevel = -1;
                        }

                        return {
                            event,
                            startTimeMs,
                            endTimeMs,
                            isLive,
                            severityLevel,
                            previousSeverityLevel,
                            people,
                        };
                    })
                )
            );
        }
    }, [nowRoundedUp, response.data?.liveEvents]);

    const listEl = useMemo(() => {
        const eventsByRoom = R.groupBy(
            (x) => x.event.room.id,
            liveEvents.filter((x) => x.endTimeMs > nowRoundedUp)
        );
        const sortedRooms = R.sortWith<{
            readonly id: string;
            readonly name: string;
            readonly priority: number;
        }>(
            [(x, y) => x.priority - y.priority, (x, y) => x.name.localeCompare(y.name)],
            R.uniqBy(
                (x) => x.id,
                liveEvents.map((x) => x.event.room)
            )
        );
        return (
            <>
                <Grid w="100%" templateColumns="repeat(auto-fit, 300px)" gap={2} justifyContent="center">
                    {sortedRooms.map((room) => {
                        const events = eventsByRoom[room.id];
                        if (events) {
                            const sortedEvents = R.sortBy((x) => x.startTimeMs, events);
                            const shouldHighlight = events.some(
                                (x) => x.startTimeMs < nowRoundedDown + 10 * 60 * 1000 && x.severityLevel >= 2
                            );
                            return (
                                <GridItem
                                    key={room.id}
                                    bgColor={bgColor}
                                    shadow={shadow}
                                    p={2}
                                    border={shouldHighlight ? "3px solid" : undefined}
                                    borderColor={shouldHighlight ? "red.400" : undefined}
                                >
                                    <VStack w="100%" alignItems="flex-start" spacing={1}>
                                        <HStack w="100%">
                                            <Text fontSize="sm" mr="auto">
                                                <FAIcon iconStyle="s" icon="link" mb={1} fontSize="80%" />
                                                &nbsp;
                                                <Link as={ReactLink} to={`${conferencePath}/room/${room.id}`}>
                                                    {room.name}
                                                </Link>
                                            </Text>
                                            {shouldHighlight ? (
                                                <Tooltip label="Urgent: An event in this room is not ready.">
                                                    <FAIcon
                                                        iconStyle="s"
                                                        icon="exclamation-triangle"
                                                        color="red.400"
                                                        mb={1}
                                                        pr={1}
                                                        fontSize="xl"
                                                    />
                                                </Tooltip>
                                            ) : undefined}
                                        </HStack>
                                        <HStack w="100%" p={0} m={0} pl={3} overflowX="auto" overflowY="hidden">
                                            {!sortedEvents[0]?.isLive ? (
                                                <Tooltip label="No currently live backstage">
                                                    <FAIcon
                                                        iconStyle="r"
                                                        icon={"dot-circle"}
                                                        color={"gray.400"}
                                                        fontSize={"4xl"}
                                                        lineHeight={0}
                                                    />
                                                </Tooltip>
                                            ) : undefined}
                                            {sortedEvents.map((event, idx) => (
                                                <Link href={`#${event.event.id}`} key={event.event.id}>
                                                    <Tooltip
                                                        label={
                                                            <>
                                                                <Text mb={1}>
                                                                    <chakra.span fontWeight="bold" mr={3}>
                                                                        {new Date(
                                                                            event.event.startTime
                                                                        ).toLocaleTimeString(undefined, {
                                                                            hour: "2-digit",
                                                                            minute: "2-digit",
                                                                        })}
                                                                        {" to "}
                                                                        {new Date(
                                                                            event.event.endTime
                                                                        ).toLocaleTimeString(undefined, {
                                                                            hour: "2-digit",
                                                                            minute: "2-digit",
                                                                        })}
                                                                    </chakra.span>
                                                                    {event.severityLevel === -2
                                                                        ? "Backstage appears to have ended early."
                                                                        : event.severityLevel === -1
                                                                        ? "Backstage appears to be ok. Chair may have chosen to leave."
                                                                        : event.severityLevel === 0
                                                                        ? "Backstage is ok."
                                                                        : event.severityLevel === 1
                                                                        ? "Presenter is ready but the chair is not."
                                                                        : event.severityLevel === 2
                                                                        ? "No presenter is available but the chair is ready."
                                                                        : event.severityLevel === 3
                                                                        ? "Neither a presenter nor a chair is ready."
                                                                        : "No registered people are listed!"}
                                                                </Text>
                                                                <Text>
                                                                    {event.event.name +
                                                                        (event.event.item
                                                                            ? `: ${event.event.item.title}`
                                                                            : "")}
                                                                </Text>
                                                            </>
                                                        }
                                                    >
                                                        <FAIcon
                                                            lineHeight={0}
                                                            iconStyle="s"
                                                            icon={
                                                                event.severityLevel === -2
                                                                    ? "stop-circle"
                                                                    : event.severityLevel === -1
                                                                    ? "play-circle"
                                                                    : event.severityLevel === 0
                                                                    ? "check-circle"
                                                                    : event.severityLevel === 1
                                                                    ? "question-circle"
                                                                    : event.severityLevel === 2
                                                                    ? "exclamation-triangle"
                                                                    : event.severityLevel === 3
                                                                    ? "times-circle"
                                                                    : "exclamation"
                                                            }
                                                            color={
                                                                event.severityLevel === -2
                                                                    ? "gray.400"
                                                                    : event.severityLevel === -1
                                                                    ? "green.400"
                                                                    : event.severityLevel === 0
                                                                    ? "green.400"
                                                                    : event.severityLevel === 1
                                                                    ? "yellow.600"
                                                                    : event.severityLevel === 2
                                                                    ? "yellow.600"
                                                                    : event.severityLevel === 3
                                                                    ? "red.400"
                                                                    : "red.400"
                                                            }
                                                            fontSize={idx === 0 && event.isLive ? "4xl" : "lg"}
                                                        />
                                                    </Tooltip>
                                                </Link>
                                            ))}
                                        </HStack>
                                        {shouldHighlight ? (
                                            <Text pt={1} color="red" fontSize="sm" textAlign="center" w="100%">
                                                Urgent: An event in this room is not ready.
                                            </Text>
                                        ) : undefined}
                                    </VStack>
                                </GridItem>
                            );
                        }
                        return <></>;
                    })}
                </Grid>
                <List spacing={4}>
                    {liveEvents.map((event) => (
                        <ListItem key={event.event.id} bgColor={bgColor} shadow={shadow} p={4}>
                            <BackstageTile event={event.event} />
                        </ListItem>
                    ))}
                </List>
            </>
        );
    }, [bgColor, conferencePath, liveEvents, nowRoundedDown, nowRoundedUp, shadow]);

    const secondsToNextRefresh = Math.round((nowRoundedUp - now) / 1000);

    const [liveRooms, setLiveRooms] = useState<{ id: string; name: string }[]>([]);
    useEffect(() => {
        if (response.data?.liveEvents) {
            const newLiveRoomsIds = R.sortWith(
                [(x, y) => x.priority - y.priority, (x, y) => x.name.localeCompare(y.name)],
                R.uniq([
                    ...response.data?.liveEvents
                        .filter((x) => Date.parse(x.startTime) <= nowRoundedUp + 10 * 60 * 1000)
                        .map((x) => x.room),
                    ...response.data?.prerecordedEvents
                        .filter((x) => Date.parse(x.startTime) <= nowRoundedUp + 10 * 60 * 1000)
                        .map((x) => x.room),
                ])
            );
            setLiveRooms((oldIds) =>
                !oldIds ||
                oldIds.length !== newLiveRoomsIds.length ||
                newLiveRoomsIds.some((x, idx) => idx >= oldIds.length || oldIds[idx].id !== x.id)
                    ? newLiveRoomsIds
                    : oldIds
            );
        }
    }, [nowRoundedUp, response.data?.liveEvents, response.data?.prerecordedEvents]);

    const roomTiles = useMemo(
        () =>
            liveRooms.map((room) => (
                <GridItem key={room.id}>
                    <RoomTile id={room.id as string} name={room.name} />
                </GridItem>
            )),
        [liveRooms]
    );

    return (
        <VStack w="100%" spacing={4}>
            <Center>
                <Text>Stream previews will show here 10 minutes before the stream is live.</Text>
            </Center>
            <Grid w="100%" templateColumns="repeat(auto-fit, 300px)" gap={1} justifyContent="center">
                {roomTiles}
            </Grid>
            <Divider />
            <Center h="60px">
                {response.fetching ? (
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
            <Center>
                <Text>
                    Backstage statuses will show here 20 minutes before they are live (i.e. when they are open for
                    people to join).
                </Text>
            </Center>
            {listEl}
        </VStack>
    );
}

function RoomTile({ id, name }: { id: string; name: string }): JSX.Element {
    const { conferencePath } = useAuthParameters();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
            }),
        []
    );
    const [roomChannelStackResponse] = useRoomPage_GetRoomChannelStackQuery({
        variables: {
            roomId: id,
        },
        context,
    });

    const hlsUri = useMemo(() => {
        if (!roomChannelStackResponse.data?.video_ChannelStack?.[0]) {
            return null;
        }
        const finalUri = new URL(roomChannelStackResponse.data.video_ChannelStack[0].endpointUri);
        finalUri.hostname = roomChannelStackResponse.data.video_ChannelStack[0].cloudFrontDomain;
        return finalUri.toString();
    }, [roomChannelStackResponse.data?.video_ChannelStack]);

    return (
        <Box pos="relative" maxW="300px" border="3px solid" borderColor="gray.400">
            <Text p={1} fontSize="sm">
                <FAIcon iconStyle="s" icon="link" mb={1} fontSize="80%" />
                &nbsp;
                <Link as={ReactLink} to={`${conferencePath}/room/${id}`}>
                    {name}
                </Link>
            </Text>
            <Suspense fallback={<Spinner />}>
                {hlsUri ? (
                    <HlsPlayer roomId={id} canPlay={true} hlsUri={hlsUri} initialMute={true} expectLivestream={true} />
                ) : (
                    <Spinner />
                )}
            </Suspense>
        </Box>
    );
}

function BackstageTile({ event }: { event: MonitorLivestreams_EventFragment }): JSX.Element {
    const conference = useConference();
    const { conferencePath } = useAuthParameters();
    const { hasCopied, onCopy } = useClipboard(event.id);
    const now = useRealTime(60 * 1000);

    const startDate = useMemo(() => new Date(event.startTime), [event.startTime]);
    const endDate = useMemo(() => new Date(event.endTime), [event.endTime]);
    const isFuture = startDate.getTime() > now;
    const isLive = startDate.getTime() <= now && now < endDate.getTime() - 5000;

    const presence = usePresenceState();
    const [presences, setPresences] = useState<Set<string>>(new Set());
    useEffect(() => {
        const unobserve = presence.observePage(
            `${conferencePath}/room/${event.room.id}`,
            conference.slug,
            (newPresences) => {
                setPresences(new Set(newPresences));
            }
        );
        return () => {
            unobserve();
        };
    }, [conferencePath, conference.slug, event.room.id, presence]);

    const itemEl = useMemo(
        () =>
            !isLive && !isFuture ? (
                <>Ended</>
            ) : (
                <VStack spacing={2} justifyContent="flex-start" alignItems="flex-start" id={event.id}>
                    <Text fontSize="sm">
                        {isLive ? (
                            <>
                                <FAIcon
                                    icon="broadcast-tower"
                                    iconStyle="s"
                                    fontSize="sm"
                                    color="red.400"
                                    mb={1}
                                    mr={2}
                                />{" "}
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
                        <Link as={ReactLink} to={`${conferencePath}/room/${event.room.id}`}>
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
                                <Link as={ReactLink} to={`${conferencePath}/item/${event.item.id}`}>
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
                                {R.sortWith(
                                    [
                                        (x, y) => y.roleName.localeCompare(x.roleName),
                                        (x, y) => x.person.name.localeCompare(y.person.name),
                                    ],
                                    event.eventPeople
                                ).map((eventPerson) => {
                                    const registrantId = eventPerson.person.registrant?.id;
                                    const userId = eventPerson.person.registrant?.userId;
                                    const isPresent = userId && presences.has(userId);
                                    const isCameraOrMicConnected =
                                        !!registrantId &&
                                        !!event.eventVonageSession?.participantStreams.some(
                                            (x) => x.registrantId === registrantId && x.vonageStreamType === "camera"
                                        );
                                    const isScreenshareConnected =
                                        !!registrantId &&
                                        !!event.eventVonageSession?.participantStreams.some(
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
                                                    {eventPerson.roleName[0] +
                                                        eventPerson.roleName.substr(1).toLowerCase()}
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
                                                        {isPresent || isCameraOrMicConnected ? (
                                                            <Tooltip label="Present on the room page">
                                                                <FAIcon
                                                                    iconStyle="s"
                                                                    icon="street-view"
                                                                    color="green.400"
                                                                />
                                                            </Tooltip>
                                                        ) : (
                                                            <Tooltip label="Might not be present on the room page">
                                                                <FAIcon
                                                                    iconStyle="s"
                                                                    icon="mask"
                                                                    color={userId ? "yellow.600" : "gray.400"}
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
                                                                    color={userId ? "red.400" : "gray.400"}
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
                                                                <FAIcon
                                                                    iconStyle="s"
                                                                    icon="desktop"
                                                                    color="green.400"
                                                                />
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
            conferencePath,
            isLive,
            isFuture,
            event.id,
            event.room.id,
            event.room.name,
            event.eventVonageSession,
            event.name,
            event.item,
            event.eventPeople,
            startDate,
            endDate,
            onCopy,
            hasCopied,
            presences,
        ]
    );
    return itemEl;
}
