import { gql } from "@apollo/client";
import React, { useEffect, useMemo } from "react";
import { Permission_Enum, RoomDetailsFragment, useGetRoomDetailsQuery } from "../../../../generated/graphql";
import usePolling from "../../../Generic/usePolling";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import usePrimaryMenuButtons from "../../../Menu/usePrimaryMenuButtons";
import RoomMembersProvider from "../../../Room/RoomMembersProvider";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
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
        roomPrivacyName
        ...RoomEvents
        ...RoomPeople
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
    const currentTime = useMemo(() => new Date().toISOString(), []);
    const result = useGetRoomDetailsQuery({
        variables: {
            roomId,
            eventsFrom: currentTime,
        },
    });
    const title = useTitle(result.loading ? "Loading room" : result.data?.Room_by_pk?.name ?? "Unknown room");

    usePolling(
        () => {
            result.refetch({ eventsFrom: new Date().toISOString() });
        },
        10000,
        true
    );

    const conference = useConference();
    const { setPrimaryMenuButtons } = usePrimaryMenuButtons();
    useEffect(() => {
        setPrimaryMenuButtons([
            {
                key: "conference-home",
                action: `/conference/${conference.slug}`,
                text: "Home",
                label: "Home",
            },
        ]);
    }, [conference.slug, setPrimaryMenuButtons]);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceView, Permission_Enum.ConferenceViewAttendees]}
        >
            {title}
            <RoomMembersProvider roomId={roomId}>
                <ApolloQueryWrapper getter={(data) => data.Room_by_pk} queryResult={result}>
                    {(room: RoomDetailsFragment) => <Room roomDetails={room} />}
                </ApolloQueryWrapper>
            </RoomMembersProvider>
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
