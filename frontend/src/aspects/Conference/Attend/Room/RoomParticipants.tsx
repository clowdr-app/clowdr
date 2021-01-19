import { GridItem, SimpleGrid } from "@chakra-ui/react";
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
        <SimpleGrid fontSize="sm" maxH="3rem" overflowY="hidden" columns={3} columnGap={3} width="100%">
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
        <GridItem fontWeight="light">
            <FAIcon icon="circle" iconStyle="s" fontSize="0.5rem" color="green.400" mr={2} mb={1} />
            {attendee?.displayName ?? "Loading"}
        </GridItem>
    );
}
