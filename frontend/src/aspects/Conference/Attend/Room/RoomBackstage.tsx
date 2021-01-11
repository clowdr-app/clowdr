import { Badge, Box, Heading, useColorModeValue, useToken } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { EventPersonDetailsFragment, RoomDetailsFragment } from "../../../../generated/graphql";
import usePolling from "../../../Generic/usePolling";
import useCurrentUser from "../../../Users/CurrentUser/useCurrentUser";
import { EventVonageRoom } from "./Event/EventVonageRoom";

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
                roomDetails.events.map((event) => {
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
            roomDetails.events.map((event) => {
                const haveAccessToEvent = !!myEventPeople.find(
                    (eventPerson) => user && eventPerson.eventId === event.id
                );
                return (
                    <Box key={event.id}>
                        <Heading as="h4" size="md" textAlign="left" mt={5} mb={3}>
                            {event.name} {eventTemporalBadges[event.id]}
                        </Heading>

                        {haveAccessToEvent
                            ? "You have access to the backstage for this event."
                            : "You do not have access to the backstage for this event."}
                        <Box display={haveAccessToEvent ? "block" : "none"}>
                            <EventVonageRoom eventId={event.id} />
                        </Box>
                    </Box>
                );
            }),
        [eventTemporalBadges, myEventPeople, roomDetails.events, user]
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
