import { gql } from "@apollo/client";
import React, { useEffect } from "react";
import {
    Permission_Enum,
    RoomPage_RoomDetailsFragment,
    useRoomPage_GetRoomDetailsQuery,
} from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import usePolling from "../../../Generic/usePolling";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
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
            componentIfDenied={<PageNotFound />}
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

    return (
        <>
            {title}
            <RoomMembersProvider roomId={roomId}>
                <ApolloQueryWrapper getter={(data) => data.Room_by_pk} queryResult={result}>
                    {(room: RoomPage_RoomDetailsFragment) => <Room roomDetails={room} />}
                </ApolloQueryWrapper>
            </RoomMembersProvider>
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
