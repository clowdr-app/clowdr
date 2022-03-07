import { Wrap, WrapItem } from "@chakra-ui/react";
import React from "react";
import RoomTile from "./RoomTile";

export default function RoomsSummary({
    rooms,
    alignLeft,
}: {
    rooms: { roomId: string; eventId?: string }[];
    alignLeft?: boolean;
}): JSX.Element {
    return rooms.length > 0 ? (
        <Wrap
            spacing={4}
            w="auto"
            maxW="100%"
            justify={alignLeft ? "flex-start" : "center"}
            h="auto"
            overflow="visible"
        >
            {rooms.map((room) => (
                <WrapItem key={room.roomId} w="30%" minW="280px" maxW="400px">
                    <RoomTile roomId={room.roomId} eventId={room.eventId} />
                </WrapItem>
            ))}
        </Wrap>
    ) : (
        <></>
    );
}
