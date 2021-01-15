import {
    FormControl,
    FormHelperText,
    FormLabel,
    GridItem,
    Input,
    InputGroup,
    InputLeftAddon,
    InputRightElement,
    SimpleGrid,
    Text,
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useState } from "react";
import { RoomListRoomDetailsFragment, RoomPrivacy_Enum } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import FAIcon from "../../../Icons/FAIcon";
import useRoomParticipants from "../../../Room/useRoomParticipants";
import { useConference } from "../../useConference";

export function RoomList({ rooms }: { rooms: readonly RoomListRoomDetailsFragment[] }): JSX.Element {
    const conference = useConference();
    const roomParticipants = useRoomParticipants();

    const [search, setSearch] = useState<string>("");

    const roomElements = useMemo(
        () =>
            rooms.map((room) => ({
                name: room.name.toLowerCase(),
                el: (
                    <LinkButton
                        key={room.id}
                        to={`/conference/${conference.slug}/room/${room.id}`}
                        p={[2, 4]}
                        alignItems="center"
                        justifyContent="center"
                        flexDir="column"
                        width="100%"
                        height="100%"
                    >
                        {room.roomPrivacyName === RoomPrivacy_Enum.Private ? (
                            <FAIcon icon="lock" iconStyle="s" />
                        ) : room.roomPrivacyName === RoomPrivacy_Enum.Dm ? (
                            <FAIcon icon="envelope" iconStyle="s" />
                        ) : (
                            <></>
                        )}
                        <Text p={5}>{room.name}</Text>
                        {roomParticipants ? (
                            <SimpleGrid fontSize="sm" maxH="3rem" overflowY="hidden">
                                {roomParticipants
                                    .filter((participant) => participant.roomId === room.id)
                                    .map((participant) => (
                                        <GridItem key={participant.id}>
                                            <FAIcon
                                                icon="circle"
                                                iconStyle="s"
                                                fontSize="xs"
                                                color="green.400"
                                                mr={2}
                                            />
                                            {participant.attendee.displayName}
                                        </GridItem>
                                    ))}
                            </SimpleGrid>
                        ) : (
                            <></>
                        )}
                    </LinkButton>
                ),
            })),
        [conference.slug, roomParticipants, rooms]
    );

    const s = search.toLowerCase();
    const filteredElements = roomElements.filter((e) => {
        return e.name.includes(s);
    });

    const resultCountStr = `${filteredElements.length} ${filteredElements.length !== 1 ? "rooms" : "room"}`;
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
                columns={[1, Math.min(2, rooms.length), Math.min(3, rooms.length)]}
                autoRows="min-content"
                spacing={[2, 2, 4]}
            >
                {filteredElements.map((e) => e.el)}
            </SimpleGrid>
        </>
    );
}
