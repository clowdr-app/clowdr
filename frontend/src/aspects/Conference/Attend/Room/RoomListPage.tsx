import { gql } from "@apollo/client";
import { Button, HStack, useDisclosure } from "@chakra-ui/react";
import React, { useCallback } from "react";
import { useHistory } from "react-router-dom";
import { Permission_Enum, RoomListRoomDetailsFragment, useGetAllRoomsQuery } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import ConferencePageNotFound from "../../../Errors/ConferencePageNotFound";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import FAIcon from "../../../Icons/FAIcon";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import { CreateRoomModal } from "./CreateRoomModal";
import { RoomList } from "./RoomList";

gql`
    query GetAllRooms($conferenceId: uuid!) {
        socialRooms: Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                _not: { _or: [{ events: {} }, { chat: { enableMandatoryPin: { _eq: true } } }] }
                originatingContentGroupId: { _is_null: true }
                originatingEventId: { _is_null: true }
                roomPrivacyName: { _in: [PUBLIC, PRIVATE] }
            }
            order_by: { name: asc }
        ) {
            ...RoomListRoomDetails
        }
        discussionRooms: Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                _not: { _or: [{ events: {} }, { chat: { enableMandatoryPin: { _eq: true } } }] }
                _or: [{ originatingContentGroupId: { _is_null: false } }, { originatingEventId: { _is_null: false } }]
                roomPrivacyName: { _in: [PUBLIC, PRIVATE] }
            }
            order_by: { name: asc }
        ) {
            ...RoomListRoomDetails
        }
        programRooms: Room(
            where: { conferenceId: { _eq: $conferenceId }, events: {}, roomPrivacyName: { _in: [PUBLIC, PRIVATE] } }
            order_by: { name: asc }
        ) {
            ...RoomListRoomDetails
        }
    }

    query GetAllTodaysRooms($conferenceId: uuid!, $todayStart: timestamptz!, $todayEnd: timestamptz!) {
        socialOrDiscussionRooms: Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                _not: { _or: [{ events: {} }, { chat: { enableMandatoryPin: { _eq: true } } }] }
                roomPrivacyName: { _in: [PUBLIC, PRIVATE] }
            }
            order_by: { name: asc }
        ) {
            ...RoomListRoomDetails
        }
        programRooms: Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                events: { startTime: { _lte: $todayEnd }, endTime: { _gte: $todayStart } }
                roomPrivacyName: { _in: [PUBLIC, PRIVATE] }
            }
            order_by: { name: asc }
        ) {
            ...RoomListRoomDetails
        }
    }

    fragment RoomListRoomDetails on Room {
        id
        name
        priority
        roomPrivacyName
        originatingContentGroupId
        originatingEventId
    }
`;

export default function RoomListPage(): JSX.Element {
    const conference = useConference();

    const title = useTitle(`Rooms - ${conference.shortName}`);

    const result = useGetAllRoomsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    const { isOpen, onClose, onOpen } = useDisclosure();

    const history = useHistory();
    const refetch = useCallback(
        async (id, cb) => {
            // Wait, because Vonage session creation is not instantaneous
            setTimeout(() => {
                cb();
                history.push(`/conference/${conference.slug}/room/${id}`);
            }, 2000);
        },
        [conference.slug, history]
    );

    return (
        <RequireAtLeastOnePermissionWrapper
            componentIfDenied={<ConferencePageNotFound />}
            permissions={[
                Permission_Enum.ConferenceViewAttendees,
                Permission_Enum.ConferenceView,
                Permission_Enum.ConferenceManageSchedule,
            ]}
        >
            {title}
            <CreateRoomModal isOpen={isOpen} onClose={onClose} onCreated={refetch} />
            <HStack flexWrap="wrap" justifyContent="center" mt={2}>
                <Button onClick={onOpen} colorScheme="green">
                    Create new room
                </Button>
                <LinkButton to={`/conference/${conference.slug}/shuffle`} colorScheme="blue">
                    <FAIcon icon="random" iconStyle="s" mr={3} />
                    Shuffle queues
                </LinkButton>
            </HStack>
            <ApolloQueryWrapper getter={(data) => data.programRooms} queryResult={result}>
                {(rooms: readonly RoomListRoomDetailsFragment[]) => (
                    <RoomList rooms={rooms} layout={{ type: "grid", title: "Program Rooms" }} />
                )}
            </ApolloQueryWrapper>
            <ApolloQueryWrapper getter={(data) => data.socialRooms} queryResult={result}>
                {(rooms: readonly RoomListRoomDetailsFragment[]) => (
                    <RoomList rooms={rooms} layout={{ type: "grid", title: "Social Rooms" }} />
                )}
            </ApolloQueryWrapper>
            <ApolloQueryWrapper getter={(data) => data.discussionRooms} queryResult={result}>
                {(rooms: readonly RoomListRoomDetailsFragment[]) => (
                    <RoomList rooms={rooms} layout={{ type: "grid", title: "Discussion Rooms" }} limit={25} />
                )}
            </ApolloQueryWrapper>
        </RequireAtLeastOnePermissionWrapper>
    );
}
