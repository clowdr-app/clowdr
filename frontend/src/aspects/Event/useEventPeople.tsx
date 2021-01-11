import { gql } from "@apollo/client";
import { useMemo } from "react";
import {
    EventPersonDetailsFragment,
    EventPersonRole_Enum,
    RoomEventDetailsFragment,
    useUserEventRolesSubscription,
} from "../../generated/graphql";

interface Result {
    myRoles: EventPersonRole_Enum[];
    eventPeople: readonly EventPersonDetailsFragment[];
}

gql`
    subscription UserEventRoles($eventId: uuid!) {
        Event_by_pk(id: $eventId) {
            eventPeople {
                ...EventPersonDetails
            }
        }
    }
`;

export function useEventPeople(userId: string, eventDetails: RoomEventDetailsFragment | null): Result {
    const { data: currentEventRolesData } = useUserEventRolesSubscription({
        variables: {
            eventId: eventDetails?.id,
        },
    });

    const myRoles = useMemo(() => {
        return (
            currentEventRolesData?.Event_by_pk?.eventPeople
                .filter((person) => person.attendee?.userId === userId)
                .map((person) => person.roleName) ?? []
        );
    }, [currentEventRolesData?.Event_by_pk?.eventPeople, userId]);

    const eventPeople = useMemo(() => {
        return currentEventRolesData?.Event_by_pk?.eventPeople ?? [];
    }, [currentEventRolesData?.Event_by_pk?.eventPeople]);

    return {
        myRoles,
        eventPeople,
    };
}
