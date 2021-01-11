import { gql } from "@apollo/client";
import React, { useEffect } from "react";
import {
    Permission_Enum,
    RoomDetailsFragment,
    useEventPeopleForRoomSubscription,
    useGetRoomDetailsQuery,
} from "../../../../generated/graphql";
import usePolling from "../../../Generic/usePolling";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import usePrimaryMenuButtons from "../../../Menu/usePrimaryMenuButtons";
import RoomMembersProvider from "../../../Room/RoomMembersProvider";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import { Room } from "./Room";

gql`
    query GetRoomDetails($roomId: uuid!) {
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
        events(order_by: { startTime: asc }) {
            ...RoomEventSummary
        }
    }

    fragment RoomEventSummary on Event {
        id
        conferenceId
        startTime
        name
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
    }

    subscription EventPeopleForRoom($roomId: uuid!) {
        EventPerson(where: { event: { room: { id: { _eq: $roomId } } } }) {
            ...EventPersonDetails
        }
    }

    fragment EventPersonDetails on EventPerson {
        id
        name
        roleName
        eventId
        attendee {
            id
            userId
        }
    }
`;

export default function RoomPage({ roomId }: { roomId: string }): JSX.Element {
    const result = useGetRoomDetailsQuery({
        variables: {
            roomId,
        },
    });
    const title = useTitle(result.loading ? "Loading room" : result.data?.Room_by_pk?.name ?? "Unknown room");

    usePolling(result.refetch, 30000, true);

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

    const { data: eventPeopleData, error } = useEventPeopleForRoomSubscription({
        variables: {
            roomId,
        },
    });
    eventPeopleData?.EventPerson;
    useQueryErrorToast(error);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[
                Permission_Enum.ConferenceView,
                Permission_Enum.ConferenceViewAttendees,
                Permission_Enum.ConferenceManageSchedule,
            ]}
        >
            {title}
            <RoomMembersProvider roomId={roomId}>
                <ApolloQueryWrapper getter={(data) => data.Room_by_pk} queryResult={result}>
                    {(room: RoomDetailsFragment) => (
                        <Room roomDetails={room} eventPeople={eventPeopleData?.EventPerson ?? []} />
                    )}
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
