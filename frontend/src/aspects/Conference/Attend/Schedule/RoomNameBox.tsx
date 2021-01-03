import { Box, Link } from "@chakra-ui/react";
import React from "react";
import { Link as ReactLink } from "react-router-dom";
import type { Timeline_RoomFragment } from "../../../../generated/graphql";
import { useConference } from "../../useConference";

export default function RoomNameBox({
    room,
    height,
    showBottomBorder,
    borderColour,
}: {
    room: Timeline_RoomFragment;
    height: number | string;
    showBottomBorder: boolean;
    borderColour: string;
}): JSX.Element {
    const conference = useConference();
    return (
        <Box
            p={4}
            h={height}
            borderRightWidth={1}
            borderBottomWidth={showBottomBorder ? 1 : 0}
            borderRightStyle="solid"
            borderRightColor={borderColour}
            borderBottomStyle="solid"
            borderBottomColor={borderColour}
        >
            <Link as={ReactLink} to={`/conference/${conference.slug}/room/${room.id}`} textDecoration="none">
                {room.name}
            </Link>
        </Box>
    );
}
