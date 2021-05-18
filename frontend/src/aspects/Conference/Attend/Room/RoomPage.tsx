import { gql } from "@apollo/client";
import React from "react";
import {
    Permissions_Permission_Enum,
    RoomPage_RoomDetailsFragment,
    useRoomPage_GetRoomDetailsQuery,
} from "../../../../generated/graphql";
import ConferencePageNotFound from "../../../Errors/ConferencePageNotFound";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import useCurrentRegistrant from "../../useCurrentRegistrant";
import Room from "./Room";

gql`
    query RoomPage_GetRoomDetails($roomId: uuid!, $registrantId: uuid!) {
        room_Room_by_pk(id: $roomId) {
            ...RoomPage_RoomDetails
        }
    }

    fragment RoomPage_RoomDetails on room_Room {
        id
        name
        currentModeName
        isProgramRoom
        publicVonageSessionId
        chatId
        originatingItem {
            id
            typeName
            elements(
                where: { typeName: { _in: [IMAGE_URL, IMAGE_FILE] }, layoutData: { _contains: { isLogo: true } } }
                limit: 1
                order_by: { updatedAt: desc }
            ) {
                id
                data
            }
            title
        }
        managementModeName
        selfAdminPerson: roomPeople(where: { personRoleName: { _eq: ADMIN }, registrantId: { _eq: $registrantId } }) {
            id
        }
        shuffleRooms(limit: 1, order_by: { id: desc }) {
            id
            startedAt
            durationMinutes
            reshuffleUponEnd
        }
        backendName
    }

    query RoomPage_GetRoomChannelStack($roomId: uuid!) {
        video_ChannelStack(where: { roomId: { _eq: $roomId } }) {
            ...RoomPage_RoomChannelStack
        }
    }

    fragment RoomPage_RoomChannelStack on video_ChannelStack {
        cloudFrontDomain
        endpointUri
        id
    }
`;

export default function RoomPage({ roomId }: { roomId: string }): JSX.Element {
    return (
        <RequireAtLeastOnePermissionWrapper
            componentIfDenied={<ConferencePageNotFound />}
            permissions={[
                Permissions_Permission_Enum.ConferenceViewAttendees,
                Permissions_Permission_Enum.ConferenceManageSchedule,
            ]}
        >
            <RoomPageInner roomId={roomId} />
        </RequireAtLeastOnePermissionWrapper>
    );
}

function RoomPageInner({ roomId }: { roomId: string }): JSX.Element {
    const registrant = useCurrentRegistrant();
    const roomDetailsResponse = useRoomPage_GetRoomDetailsQuery({
        variables: {
            roomId,
            registrantId: registrant.id,
        },
    });
    const title = useTitle(
        roomDetailsResponse.loading ? "Loading room" : roomDetailsResponse.data?.room_Room_by_pk?.name ?? "Unknown room"
    );

    return (
        <>
            {title}
            <ApolloQueryWrapper getter={(data) => data.room_Room_by_pk} queryResult={roomDetailsResponse}>
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
        schedule_Event_by_pk(id: $eventId) {
            eventVonageSession {
                sessionId
                id
            }
            id
        }
    }
`;
