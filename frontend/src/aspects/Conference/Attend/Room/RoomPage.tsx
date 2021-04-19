import { gql } from "@apollo/client";
import React from "react";
import {
    Permission_Enum,
    RoomPage_RoomDetailsFragment,
    useRoomPage_GetRoomDetailsQuery,
} from "../../../../generated/graphql";
import ConferencePageNotFound from "../../../Errors/ConferencePageNotFound";
import usePolling from "../../../Generic/usePolling";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import Room from "./Room";

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
        isProgramRoom
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
                where: {
                    contentTypeName: { _in: [IMAGE_URL, IMAGE_FILE] }
                    layoutData: { _contains: { isLogo: true } }
                }
                limit: 1
                order_by: { updatedAt: desc }
            ) {
                id
                data
            }
            title
        }
        roomPrivacyName
        ...RoomPage_RoomPeople
        shuffleRooms(limit: 1, order_by: { id: desc }) {
            id
            startedAt
            durationMinutes
            reshuffleUponEnd
        }
        videoRoomBackendName
    }

    fragment RoomPage_RoomPeople on Room {
        roomPeople {
            id
            roomPersonRoleName
            attendeeId
        }
    }
`;

export default function RoomPage({ roomId }: { roomId: string }): JSX.Element {
    return (
        <RequireAtLeastOnePermissionWrapper
            componentIfDenied={<ConferencePageNotFound />}
            permissions={[Permission_Enum.ConferenceViewAttendees, Permission_Enum.ConferenceManageSchedule]}
        >
            <RoomPageInner roomId={roomId} />
        </RequireAtLeastOnePermissionWrapper>
    );
}

function RoomPageInner({ roomId }: { roomId: string }): JSX.Element {
    const result = useRoomPage_GetRoomDetailsQuery({
        variables: {
            roomId,
        },
        fetchPolicy: "network-only",
    });
    const title = useTitle(result.loading ? "Loading room" : result.data?.Room_by_pk?.name ?? "Unknown room");

    usePolling(result.refetch, 60000, true);

    return (
        <>
            {title}
            <ApolloQueryWrapper getter={(data) => data.Room_by_pk} queryResult={result}>
                {(room: RoomPage_RoomDetailsFragment) => <Room roomDetails={room} />}
            </ApolloQueryWrapper>
        </>
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
