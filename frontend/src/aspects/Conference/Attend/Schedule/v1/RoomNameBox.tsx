import { Center, HStack, Link, Text } from "@chakra-ui/react";
import React from "react";
import { Link as ReactLink } from "react-router-dom";
import type { Schedule_RoomSummaryFragment } from "../../../../../generated/graphql";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { useMaybeCurrentRegistrant } from "../../../useCurrentRegistrant";

export default function RoomNameBox({
    room,
    width,
    showBottomBorder,
    borderColour,
    backgroundColor,
    marginLeft,
}: {
    room: Schedule_RoomSummaryFragment | string;
    width: number | string;
    showBottomBorder: boolean;
    borderColour: string;
    backgroundColor?: string;
    marginLeft?: string;
}): JSX.Element {
    const { conferencePath } = useAuthParameters();
    const registrant = useMaybeCurrentRegistrant();
    const shouldLink = !!registrant;

    return (
        <Center
            p={4}
            w={width + "px"}
            borderBottomWidth={1}
            borderBottomStyle="solid"
            borderBottomColor={borderColour}
            borderRightWidth={showBottomBorder ? 1 : 0}
            borderRightStyle="solid"
            borderRightColor={borderColour}
            justifyContent="flex-start"
            backgroundColor={backgroundColor}
            role={typeof room === "string" ? "none" : "listitem"}
            ml={marginLeft}
            borderLeftWidth={marginLeft ? 1 : 0}
            borderLeftStyle="solid"
            borderLeftColor={borderColour}
            overflow="hidden"
            fontSize="sm"
        >
            {typeof room === "string" ? (
                room
            ) : shouldLink ? (
                <Link
                    as={ReactLink}
                    to={`${conferencePath}/room/${room.id}`}
                    textDecoration="none"
                    aria-label={`${room.name} room`}
                >
                    <HStack>
                        {/* {roomIcon} */}
                        <Text>{room.name}</Text>
                    </HStack>
                </Link>
            ) : (
                <HStack aria-label={`${room.name} room`}>
                    {/* {roomIcon} */}
                    <Text>{room.name}</Text>
                </HStack>
            )}
        </Center>
    );
}
