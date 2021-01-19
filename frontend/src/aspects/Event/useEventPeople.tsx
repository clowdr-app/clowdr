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

    fragment EventPersonDetails on EventPerson {
        id
        name
        roleName
        eventId
        attendeeId
    }
`;

export function useEventPeople(attendeeId: string, eventDetails: RoomEventDetailsFragment | null): Result {
    const { data: currentEventRolesData } = useUserEventRolesSubscription({
        variables: {
            eventId: eventDetails?.id,
        },
    });

    const myRoles = useMemo(() => {
        return (
            currentEventRolesData?.Event_by_pk?.eventPeople
                .filter((person) => person.attendeeId === attendeeId)
                .map((person) => person.roleName) ?? []
        );
    }, [currentEventRolesData?.Event_by_pk?.eventPeople, attendeeId]);

    const eventPeople = useMemo(() => {
        return currentEventRolesData?.Event_by_pk?.eventPeople ?? [];
    }, [currentEventRolesData?.Event_by_pk?.eventPeople]);

    return {
        myRoles,
        eventPeople,
    };
}
