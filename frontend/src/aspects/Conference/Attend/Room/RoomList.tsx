import { SimpleGrid, Text } from "@chakra-ui/react";
import React from "react";
import { RoomListRoomDetailsFragment, RoomPrivacy_Enum } from "../../../../generated/graphql";
import LinkButton from "../../../Chakra/LinkButton";
import FAIcon from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";

export function RoomList({ rooms }: { rooms: readonly RoomListRoomDetailsFragment[] }): JSX.Element {
    const conference = useConference();

    return (
        <SimpleGrid
            columns={[1, Math.min(2, rooms.length), Math.min(3, rooms.length)]}
            autoRows="min-content"
            spacing={[2, 2, 4]}
        >
            {rooms.map((room) => (
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
                    {room.roomPrivacyName === RoomPrivacy_Enum.Private ? <FAIcon icon="lock" iconStyle="s" /> : <></>}
                    <Text p={5}>{room.name}</Text>
                </LinkButton>
            ))}
        </SimpleGrid>
    );
}
