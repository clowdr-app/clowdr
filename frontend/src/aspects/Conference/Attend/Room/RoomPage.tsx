import { gql } from "@urql/core";
import React from "react";
import type { RoomPage_RoomDetailsFragment } from "../../../../generated/graphql";
import { useRoomPage_GetRoomDetailsQuery } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import QueryWrapper from "../../../GQL/QueryWrapper";
import { useShieldedHeaders } from "../../../GQL/useShieldedHeaders";
import { useTitle } from "../../../Utils/useTitle";
import RequireRole from "../../RequireRole";
import Room from "./Room";

gql`
    query RoomPage_GetRoomDetails($roomId: uuid!) {
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
        shuffleRooms(limit: 1, order_by: { id: desc }) {
            id
            startedAt
            durationMinutes
            reshuffleUponEnd
            shufflePeriodId
        }
        backendName
    }

    query RoomPage_IsAdmin($roomId: uuid!, $registrantId: uuid!) {
        room_RoomMembership(
            where: { personRoleName: { _eq: ADMIN }, registrantId: { _eq: $registrantId }, roomId: { _eq: $roomId } }
        ) {
            id
        }
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
        <RequireRole componentIfDenied={<PageNotFound />} attendeeRole>
            <RoomPageInner roomId={roomId} />
        </RequireRole>
    );
}

function RoomPageInner({ roomId }: { roomId: string }): JSX.Element {
    const context = useShieldedHeaders({
        "X-Auth-Room-Id": roomId,
    });
    const [roomDetailsResponse] = useRoomPage_GetRoomDetailsQuery({
        variables: {
            roomId,
        },
        context,
    });
    const title = useTitle(
        roomDetailsResponse.fetching
            ? "Loading room"
            : roomDetailsResponse.data?.room_Room_by_pk?.name ?? "Unknown room"
    );

    return (
        <>
            {title}
            <QueryWrapper
                getter={(data) => data.room_Room_by_pk}
                queryResult={roomDetailsResponse}
                childrenNoData={() => <PageNotFound />}
            >
                {(room: RoomPage_RoomDetailsFragment) => <Room roomDetails={room} />}
            </QueryWrapper>
        </>
    );
}

gql`
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
