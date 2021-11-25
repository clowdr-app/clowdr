import { ChevronDownIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    Heading,
    HStack,
    ListItem,
    Menu,
    MenuButton,
    MenuGroup,
    MenuItem,
    MenuList,
    Spinner,
    Stat,
    StatGroup,
    StatHelpText,
    StatLabel,
    StatNumber,
    Table,
    Tbody,
    Td,
    Text,
    Th,
    Thead,
    Tr,
    UnorderedList,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import Papa from "papaparse";
import React, { useCallback, useMemo } from "react";
import { gql } from "urql";
import { useConferenceStatsQuery } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import { roundDownToNearest, roundUpToNearest } from "../../../Generic/MathUtils";
import { makeContext } from "../../../GQL/make-context";
import { useTitle } from "../../../Utils/useTitle";
import RequireRole from "../../RequireRole";
import { useConference } from "../../useConference";

gql`
    query ConferenceStats($id: uuid!) {
        conference_Conference_by_pk(id: $id) {
            id
            completedRegistrationsStat {
                count
                id
            }
            items(where: { stats: {} }) {
                id
                title
                conferenceId
                stats(order_by: [{ updated_at: asc }]) {
                    id
                    itemId
                    viewCount
                    updated_at
                }
                elements(where: { typeName: { _in: [VIDEO_BROADCAST, VIDEO_PREPUBLISH, VIDEO_FILE] }, stats: {} }) {
                    id
                    name
                    typeName
                    itemId
                    stats(order_by: [{ updated_at: asc }]) {
                        id
                        elementId
                        viewCount
                        updated_at
                    }
                }
            }
            rooms(where: { _or: [{ managementModeName: { _eq: PUBLIC } }, { events: {} }] }) {
                id
                name
                managementModeName
                presenceCounts(order_by: [{ created_at: asc }]) {
                    created_at
                    count
                }
                stats(order_by: [{ created_at: asc }]) {
                    created_at
                    hlsViewCount
                    roomId
                }
                events(order_by: [{ startTime: asc }, { endTime: asc }]) {
                    id
                    name
                    roomId
                    itemId
                    item {
                        id
                        title
                    }
                    exhibitionId
                    exhibition {
                        id
                        name
                    }

                    startTime
                    endTime

                    intendedRoomModeName
                }
            }
        }
    }
`;

type RoomDatum = {
    events: any[];
    presenceMax: number;
    presenceAverage: number;
    streamViews: number;
};

type RoomData = Record<string, RoomDatum> & {
    time: string;
};

type VideoData = {
    time: string;
    count: number;
};

type RoomStatsDownloadKind =
    | {
          kind: "csv";
          field: "presenceMax" | "presenceAverage" | "streamViews";
          granularity?: number;
      }
    | { kind: "json"; granularity?: number };

type VideoStatsDownloadKind =
    | {
          kind: "csv";
          granularity?: number;
      }
    | { kind: "json"; granularity?: number };

function JSDateToExcelDate(inDate: Date) {
    const returnDateTime =
        25569.0 + (inDate.getTime() - inDate.getTimezoneOffset() * 60 * 1000) / (1000 * 60 * 60 * 24);
    return returnDateTime.toString().substr(0, 20);
}

export default function AnalyticsDashboard(): JSX.Element {
    const conference = useConference();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
            }),
        []
    );
    const [statsResponse] = useConferenceStatsQuery({
        variables: {
            id: conference.id,
        },
        context,
    });

    const title = useTitle(`Analytics for ${conference.shortName}`);

    const totalItemViews = useMemo(() => {
        let total = 0;
        if (statsResponse.data?.conference_Conference_by_pk?.items) {
            for (const item of statsResponse.data.conference_Conference_by_pk.items) {
                for (const stat of item.stats) {
                    total += stat.viewCount;
                }
            }
        }
        return total;
    }, [statsResponse.data?.conference_Conference_by_pk?.items]);

    const { totalVideoPlaybacks, popularVideosByPlaybacks } = useMemo(() => {
        let total = 0;
        const videosByPlaybacks: {
            itemTitle: string;
            elementName: string;
            count: number;
        }[] = [];
        if (statsResponse.data?.conference_Conference_by_pk?.items) {
            for (const item of statsResponse.data.conference_Conference_by_pk.items) {
                for (const element of item.elements) {
                    let elementTotal = 0;
                    for (const stat of element.stats) {
                        elementTotal += stat.viewCount;
                    }
                    total += elementTotal;
                    videosByPlaybacks.push({
                        itemTitle: item.title,
                        elementName: element.name,
                        count: elementTotal,
                    });
                }
            }
        }
        return {
            totalVideoPlaybacks: total,
            popularVideosByPlaybacks: videosByPlaybacks.sort((x, y) => y.count - x.count).slice(0, 5),
        };
    }, [statsResponse.data?.conference_Conference_by_pk?.items]);

    const totalStreamPlaybacks = useMemo(() => {
        let total = 0;
        if (statsResponse.data?.conference_Conference_by_pk?.rooms) {
            for (const room of statsResponse.data.conference_Conference_by_pk.rooms) {
                for (const stat of room.stats) {
                    total += stat.hlsViewCount;
                }
            }
        }
        return total;
    }, [statsResponse.data?.conference_Conference_by_pk?.rooms]);

    const videos_ComputeDownloadableData = useCallback(
        (boundaryMs: number) => {
            if (statsResponse.data?.conference_Conference_by_pk?.items) {
                const items = statsResponse.data.conference_Conference_by_pk.items;

                let earliestMs = Number.POSITIVE_INFINITY;
                let latestMs = Number.NEGATIVE_INFINITY;
                const itemPointers: {
                    elementPointers: {
                        stats: number;
                    }[];
                }[] = [];

                for (const item of items) {
                    itemPointers.push({
                        elementPointers: item.elements.map((_element) => ({ stats: 0 })),
                    });

                    for (const element of item.elements) {
                        for (const stat of element.stats) {
                            if (stat.updated_at) {
                                const updatedAtMs = Date.parse(stat.updated_at);
                                earliestMs = Math.min(earliestMs, updatedAtMs);
                                latestMs = Math.max(latestMs, updatedAtMs);
                            }
                        }
                    }
                }

                const output: VideoData[] = [];
                const earliestRoundedDownMs = roundDownToNearest(earliestMs, boundaryMs);
                const latestRoundedUpMs = roundUpToNearest(latestMs, boundaryMs);
                for (
                    let currentStartMs = earliestRoundedDownMs;
                    currentStartMs <= latestRoundedUpMs;
                    currentStartMs += boundaryMs
                ) {
                    const data: VideoData = {
                        time: new Date(currentStartMs).toISOString(),
                        count: 0,
                    };
                    output.push(data);

                    const currentEndMs = currentStartMs + boundaryMs;
                    for (let itemIdx = 0; itemIdx < items.length; itemIdx++) {
                        const item = items[itemIdx];
                        for (let elementIdx = 0; elementIdx < item.elements.length; elementIdx++) {
                            const element = item.elements[elementIdx];
                            const pointers = itemPointers[itemIdx].elementPointers[elementIdx];

                            while (pointers.stats < element.stats.length) {
                                const stat = element.stats[pointers.stats];
                                if (stat.updated_at && stat.viewCount !== undefined) {
                                    const updatedAtMs = Date.parse(stat.updated_at);
                                    if (updatedAtMs >= currentEndMs) {
                                        break;
                                    } else {
                                        if (updatedAtMs >= currentStartMs) {
                                            data.count += stat.viewCount;
                                        }

                                        pointers.stats++;
                                    }
                                } else {
                                    pointers.stats++;
                                }
                            }
                        }
                    }
                }

                return output;
            }
            return null;
        },
        [statsResponse.data?.conference_Conference_by_pk?.items]
    );
    const videos_DownloadData = useCallback(
        (kind: VideoStatsDownloadKind) => {
            const videos_DownloadableData = videos_ComputeDownloadableData(kind.granularity ?? 5 * 60 * 1000);
            if (videos_DownloadableData) {
                if (kind.kind === "csv") {
                    const remappedData: any[] = [];
                    for (const data of videos_DownloadableData) {
                        const newData: any = {
                            time: JSDateToExcelDate(new Date(data.time)),
                            count: data.count,
                        };
                        remappedData.push(newData);
                    }
                    const csvText = Papa.unparse(remappedData, {
                        columns: ["time", "count"],
                    });

                    const csvData = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
                    let csvURL: string | null = null;
                    const now = new Date();
                    const fileName = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now
                        .getDate()
                        .toString()
                        .padStart(2, "0")}T${now.getHours().toString().padStart(2, "0")}-${now
                        .getMinutes()
                        .toString()
                        .padStart(2, "0")} - Video Analytics.csv`;

                    csvURL = window.URL.createObjectURL(csvData);

                    const tempLink = document.createElement("a");
                    tempLink.href = csvURL ?? "";
                    tempLink.setAttribute("download", fileName);
                    tempLink.click();
                } else if (kind.kind === "json") {
                    const jsonText = JSON.stringify(videos_DownloadableData, null, 2);

                    const jsonData = new Blob([jsonText], { type: "	application/json;charset=utf-8;" });
                    let jsonURL: string | null = null;
                    const now = new Date();
                    const fileName = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now
                        .getDate()
                        .toString()
                        .padStart(2, "0")}T${now.getHours().toString().padStart(2, "0")}-${now
                        .getMinutes()
                        .toString()
                        .padStart(2, "0")} - Video Analytics.json`;

                    jsonURL = window.URL.createObjectURL(jsonData);

                    const tempLink = document.createElement("a");
                    tempLink.href = jsonURL ?? "";
                    tempLink.setAttribute("download", fileName);
                    tempLink.click();
                }
            }
        },
        [videos_ComputeDownloadableData]
    );

    const presence_ComputeDownloadableData = useCallback(
        (boundaryMs: number) => {
            if (statsResponse.data?.conference_Conference_by_pk?.rooms) {
                const rooms = statsResponse.data.conference_Conference_by_pk.rooms;

                let earliestMs = Number.POSITIVE_INFINITY;
                let latestMs = Number.NEGATIVE_INFINITY;
                const roomArrayPointers: {
                    event: number;
                    presence: number;
                    hlsViews: number;
                }[] = [];

                for (const room of rooms) {
                    roomArrayPointers.push({
                        event: 0,
                        presence: 0,
                        hlsViews: 0,
                    });

                    for (const stat of room.presenceCounts) {
                        if (stat.created_at) {
                            const createdAtMs = Date.parse(stat.created_at);
                            earliestMs = Math.min(earliestMs, createdAtMs);
                            latestMs = Math.max(latestMs, createdAtMs);
                        }
                    }
                }

                const output: RoomData[] = [];
                const earliestRoundedDownMs = roundDownToNearest(earliestMs, boundaryMs);
                const latestRoundedUpMs = roundUpToNearest(latestMs, boundaryMs);
                for (
                    let currentStartMs = earliestRoundedDownMs;
                    currentStartMs <= latestRoundedUpMs;
                    currentStartMs += boundaryMs
                ) {
                    const data: RoomData = {
                        time: new Date(currentStartMs).toISOString(),
                    } as any;
                    output.push(data);

                    const currentEndMs = currentStartMs + boundaryMs;
                    for (let roomIdx = 0; roomIdx < rooms.length; roomIdx++) {
                        const room = rooms[roomIdx];
                        const pointers = roomArrayPointers[roomIdx];

                        const events: any[] = [];
                        let presenceAverage = 0;
                        let presenceMax = 0;
                        let streamViews = 0;
                        while (pointers.event < room.events.length) {
                            const event = room.events[pointers.event];
                            const eventStartMs = Date.parse(event.startTime);
                            if (eventStartMs >= currentEndMs) {
                                // Start in the future
                                break;
                            }
                            const eventEndMs = Date.parse(event.endTime);
                            if (eventEndMs < currentStartMs) {
                                // Ended in the past
                                pointers.event++;
                            } else {
                                // Ongoing
                                events.push(event);
                                break;
                            }
                        }

                        let presenceCountsIncluded = 0;
                        while (pointers.presence < room.presenceCounts.length) {
                            const stat = room.presenceCounts[pointers.presence];
                            if (stat.created_at && stat.count !== undefined) {
                                const createdAtMs = Date.parse(stat.created_at);
                                if (createdAtMs >= currentEndMs) {
                                    break;
                                } else {
                                    if (createdAtMs >= currentStartMs && stat.count > 0) {
                                        presenceMax = Math.max(presenceMax, stat.count);
                                        presenceAverage += stat.count;
                                        presenceCountsIncluded++;
                                    }

                                    pointers.presence++;
                                }
                            } else {
                                pointers.presence++;
                            }
                        }
                        if (presenceCountsIncluded > 0) {
                            presenceAverage /= presenceCountsIncluded;
                        }

                        while (pointers.hlsViews < room.stats.length) {
                            const stat = room.stats[pointers.hlsViews];
                            if (stat.created_at && stat.hlsViewCount !== undefined) {
                                const createdAtMs = Date.parse(stat.created_at);
                                if (createdAtMs >= currentEndMs) {
                                    break;
                                } else {
                                    if (createdAtMs >= currentStartMs) {
                                        streamViews += stat.hlsViewCount;
                                    }

                                    pointers.hlsViews++;
                                }
                            } else {
                                pointers.hlsViews++;
                            }
                        }

                        if (events.length > 0 || presenceAverage || presenceMax || streamViews) {
                            const datum: RoomDatum = {
                                events,
                                presenceAverage: Math.round(10 * presenceAverage) / 10,
                                presenceMax,
                                streamViews,
                            };
                            data[room.name] = datum;
                        }
                    }
                }

                return output;
            }
            return null;
        },
        [statsResponse.data?.conference_Conference_by_pk?.rooms]
    );
    const presence_DownloadData = useCallback(
        (kind: RoomStatsDownloadKind) => {
            const presence_DownloadableData = presence_ComputeDownloadableData(kind.granularity ?? 5 * 60 * 1000);
            if (presence_DownloadableData && statsResponse.data?.conference_Conference_by_pk?.rooms) {
                if (kind.kind === "csv") {
                    const remappedData: any[] = [];
                    const roomNames: Set<string> = new Set();
                    for (const data of presence_DownloadableData) {
                        const newData: any = {
                            time: JSDateToExcelDate(new Date(data.time)),
                        };
                        let doPush = false;
                        for (const roomName in data) {
                            if (
                                roomName !== "time" &&
                                roomName in data &&
                                data[roomName] &&
                                data[roomName][kind.field]
                            ) {
                                newData[roomName] = data[roomName][kind.field];
                                roomNames.add(roomName);
                                doPush = true;
                            }
                        }
                        if (doPush || kind.field !== "streamViews") {
                            remappedData.push(newData);
                        }
                    }
                    const csvText = Papa.unparse(remappedData, {
                        columns: ["time", ...roomNames],
                    });

                    const csvData = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
                    let csvURL: string | null = null;
                    const now = new Date();
                    const fileName = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now
                        .getDate()
                        .toString()
                        .padStart(2, "0")}T${now.getHours().toString().padStart(2, "0")}-${now
                        .getMinutes()
                        .toString()
                        .padStart(2, "0")} - Room Analytics - ${kind.field}.csv`;

                    csvURL = window.URL.createObjectURL(csvData);

                    const tempLink = document.createElement("a");
                    tempLink.href = csvURL ?? "";
                    tempLink.setAttribute("download", fileName);
                    tempLink.click();
                } else if (kind.kind === "json") {
                    const jsonText = JSON.stringify(presence_DownloadableData, null, 2);

                    const jsonData = new Blob([jsonText], { type: "	application/json;charset=utf-8;" });
                    let jsonURL: string | null = null;
                    const now = new Date();
                    const fileName = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now
                        .getDate()
                        .toString()
                        .padStart(2, "0")}T${now.getHours().toString().padStart(2, "0")}-${now
                        .getMinutes()
                        .toString()
                        .padStart(2, "0")} - Room Analytics.json`;

                    jsonURL = window.URL.createObjectURL(jsonData);

                    const tempLink = document.createElement("a");
                    tempLink.href = jsonURL ?? "";
                    tempLink.setAttribute("download", fileName);
                    tempLink.click();
                }
            }
        },
        [presence_ComputeDownloadableData, statsResponse.data?.conference_Conference_by_pk?.rooms]
    );

    return (
        <RequireRole organizerRole componentIfDenied={<PageNotFound />}>
            {title}
            <Heading mt={4} as="h1" fontSize="4xl">
                Manage {conference.shortName}
            </Heading>
            <Heading id="page-heading" as="h2" fontSize="2xl" fontStyle="italic">
                Analytics
            </Heading>
            <Text fontStyle="italic">Data updates every 24 hours.</Text>
            <StatGroup w="100%" maxW="4xl" pt={8}>
                <Stat>
                    <StatLabel fontSize="xl">Item views</StatLabel>
                    <StatNumber fontSize="4xl">
                        {statsResponse.data?.conference_Conference_by_pk ? totalItemViews : <Spinner />}
                    </StatNumber>
                    <StatHelpText>(3 seconds or more looking at an item.)</StatHelpText>
                </Stat>
                <Stat mx={8}>
                    <StatLabel fontSize="xl">Video playbacks</StatLabel>
                    <StatNumber fontSize="4xl">
                        {statsResponse.data?.conference_Conference_by_pk ? totalVideoPlaybacks : <Spinner />}
                    </StatNumber>
                    <StatHelpText>
                        (15 seconds or more watching a video;
                        <br /> excludes live-streams, includes recordings.)
                    </StatHelpText>
                </Stat>
                <Stat>
                    <StatLabel fontSize="xl">Live-stream playbacks</StatLabel>
                    <StatNumber fontSize="4xl">
                        {statsResponse.data?.conference_Conference_by_pk ? totalStreamPlaybacks : <Spinner />}
                    </StatNumber>
                    <StatHelpText>(15 seconds or more watching a live-stream.)</StatHelpText>
                </Stat>
            </StatGroup>
            <Box>&lt; More information will be coming soon &gt;</Box>
            {popularVideosByPlaybacks?.length ? (
                <VStack alignItems="flex-start">
                    <Text fontWeight="bold">The top 5 most popular videos are:</Text>
                    <Table spacingX="40px" spacingY="20px" overflowX="auto">
                        <Thead>
                            <Tr>
                                <Th>Item</Th>
                                <Th>Element</Th>
                                <Th>Playbacks</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {popularVideosByPlaybacks?.map((stat) => (
                                <Tr key={stat.itemTitle + ": " + stat.elementName}>
                                    <Td>{stat.itemTitle}</Td>
                                    <Td>{stat.elementName}</Td>
                                    <Td>{stat.count}</Td>
                                </Tr>
                            ))}
                        </Tbody>
                    </Table>
                </VStack>
            ) : undefined}
            <VStack alignItems="flex-start">
                <Text fontWeight="bold">Please note:</Text>
                <UnorderedList>
                    <ListItem>
                        In CSV format, times are provided as Excel-compatible date/time numbers. When opening the CSV in
                        Excel, select the time column and set the cell format to &ldquo;Custom&rdquo; with type
                        &ldquo;dd/mm/yyyy hh:mm&rdquo;
                    </ListItem>
                    <ListItem>
                        Aggregating the available raw data via the buttons below can take a lot of time and slow your
                        browser down while the calculation is performed. Please be patient, particularly if you had a
                        long, large or busy conference.
                    </ListItem>
                </UnorderedList>
            </VStack>
            <HStack flexWrap="wrap">
                <Menu>
                    <MenuButton as={Button} colorScheme="purple">
                        Download room statistics <ChevronDownIcon />
                    </MenuButton>
                    <MenuList>
                        <MenuGroup title="CSV: Presence maximums">
                            <MenuItem
                                onClick={() =>
                                    presence_DownloadData({
                                        kind: "csv",
                                        field: "presenceMax",
                                        granularity: 5 * 60 * 1000,
                                    })
                                }
                            >
                                5 min granularity
                            </MenuItem>
                            <MenuItem
                                onClick={() =>
                                    presence_DownloadData({
                                        kind: "csv",
                                        field: "presenceMax",
                                        granularity: 60 * 60 * 1000,
                                    })
                                }
                            >
                                1 hour granularity
                            </MenuItem>
                            <MenuItem
                                onClick={() =>
                                    presence_DownloadData({
                                        kind: "csv",
                                        field: "presenceMax",
                                        granularity: 24 * 60 * 60 * 1000,
                                    })
                                }
                            >
                                1 day granularity
                            </MenuItem>
                        </MenuGroup>
                        <MenuGroup title="CSV: Presence averages">
                            <MenuItem
                                onClick={() =>
                                    presence_DownloadData({
                                        kind: "csv",
                                        field: "presenceAverage",
                                        granularity: 5 * 60 * 1000,
                                    })
                                }
                            >
                                5 min granularity
                            </MenuItem>
                            <MenuItem
                                onClick={() =>
                                    presence_DownloadData({
                                        kind: "csv",
                                        field: "presenceAverage",
                                        granularity: 60 * 60 * 1000,
                                    })
                                }
                            >
                                1 hour granularity
                            </MenuItem>
                            <MenuItem
                                onClick={() =>
                                    presence_DownloadData({
                                        kind: "csv",
                                        field: "presenceAverage",
                                        granularity: 24 * 60 * 60 * 1000,
                                    })
                                }
                            >
                                1 day granularity
                            </MenuItem>
                        </MenuGroup>
                        <MenuGroup title="CSV: Stream playbacks">
                            <MenuItem
                                onClick={() =>
                                    presence_DownloadData({
                                        kind: "csv",
                                        field: "streamViews",
                                        granularity: 5 * 60 * 1000,
                                    })
                                }
                            >
                                5 min granularity
                            </MenuItem>
                            <MenuItem
                                onClick={() =>
                                    presence_DownloadData({
                                        kind: "csv",
                                        field: "streamViews",
                                        granularity: 60 * 60 * 1000,
                                    })
                                }
                            >
                                1 hour granularity
                            </MenuItem>
                            <MenuItem
                                onClick={() =>
                                    presence_DownloadData({
                                        kind: "csv",
                                        field: "streamViews",
                                        granularity: 24 * 60 * 60 * 1000,
                                    })
                                }
                            >
                                1 day granularity
                            </MenuItem>
                        </MenuGroup>
                        <MenuItem
                            onClick={() =>
                                presence_DownloadData({
                                    kind: "json",
                                })
                            }
                        >
                            JSON: All structured data
                        </MenuItem>
                    </MenuList>
                </Menu>

                <Menu>
                    <MenuButton as={Button} colorScheme="purple">
                        Download video statistics <ChevronDownIcon />
                    </MenuButton>
                    <MenuList>
                        <MenuGroup title="CSV: Video playbacks">
                            <MenuItem
                                onClick={() =>
                                    videos_DownloadData({
                                        kind: "csv",
                                        granularity: 5 * 60 * 1000,
                                    })
                                }
                            >
                                5 min granularity
                            </MenuItem>
                            <MenuItem
                                onClick={() =>
                                    videos_DownloadData({
                                        kind: "csv",
                                        granularity: 60 * 60 * 1000,
                                    })
                                }
                            >
                                1 hour granularity
                            </MenuItem>
                            <MenuItem
                                onClick={() =>
                                    videos_DownloadData({
                                        kind: "csv",
                                        granularity: 24 * 60 * 60 * 1000,
                                    })
                                }
                            >
                                1 day granularity
                            </MenuItem>
                        </MenuGroup>
                        <MenuItem
                            onClick={() =>
                                videos_DownloadData({
                                    kind: "json",
                                })
                            }
                        >
                            JSON: All structured data
                        </MenuItem>
                    </MenuList>
                </Menu>
            </HStack>
        </RequireRole>
    );
}
