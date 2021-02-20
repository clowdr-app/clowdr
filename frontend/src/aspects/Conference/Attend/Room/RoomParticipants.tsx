import { GridItem, HStack, SimpleGrid, Text } from "@chakra-ui/react";
import React, { useMemo } from "react";
import FAIcon from "../../../Icons/FAIcon";
import useRoomParticipants from "../../../Room/useRoomParticipants";
import { useAttendee } from "../../AttendeesContext";

export function RoomParticipants({ roomId }: { roomId: string }): JSX.Element {
    const roomParticipants = useRoomParticipants();

    const numberToShow = 5;

    const thisRoomParticipants = useMemo(
        () => (roomParticipants ? roomParticipants.filter((participant) => participant.roomId === roomId) : []),
        [roomId, roomParticipants]
    );

    return roomParticipants ? (
        <SimpleGrid fontSize="sm" columns={2} gridColumnGap={2} width="100%">
            {thisRoomParticipants.slice(0, Math.min(thisRoomParticipants.length, numberToShow)).map((participant) => (
                <ParticipantGridItem key={participant.id} attendeeId={participant.attendeeId} />
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

function ParticipantGridItem({ attendeeId }: { attendeeId: string }): JSX.Element {
    const attendee = useAttendee(attendeeId);
    return (
        <GridItem fontWeight="light" fontSize="xs">
            <HStack alignItems="flex-start">
                <FAIcon icon="circle" iconStyle="s" fontSize="0.5rem" color="green.400" mr={2} mb={1} />
                <Text whiteSpace="normal">{attendee?.displayName ?? "Loading"}</Text>
            </HStack>
        </GridItem>
    );
}
