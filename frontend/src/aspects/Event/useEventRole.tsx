import { gql } from "@apollo/client";
import { useMemo } from "react";
import { EventPersonRole_Enum, RoomEventDetailsFragment, useUserEventRolesSubscription } from "../../generated/graphql";

interface Result {
    roles: EventPersonRole_Enum[];
}

export function useEventRoles(userId: string, eventDetails: RoomEventDetailsFragment | null): Result {
    const { data: currentEventRolesData } = useUserEventRolesSubscription({
        variables: {
            eventId: eventDetails?.id,
            userId: userId ?? "",
        },
    });

    const roles = useMemo(() => {
        return currentEventRolesData?.Event_by_pk?.eventPeople.map((person) => person.roleName) ?? [];
    }, [currentEventRolesData?.Event_by_pk?.eventPeople]);

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
