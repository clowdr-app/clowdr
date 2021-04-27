import { Box, Heading, HStack, Tag, Text, useColorModeValue } from "@chakra-ui/react";
import { formatRelative } from "date-fns";
import React, { useMemo } from "react";
import {
    ContentGroupType_Enum,
    RoomMode_Enum,
    RoomPage_RoomDetailsFragment,
    Room_EventSummaryFragment,
} from "../../../../generated/graphql";
import { useRealTime } from "../../../Generic/useRealTime";
import useCurrentAttendee from "../../useCurrentAttendee";
import { ContentGroupItemsWrapper } from "../Content/ContentGroupItems";
import { HallwayLayoutWrapper } from "../Hallway/HallwayLayout";
import { RoomTitle } from "./RoomTitle";
import { RoomSponsorContent } from "./Sponsor/RoomSponsorContent";

export function RoomContent({
    currentRoomEvent,
    nextRoomEvent,
    roomDetails,
}: {
    currentRoomEvent: Room_EventSummaryFragment | null;
    nextRoomEvent: Room_EventSummaryFragment | null;
    roomDetails: RoomPage_RoomDetailsFragment;
}): JSX.Element {
    const bgColour = useColorModeValue("green.200", "green.700");
    const nextBgColour = useColorModeValue("gray.200", "gray.700");

    const currentAttendee = useCurrentAttendee();

    const currentEventRole = useMemo(
        () =>
            currentRoomEvent?.eventPeople.find((p) => p.person.attendeeId && p.person.attendeeId === currentAttendee.id)
                ?.roleName,
        [currentAttendee, currentRoomEvent?.eventPeople]
    );
    const nextEventRole = useMemo(
        () =>
            nextRoomEvent?.eventPeople.find((p) => p.person.attendeeId && p.person.attendeeId === currentAttendee.id)
                ?.roleName,
        [currentAttendee, nextRoomEvent?.eventPeople]
    );

    const now5s = useRealTime(5000);

    // TODO: Hallway layout if in exhibition mode, else content layout
    return (
        <Box flexGrow={1}>
            <RoomTitle roomDetails={roomDetails} />

            {currentRoomEvent ? (
                <Box backgroundColor={bgColour} borderRadius={5} px={5} py={3} my={5}>
                    <HStack justifyContent="space-between">
                        <Text>Started {formatRelative(Date.parse(currentRoomEvent.startTime), now5s)}</Text>
                        {currentEventRole ? (
                            <Tag colorScheme="green" my={2}>
                                {currentEventRole}
                            </Tag>
                        ) : undefined}
                    </HStack>
                    <Heading as="h3" textAlign="left" size="lg" mb={2}>
                        {currentRoomEvent.name}
                    </Heading>
                    {currentRoomEvent.intendedRoomModeName !== RoomMode_Enum.Exhibition &&
                    currentRoomEvent.contentGroupId ? (
                        <ContentGroupItemsWrapper contentGroupId={currentRoomEvent.contentGroupId} linkToItem={true} />
                    ) : (
                        <></>
                    )}
                    {currentRoomEvent.hallwayId ? (
                        <HallwayLayoutWrapper hallwayId={currentRoomEvent.hallwayId} hideLiveViewButton={true} />
                    ) : (
                        <></>
                    )}
                </Box>
            ) : (
                <></>
            )}
            {nextRoomEvent ? (
                <Box backgroundColor={nextBgColour} borderRadius={5} px={5} py={3} my={5}>
                    <Heading as="h3" textAlign="left" size="lg" mb={1}>
                        {nextRoomEvent.name}
                    </Heading>
                    <HStack justifyContent="space-between" mb={2}>
                        <Text>Starts {formatRelative(Date.parse(nextRoomEvent.startTime), now5s)}</Text>
                        {nextEventRole ? (
                            <Tag colorScheme="gray" my={2} textTransform="none">
                                You are {nextEventRole}
                            </Tag>
                        ) : undefined}
                    </HStack>
                    {nextRoomEvent?.contentGroupId ? (
                        <ContentGroupItemsWrapper contentGroupId={nextRoomEvent.contentGroupId} linkToItem={true} />
                    ) : (
                        <></>
                    )}
                </Box>
            ) : (
                <></>
            )}

            {!currentRoomEvent && !nextRoomEvent && roomDetails.isProgramRoom ? (
                <Text p={5}>No events in this room in the near future.</Text>
            ) : (
                <></>
            )}

            {roomDetails.originatingContentGroup?.id &&
            roomDetails.originatingContentGroup.contentGroupTypeName !== ContentGroupType_Enum.Sponsor ? (
                <Box backgroundColor={bgColour} borderRadius={5} px={5} py={3} my={5}>
                    <ContentGroupItemsWrapper
                        contentGroupId={roomDetails.originatingContentGroup.id}
                        linkToItem={true}
                    />
                </Box>
            ) : (
                <></>
            )}

            {roomDetails.originatingContentGroup ? (
                <RoomSponsorContent contentGroupId={roomDetails.originatingContentGroup.id} />
            ) : (
                <></>
            )}
        </Box>
    );
}
