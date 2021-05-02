import {
    Center,
    Flex,
    Heading,
    HStack,
    Input,
    InputGroup,
    InputLeftAddon,
    InputRightElement,
    SimpleGrid,
    Spacer,
    Text,
    VStack,
} from "@chakra-ui/react";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RoomListRoomDetailsFragment, Room_ManagementMode_Enum } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import FAIcon from "../../../Icons/FAIcon";
import PageCountText from "../../../Realtime/PageCountText";
import useRoomParticipants from "../../../Room/useRoomParticipants";
import { useConference } from "../../useConference";
import { Participants } from "./RoomParticipants";

interface Props {
    rooms: readonly RoomListRoomDetailsFragment[];
    layout: { type: "grid"; title: string } | { type: "list" };
    limit?: number;
    onClick?: () => void;
    noRoomsMessage?: string;
    children?: React.ReactChild | React.ReactChildren;
}

export function RoomList({ rooms, layout, limit, onClick, noRoomsMessage, children }: Props): JSX.Element {
    const conference = useConference();
    const roomParticipants = useRoomParticipants();

    const [search, setSearch] = useState<string>("");

    const sortedRooms = useMemo(
        () =>
            R.sortWith(
                [
                    R.descend((room) =>
                        !roomParticipants
                            ? Number.NEGATIVE_INFINITY
                            : roomParticipants.filter((p) => p.roomId === room.id).length
                    ),
                    R.ascend((room) => room.priority),
                    R.ascend((room) => room.name),
                ],
                rooms
            ),
        [roomParticipants, rooms]
    );

    const toButtonContents = useCallback(
        (room: RoomListRoomDetailsFragment) => {
            if (layout.type === "grid") {
                return (
                    <>
                        <Center flexWrap="wrap" mt={1} mb={2} mx={2}>
                            {room.managementModeName === Room_ManagementMode_Enum.Private ? (
                                <FAIcon icon="lock" iconStyle="s" textAlign="center" />
                            ) : room.managementModeName === Room_ManagementMode_Enum.Dm ? (
                                <FAIcon icon="envelope" iconStyle="s" textAlign="center" />
                            ) : (
                                <></>
                            )}
                            <Text
                                px={5}
                                textAlign="left"
                                whiteSpace="normal"
                                overflow="hidden"
                                title={room.name}
                                noOfLines={2}
                            >
                                {room.name}
                            </Text>
                            <PageCountText path={`/conference/${conference.slug}/room/${room.id}`} />
                        </Center>
                        <Participants roomId={room.id} />
                    </>
                );
            } else {
                return (
                    <VStack spacing={1} width="100%" px={2}>
                        <HStack width="100%" fontSize="sm" my={"3px"}>
                            {room.managementModeName === Room_ManagementMode_Enum.Private ? (
                                <FAIcon icon="lock" iconStyle="s" textAlign="center" />
                            ) : room.managementModeName === Room_ManagementMode_Enum.Dm ? (
                                <FAIcon icon="envelope" iconStyle="s" textAlign="center" />
                            ) : (
                                <FAIcon icon="mug-hot" iconStyle="s" textAlign="center" />
                            )}
                            <Text
                                textAlign="left"
                                textOverflow="ellipsis"
                                whiteSpace="normal"
                                overflow="hidden"
                                title={room.name}
                            >
                                {room.name}
                            </Text>
                            <Spacer />
                            <PageCountText path={`/conference/${conference.slug}/room/${room.id}`} />
                        </HStack>
                        <Participants roomId={room.id} />
                    </VStack>
                );
            }
        },
        [conference.slug, layout.type]
    );

    const roomElements = useMemo(
        () =>
            sortedRooms.map((room) => ({
                name: room.name.toLowerCase(),
                showByDefault: room.managementModeName !== Room_ManagementMode_Enum.Dm,
                el: (
                    <LinkButton
                        key={room.id}
                        to={`/conference/${conference.slug}/room/${room.id}`}
                        p={1}
                        alignItems="center"
                        justifyContent="center"
                        flexDir="column"
                        width="100%"
                        height="100%"
                        linkProps={{ m: "3px" }}
                        onClick={onClick}
                        maxW="22em"
                    >
                        {toButtonContents(room)}
                    </LinkButton>
                ),
            })),
        [conference.slug, onClick, sortedRooms, toButtonContents]
    );

    const s = search.toLowerCase();
    const filteredElements = s.length
        ? roomElements.filter((e) => {
              return e.name.includes(s);
          })
        : roomElements.filter((e) => e.showByDefault);

    const limitedElements =
        limit && !s.length ? filteredElements.slice(0, Math.min(limit, filteredElements.length)) : filteredElements;

    const resultCountStr = `Showing ${Math.min(limit ?? Number.MAX_SAFE_INTEGER, filteredElements.length)} of ${
        sortedRooms.length
    } ${sortedRooms.length !== 1 ? "rooms" : "room"}`;
    const [ariaSearchResultStr, setAriaSearchResultStr] = useState<string>(resultCountStr);
    useEffect(() => {
        const tId = setTimeout(() => {
            setAriaSearchResultStr(resultCountStr);
        }, 250);
        return () => {
            clearTimeout(tId);
        };
    }, [resultCountStr]);

    return (
        <>
            {roomElements.length > 0 ? (
                <>
                    {children}
                    {layout.type === "grid" ? (
                        <Flex pt={4} alignItems="center" justifyContent="center" w="100%" maxW="42em" flexWrap="wrap">
                            <Heading
                                as="h1"
                                fontSize="2xl"
                                minW={["0em", "0em", "8em"]}
                                textAlign={["center", "center", "left"]}
                                mx={2}
                            >
                                {layout.title}
                            </Heading>
                            <InputGroup maxW="25em" mt={2} mx="auto">
                                <InputLeftAddon aria-hidden>Search</InputLeftAddon>
                                <Input
                                    aria-label={"Search found " + ariaSearchResultStr}
                                    type="text"
                                    placeholder="Search"
                                    value={search}
                                    onChange={(ev) => {
                                        setSearch(ev.target.value);
                                    }}
                                />
                                <InputRightElement>
                                    <FAIcon iconStyle="s" icon="search" />
                                </InputRightElement>
                            </InputGroup>
                        </Flex>
                    ) : undefined}
                    <SimpleGrid
                        columns={layout.type === "grid" ? [1, Math.min(2, rooms.length), Math.min(3, rooms.length)] : 1}
                        autoRows="min-content"
                        spacing={layout.type === "grid" ? [1, 1, 3] : 1}
                        maxW="100%"
                    >
                        {limitedElements.map((e) => e.el)}
                    </SimpleGrid>
                </>
            ) : undefined}
            {roomElements.length === 0 ? <Text>{noRoomsMessage}</Text> : undefined}
        </>
    );
}
