import { Badge, Box, Heading, Text, useColorModeValue, useToken } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { EventPersonDetailsFragment, RoomDetailsFragment, RoomMode_Enum } from "../../../../generated/graphql";
import usePolling from "../../../Generic/usePolling";
import useCurrentUser from "../../../Users/CurrentUser/useCurrentUser";
import { EventVonageRoom } from "./Event/EventVonageRoom";
import { HandUpButton } from "./HandUpButton";

export function RoomBackstage({
    backstage,
    roomDetails,
    eventPeople,
}: {
    backstage: boolean;
    roomDetails: RoomDetailsFragment;
    eventPeople: readonly EventPersonDetailsFragment[];
}): JSX.Element {
    const user = useCurrentUser();
    const [gray100, gray900] = useToken("colors", ["gray.100", "gray.900"]);
    const backgroundColour = useColorModeValue(gray100, gray900);

    const myEventPeople = useMemo(
        () =>
            eventPeople.filter((eventPerson) =>
                user.user.attendees.find((attendee) => attendee.id && attendee.id === eventPerson.attendee?.id)
            ) ?? [],
        [eventPeople, user.user.attendees]
    );

    const [eventTemporalBadges, setEventTemporalBadges] = useState<{ [eventId: string]: JSX.Element }>({});

    const updateEventTemporalBadges = useCallback(() => {
        setEventTemporalBadges(
            R.fromPairs(
                roomDetails.events
                    .filter((event) =>
                        [RoomMode_Enum.Presentation, RoomMode_Enum.QAndA].includes(event.intendedRoomModeName)
                    )
                    .map((event) => {
                        const now = new Date().getTime();
                        const startTime = Date.parse(event.startTime);
                        const endTime = Date.parse(event.endTime);

                        if (now >= startTime && now <= endTime) {
                            return [
                                event.id,
                                <Badge key={`badge-${event.id}`} colorScheme="green">
                                    Now
                                </Badge>,
                            ];
                        }

                        if (now >= startTime - 3 * 60 * 1000 && now <= startTime) {
                            return [
                                event.id,
                                <Badge key={`badge-${event.id}`} colorScheme="blue">
                                    Soon
                                </Badge>,
                            ];
                        }

                        return [event.id, <></>];
                    })
            )
        );
    }, [roomDetails.events]);

    usePolling(() => updateEventTemporalBadges(), 5000, true);
    useEffect(() => updateEventTemporalBadges(), [updateEventTemporalBadges]);

    const eventRooms = useMemo(
        () =>
            roomDetails.events
                .filter((event) =>
                    [RoomMode_Enum.Presentation, RoomMode_Enum.QAndA].includes(event.intendedRoomModeName)
                )
                .map((event) => {
                    const haveAccessToEvent = !!myEventPeople.find(
                        (eventPerson) => user && eventPerson.eventId === event.id
                    );
                    return (
                        <Box key={event.id}>
                            <Heading as="h4" size="md" textAlign="left" mt={5} mb={3}>
                                {event.name} {eventTemporalBadges[event.id]}
                            </Heading>

                            {haveAccessToEvent ? (
                                "You have access to the backstage for this event."
                            ) : (
                                <>
                                    <Text>You do not have access to the backstage for this event.</Text>
                                    <HandUpButton currentRoomEvent={event} eventPeople={eventPeople} />
                                </>
                            )}
                            <Box display={haveAccessToEvent ? "block" : "none"} mt={2}>
                                <EventVonageRoom eventId={event.id} />
                            </Box>
                        </Box>
                    );
                }),
        [eventPeople, eventTemporalBadges, myEventPeople, roomDetails.events, user]
    );

    return (
        <Box display={backstage ? "block" : "none"} background={backgroundColour} p={5}>
            <Heading as="h3" size="lg">
                Backstage
            </Heading>
            {eventRooms}
        </Box>
    );
}
