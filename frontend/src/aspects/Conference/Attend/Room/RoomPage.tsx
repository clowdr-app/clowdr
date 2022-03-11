import { AuthHeader } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import React, { useMemo } from "react";
import type { RoomPage_RoomDetailsFragment } from "../../../../generated/graphql";
import { useRoomPage_GetRoomDetailsQuery } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import { makeContext } from "../../../GQL/make-context";
import QueryWrapper from "../../../GQL/QueryWrapper";
import { useTitle } from "../../../Hooks/useTitle";
import RequireRole from "../../RequireRole";
import useCurrentRegistrant from "../../useCurrentRegistrant";
import Room from "./Room";

gql`
    query RoomPage_GetRoomDetails($roomId: uuid!, $registrantId: uuid!) @cached {
        room_Room_by_pk(id: $roomId) {
            ...RoomPage_RoomDetails
        }
    }

    fragment RoomPage_RoomDetails on room_Room {
        id
        name
        isProgramRoom
        isStreamingProgramRoom
        publicVonageSessionId
        chatId
        itemId
        roomMemberships(where: { registrantId: { _eq: $registrantId } }) {
            id
            personRoleName
        }
        item {
            id
            typeName
            elements(
                where: { typeName: { _in: [IMAGE_URL, IMAGE_FILE] }, layoutData: { _contains: { isLogo: true } } }
                limit: 1
                order_by: { updatedAt: desc }
            ) {
                id
                data
                layoutData
                typeName
                updatedAt
            }
            selfPeople: itemPeople(where: { person: { registrantId: { _eq: $registrantId } } }) {
                id
                roleName
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
            roomId
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
        roomId
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
    const registrant = useCurrentRegistrant();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.RoomId]: roomId,
            }),
        [roomId]
    );
    const [roomDetailsResponse] = useRoomPage_GetRoomDetailsQuery({
        variables: {
            roomId,
            registrantId: registrant.id,
        },
        context,
    });

    const title = useTitle(
        roomDetailsResponse.fetching
            ? "Loading room"
            : roomDetailsResponse?.data?.room_Room_by_pk?.name ?? "Unknown room"
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
    query GetEventVonageDetails($eventId: uuid!) @cached {
        schedule_Event_by_pk(id: $eventId) {
            eventVonageSession {
                sessionId
                eventId
                id
            }
            id
        }
    }
`;
