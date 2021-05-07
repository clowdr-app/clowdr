import { GridItem, HStack, SimpleGrid, SimpleGridProps, Text } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo, useState } from "react";
import FAIcon from "../../../Icons/FAIcon";
import useRoomParticipants from "../../../Room/useRoomParticipants";
import { useRegistrant } from "../../RegistrantsContext";

interface HighlightedPerson {
    registrantId?: string;
    role: string;
}

export function Participants({
    roomId,
    higlightPeople,
    ...props
}: {
    roomId: string;
    higlightPeople: HighlightedPerson[];
} & SimpleGridProps): JSX.Element {
    const roomParticipants = useRoomParticipants();

    const columns = 2;
    const rows = 3;
    const defaultNumberToShow = columns * rows;
    const [numberToShow, setNumberToShow] = useState<number>(defaultNumberToShow);

    const thisRoomParticipants = useMemo(
        () => (roomParticipants ? roomParticipants.filter((participant) => participant.roomId === roomId) : []),
        [roomId, roomParticipants]
    );

    return thisRoomParticipants.length ? (
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
            {...props}
        >
            {R.sortBy((participant) => {
                const highlightPerson = higlightPeople.find((x) => x.registrantId === participant.registrantId);
                return highlightPerson
                    ? highlightPerson.role.toUpperCase() === "AUTHOR"
                        ? -3
                        : highlightPerson.role.toUpperCase() === "CHAIR"
                        ? -1
                        : -2
                    : 1;
            }, thisRoomParticipants)
                .slice(0, thisRoomParticipants.length > numberToShow ? numberToShow - 1 : thisRoomParticipants.length)
                .map((participant) => {
                    const highlightPerson = higlightPeople.find((x) => x.registrantId === participant.registrantId);
                    return (
                        <ParticipantGridItem
                            key={participant.id}
                            registrantId={participant.registrantId}
                            icon={highlightPerson ? "star" : undefined}
                            iconColor={
                                highlightPerson
                                    ? highlightPerson.role.toUpperCase() === "AUTHOR"
                                        ? "red.400"
                                        : highlightPerson.role.toUpperCase() === "CHAIR"
                                        ? "yellow.400"
                                        : undefined
                                    : undefined
                            }
                        />
                    );
                })}
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

function ParticipantGridItem({
    registrantId,
    icon,
    iconColor,
}: {
    registrantId: string;
    icon?: string;
    iconColor?: string;
}): JSX.Element {
    const registrantIdObj = useMemo(() => ({ registrant: registrantId }), [registrantId]);
    const registrant = useRegistrant(registrantIdObj);
    return (
        <GridItem fontWeight="light" fontSize="xs">
            <HStack alignItems="center">
                <FAIcon
                    icon={icon ?? "video"}
                    iconStyle="s"
                    fontSize="0.5rem"
                    color={iconColor ?? "green.400"}
                    mr={1}
                />
                <Text whiteSpace="normal">{registrant?.displayName ?? "Loading"}</Text>
            </HStack>
        </GridItem>
    );
}
