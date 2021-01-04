import { gql } from "@apollo/client";
import React, { useMemo } from "react";
import { Permission_Enum, RoomDetailsFragment, useGetRoomDetailsQuery } from "../../../../generated/graphql";
import usePolling from "../../../Generic/usePolling";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { useNoPrimaryMenuButtons } from "../../../Menu/usePrimaryMenuButtons";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { Room } from "./Room";

gql`
    query GetRoomDetails($roomId: uuid!, $eventsFrom: timestamptz!) {
        Room_by_pk(id: $roomId) {
            ...RoomDetails
        }
    }

    fragment RoomDetails on Room {
        id
        name
        currentModeName
        mediaLiveChannel {
            cloudFrontDomain
            endpointUri
            id
        }
        publicVonageSessionId
        ...RoomEvents
    }

    fragment RoomEvents on Room {
        events(where: { endTime: { _gt: $eventsFrom } }) {
            ...RoomEventDetails
        }
    }

    fragment RoomEventDetails on Event {
        id
        startTime
        name
        durationSeconds
        endTime
        intendedRoomModeName
        eventPeople {
            id
            roleName
            attendee {
                displayName
                id
                userId
            }
        }
        contentGroup {
            ...ContentGroupData
        }
        eventVonageSession {
            id
            sessionId
        }
    }
`;

export default function RoomPage({ roomId }: { roomId: string }): JSX.Element {
    // const [currentTime, setCurrentTime] = useState<string>(new Date().toISOString());
    const currentTime = useMemo(() => new Date().toISOString(), []);
    const result = useGetRoomDetailsQuery({
        variables: {
            roomId,
            eventsFrom: currentTime,
        },
    });

    usePolling(
        () => {
            //setCurrentTime(new Date().toISOString());
            result.refetch({ eventsFrom: new Date().toISOString() });
        },
        10000,
        true
    );

    useNoPrimaryMenuButtons();

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceView, Permission_Enum.ConferenceViewAttendees]}
        >
            <ApolloQueryWrapper getter={(data) => data.Room_by_pk} queryResult={result}>
                {(room: RoomDetailsFragment) => <Room roomDetails={room} />}
            </ApolloQueryWrapper>
        </RequireAtLeastOnePermissionWrapper>
    );
}

gql`
    mutation GetEventVonageToken($eventId: uuid!) {
        joinEventVonageSession(eventId: $eventId) {
            accessToken
        }
    }

    query GetEventVonageDetails($eventId: uuid!) {
        Event_by_pk(id: $eventId) {
            eventVonageSession {
                sessionId
                id
            }
            id
        }
    }
`;
