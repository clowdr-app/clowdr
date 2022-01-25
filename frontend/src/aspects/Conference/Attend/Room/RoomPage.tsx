import { AuthHeader } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import React, { useEffect, useMemo, useState } from "react";
import type { OperationResult } from "urql";
import { useClient } from "urql";
import type {
    RoomPage_GetRoomDetailsQuery,
    RoomPage_GetRoomDetailsQueryVariables,
    RoomPage_RoomDetailsFragment,
} from "../../../../generated/graphql";
import { RoomPage_GetRoomDetailsDocument } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import { makeContext } from "../../../GQL/make-context";
import QueryWrapper from "../../../GQL/QueryWrapper";
import { useTitle } from "../../../Hooks/useTitle";
import RequireRole from "../../RequireRole";
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
        itemId
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

    query RoomPage_IsAdmin($roomId: uuid!, $registrantId: uuid!) {
        room_RoomMembership(
            where: { personRoleName: { _eq: ADMIN }, registrantId: { _eq: $registrantId }, roomId: { _eq: $roomId } }
        ) {
            id
            personRoleName
            registrantId
            roomId
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
    const [roomDetailsResponse, setRoomDetailsResponse] =
        useState<OperationResult<RoomPage_GetRoomDetailsQuery> | null>(null);
    const [fetchingRoomDetails, setFetchingRoomDetails] = useState<boolean>(false);
    const client = useClient();
    // We really need to protect the room page against reloads at this level. It can result in the video chat flickering
    // which is unacceptable. As it turns out, "searching" can result in Urql reloading the room details query.
    useEffect(() => {
        let setFetchingRoomDetailsRef: typeof setFetchingRoomDetails | null = setFetchingRoomDetails;
        (async () => {
            setFetchingRoomDetailsRef?.(true);

            try {
                const result = await client
                    .query<RoomPage_GetRoomDetailsQuery, RoomPage_GetRoomDetailsQueryVariables>(
                        RoomPage_GetRoomDetailsDocument,
                        {
                            roomId,
                            registrantId: registrant.id,
                        },
                        context
                    )
                    .toPromise();
                setRoomDetailsResponse(result);
            } catch (e: any) {
                console.error("Error fetching room details", e);
            }

            setFetchingRoomDetailsRef?.(false);
        })();

        return () => {
            setFetchingRoomDetailsRef = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [registrant.id, roomId]);

    const title = useTitle(
        fetchingRoomDetails ? "Loading room" : roomDetailsResponse?.data?.room_Room_by_pk?.name ?? "Unknown room"
    );

    const queryResult = useMemo(
        () =>
            roomDetailsResponse
                ? {
                      ...roomDetailsResponse,
                      fetching: fetchingRoomDetails,
                  }
                : { fetching: fetchingRoomDetails },
        [fetchingRoomDetails, roomDetailsResponse]
    );

    return (
        <>
            {title}
            <QueryWrapper
                getter={(data) => data.room_Room_by_pk}
                queryResult={queryResult}
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
                eventId
                id
            }
            id
        }
    }
`;
