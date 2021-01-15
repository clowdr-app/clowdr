import {
    Center,
    Flex,
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
    Input,
    InputGroup,
    InputLeftAddon,
    InputRightElement,
    SimpleGrid,
    Text,
} from "@chakra-ui/react";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RoomListRoomDetailsFragment, RoomPrivacy_Enum } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import FAIcon from "../../../Icons/FAIcon";
import PageCountText from "../../../Presence/PageCountText";
import useRoomParticipants from "../../../Room/useRoomParticipants";
import { useConference } from "../../useConference";
import { RoomParticipants } from "./RoomParticipants";

export function RoomList({
    rooms,
    layout,
    limit,
    onClick,
}: {
    rooms: readonly RoomListRoomDetailsFragment[];
    layout: "grid" | "list";
    limit?: number;
    onClick?: () => void;
}): JSX.Element {
    const conference = useConference();
    const roomParticipants = useRoomParticipants();

    const [search, setSearch] = useState<string>("");

    const sortedRooms = useMemo(
        () =>
            R.sortWith(
                [
                    R.descend((room) => !roomParticipants || !!roomParticipants?.find((p) => p.roomId === room.id)),
                    R.ascend((room) => room.name),
                ],
                rooms
            ),
        [roomParticipants, rooms]
    );

    const toButtonContents = useCallback(
        (room: RoomListRoomDetailsFragment) => {
            if (layout === "grid") {
                return (
                    <>
                        <Center flexWrap="wrap" my={3} mx={3}>
                            {room.roomPrivacyName === RoomPrivacy_Enum.Private ? (
                                <FAIcon icon="lock" iconStyle="s" textAlign="center" />
                            ) : room.roomPrivacyName === RoomPrivacy_Enum.Dm ? (
                                <FAIcon icon="envelope" iconStyle="s" textAlign="center" />
                            ) : (
                                <FAIcon icon="video" iconStyle="s" textAlign="center" />
                            )}
                            <Text
                                p={5}
                                textAlign="left"
                                textOverflow="ellipsis"
                                whiteSpace="nowrap"
                                overflow="hidden"
                                title={room.name}
                            >
                                {room.name}
                            </Text>
                            <PageCountText path={`/conference/${conference.slug}/room/${room.id}`} />
                        </Center>
                        <RoomParticipants roomId={room.id} />
                    </>
                );
            } else {
                return (
                    <HStack flexWrap="wrap" width="100%">
                        {room.roomPrivacyName === RoomPrivacy_Enum.Private ? (
                            <FAIcon icon="lock" iconStyle="s" textAlign="center" width="10%" />
                        ) : room.roomPrivacyName === RoomPrivacy_Enum.Dm ? (
                            <FAIcon icon="envelope" iconStyle="s" textAlign="center" width="10%" />
                        ) : (
                            <FAIcon icon="video" iconStyle="s" textAlign="center" width="10%" />
                        )}
                        <Text
                            p={2}
                            textAlign="left"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                            overflow="hidden"
                            title={room.name}
                            width="70%"
                        >
                            {room.name}
                        </Text>
                        <PageCountText width="10%" path={`/conference/${conference.slug}/room/${room.id}`} />
                        <RoomParticipants roomId={room.id} />
                    </HStack>
                );
            }
        },
        [conference.slug, layout]
    );

    const roomElements = useMemo(
        () =>
            sortedRooms.map((room) => ({
                name: room.name.toLowerCase(),
                el: (
                    <LinkButton
                        key={room.id}
                        to={`/conference/${conference.slug}/room/${room.id}`}
                        p={layout === "grid" ? [2, 4] : 1}
                        alignItems="center"
                        justifyContent="center"
                        flexDir="column"
                        width="100%"
                        height="100%"
                        onClick={onClick}
                    >
                        {toButtonContents(room)}
                    </LinkButton>
                ),
            })),
        [conference.slug, layout, onClick, sortedRooms, toButtonContents]
    );

    const s = search.toLowerCase();
    const filteredElements = roomElements.filter((e) => {
        return e.name.includes(s);
    });

    const limitedElements = limit
        ? filteredElements.slice(0, Math.min(limit, filteredElements.length))
        : filteredElements;

    const resultCountStr = `showing ${Math.min(limit ?? Number.MAX_SAFE_INTEGER, filteredElements.length)} of ${
        filteredElements.length
    } ${filteredElements.length !== 1 ? "rooms" : "room"}`;
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
            <FormControl mb={4} maxW={400}>
                <FormLabel mt={4} textAlign="center">
                    {resultCountStr}
                </FormLabel>
                <InputGroup>
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
                <FormHelperText>Search for a room.</FormHelperText>
            </FormControl>
            <SimpleGrid
                columns={layout === "grid" ? [1, Math.min(2, rooms.length), Math.min(3, rooms.length)] : 1}
                autoRows="min-content"
                spacing={layout === "grid" ? [2, 2, 4] : 2}
            >
                {limitedElements.map((e) => e.el)}
            </SimpleGrid>
        </>
    );
}
