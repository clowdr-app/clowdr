import { Box } from "@chakra-ui/react";
import React from "react";
import type { Timeline_RoomFragment } from "../../../../generated/graphql";

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
            {room.name}
        </Box>
    );
}
