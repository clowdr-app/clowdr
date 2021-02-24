import { GridItem, HStack, SimpleGrid, Text } from "@chakra-ui/react";
import React, { useMemo, useState } from "react";
import FAIcon from "../../../Icons/FAIcon";
import useRoomParticipants from "../../../Room/useRoomParticipants";
import { useAttendee } from "../../AttendeesContext";

export function RoomParticipants({ roomId }: { roomId: string }): JSX.Element {
    const roomParticipants = useRoomParticipants();

    const columns = 2;
    const rows = 3;
    const defaultNumberToShow = columns * rows;
    const [numberToShow, setNumberToShow] = useState<number>(defaultNumberToShow);

    const thisRoomParticipants = useMemo(
        () => (roomParticipants ? roomParticipants.filter((participant) => participant.roomId === roomId) : []),
        [roomId, roomParticipants]
    );

    return roomParticipants ? (
        <SimpleGrid
            fontSize="sm"
            columns={columns}
            gridColumnGap={2}
            gridRowGap={1}
            width="100%"
            onMouseOver={() => {
                setNumberToShow(Number.MAX_SAFE_INTEGER);
            }}
            onMouseLeave={() => {
                setNumberToShow(defaultNumberToShow);
            }}
        >
            {thisRoomParticipants
                .slice(0, thisRoomParticipants.length > numberToShow ? numberToShow - 1 : thisRoomParticipants.length)
                .map((participant) => (
                    <ParticipantGridItem key={participant.id} attendeeId={participant.attendeeId} />
                ))}
            {thisRoomParticipants.length > numberToShow ? (
                <GridItem fontWeight="light">+ {thisRoomParticipants.length - numberToShow + 1} more</GridItem>
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
            <HStack alignItems="center">
                <FAIcon icon="video" iconStyle="s" fontSize="0.5rem" color="green.400" mr={1} />
                <Text whiteSpace="normal">{attendee?.displayName ?? "Loading"}</Text>
            </HStack>
        </GridItem>
    );
}
