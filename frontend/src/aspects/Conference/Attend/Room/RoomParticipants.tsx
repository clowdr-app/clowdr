import { GridItem, SimpleGrid } from "@chakra-ui/react";
import React, { useMemo } from "react";
import FAIcon from "../../../Icons/FAIcon";
import useRoomParticipants from "../../../Room/useRoomParticipants";

export function RoomParticipants({ roomId }: { roomId: string }): JSX.Element {
    const roomParticipants = useRoomParticipants();

    const numberToShow = 5;

    const thisRoomParticipants = useMemo(
        () => (roomParticipants ? roomParticipants.filter((participant) => participant.roomId === roomId) : []),
        [roomId, roomParticipants]
    );

    return roomParticipants ? (
        <SimpleGrid fontSize="sm" maxH="3rem" overflowY="hidden" columns={3} columnGap={3} width="100%">
            {thisRoomParticipants.slice(0, Math.min(thisRoomParticipants.length, numberToShow)).map((participant) => (
                <GridItem key={participant.id} fontWeight="light">
                    <FAIcon icon="circle" iconStyle="s" fontSize="0.5rem" color="green.400" mr={2} mb={1} />
                    {participant.attendee.displayName}
                </GridItem>
            ))}
            {thisRoomParticipants.length > numberToShow ? (
                <GridItem fontWeight="light">plus {thisRoomParticipants.length - numberToShow} more</GridItem>
            ) : (
                <></>
            )}
        </SimpleGrid>
    ) : (
        <></>
    );
}
