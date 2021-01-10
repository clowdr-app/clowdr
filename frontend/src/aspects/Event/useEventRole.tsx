import { gql } from "@apollo/client";
import { useMemo } from "react";
import type { EventPersonRole_Enum, RoomEventDetailsFragment } from "../../generated/graphql";

interface Result {
    roles: EventPersonRole_Enum[];
}

export function useEventRoles(userId: string, eventDetails: RoomEventDetailsFragment | null): Result {
    const roles = useMemo(() => {
        return (
            eventDetails?.eventPeople
                .filter((person) => person.attendee?.userId === userId)
                .map((person) => person.roleName) ?? []
        );
    }, [eventDetails, userId]);

    return {
        roles,
    };
}

gql`
    subscription UserEventRoles($eventId: uuid!, $userId: String!) {
        Event_by_pk(id: $eventId) {
            eventPeople(where: { attendee: { userId: { _eq: $userId } } }) {
                roleName
                id
            }
        }
    }
`;
