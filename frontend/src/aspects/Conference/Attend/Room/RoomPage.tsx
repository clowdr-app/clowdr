import { gql } from "@apollo/client";
import React, { useEffect } from "react";
import {
    Permission_Enum,
    RoomPage_RoomDetailsFragment,
    useRoomPage_EventPeopleForRoomSubscription,
    useRoomPage_GetRoomDetailsQuery,
} from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
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
    query RoomPage_GetRoomDetails($roomId: uuid!) {
        Room_by_pk(id: $roomId) {
            ...RoomPage_RoomDetails
        }
    }

    fragment RoomPage_RoomDetails on Room {
        id
        name
        currentModeName
        mediaLiveChannel {
            cloudFrontDomain
            endpointUri
            id
        }
        publicVonageSessionId
        chatId
        originatingContentGroup {
            id
            contentGroupTypeName
            contentItems(
                where: { contentTypeName: { _eq: IMAGE_URL }, layoutData: { _contains: { isLogo: true } } }
                limit: 1
                order_by: { updatedAt: desc }
            ) {
                id
                data
            }
            title
        }
        roomPrivacyName
        ...RoomPage_RoomEvents
        ...RoomPage_RoomPeople
        shuffleRooms(limit: 1, order_by: { id: desc }) {
            id
            startedAt
            durationMinutes
            reshuffleUponEnd
        }
    }

    fragment RoomPage_RoomEvents on Room {
        events(order_by: { startTime: asc }) {
            ...RoomPage_RoomEventSummary
        }
    }

    fragment RoomPage_RoomEventSummary on Event {
        id
        conferenceId
        startTime
        name
        endTime
        intendedRoomModeName
        contentGroupId
    }

    fragment RoomPage_RoomPeople on Room {
        roomPeople {
            id
            roomPersonRoleName
            attendeeId
        }
    }

    subscription RoomPage_EventPeopleForRoom($roomId: uuid!) {
        EventPerson(where: { event: { room: { id: { _eq: $roomId } } } }) {
            ...RoomPage_EventPersonDetails
        }
    }

    fragment RoomPage_EventPersonDetails on EventPerson {
        id
        name
        roleName
        eventId
        attendeeId
    }
`;

export default function RoomPage({ roomId }: { roomId: string }): JSX.Element {
    const result = useRoomPage_GetRoomDetailsQuery({
        variables: {
            roomId,
        },
        fetchPolicy: "network-only",
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
                text: conference.shortName,
                label: conference.shortName,
            },
        ]);
    }, [conference.shortName, conference.slug, setPrimaryMenuButtons]);

    const { data: eventPeopleData, error } = useRoomPage_EventPeopleForRoomSubscription({
        variables: {
            roomId,
        },
    });
    eventPeopleData?.EventPerson;
    useQueryErrorToast(error, "useEventPeopleForRoomSubscription");

    return (
        <RequireAtLeastOnePermissionWrapper
            componentIfDenied={<PageNotFound />}
            permissions={[Permission_Enum.ConferenceViewAttendees, Permission_Enum.ConferenceManageSchedule]}
        >
            {title}
            <RoomMembersProvider roomId={roomId}>
                <ApolloQueryWrapper getter={(data) => data.Room_by_pk} queryResult={result}>
                    {(room: RoomPage_RoomDetailsFragment) => (
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
