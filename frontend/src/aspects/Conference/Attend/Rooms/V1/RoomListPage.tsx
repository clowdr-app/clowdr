import { gql } from "@apollo/client";
import { Button, Heading, HStack, useDisclosure } from "@chakra-ui/react";
import React, { useCallback } from "react";
import { useHistory } from "react-router-dom";
import {
    Permissions_Permission_Enum,
    RoomListRoomDetailsFragment,
    useGetAllRoomsQuery,
} from "../../../../../generated/graphql";
import { LinkButton } from "../../../../Chakra/LinkButton";
import PageNotFound from "../../../../Errors/PageNotFound";
import ApolloQueryWrapper from "../../../../GQL/ApolloQueryWrapper";
import FAIcon from "../../../../Icons/FAIcon";
import { useTitle } from "../../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../../useConference";
import useCurrentRegistrant from "../../../useCurrentRegistrant";
import { CreateRoomModal } from "../../Room/CreateRoomModal";
import { RoomList } from "./RoomList";

gql`
    query GetAllRooms($conferenceId: uuid!, $registrantId: uuid!) {
        socialRooms: room_Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                _not: { _or: [{ events: {} }, { chat: { enableMandatoryPin: { _eq: true } } }] }
                originatingItemId: { _is_null: true }
                originatingEventId: { _is_null: true }
                _or: [
                    { managementModeName: { _eq: PUBLIC } }
                    { managementModeName: { _eq: PRIVATE }, roomPeople: { registrantId: { _eq: $registrantId } } }
                ]
            }
            order_by: { name: asc }
        ) {
            ...RoomListRoomDetails
        }
        # discussionRooms: room_Room(
        #     where: {
        #         conferenceId: { _eq: $conferenceId }
        #         _not: { _or: [{ events: {} }, { chat: { enableMandatoryPin: { _eq: true } } }] }
        #         _or: [{ originatingItemId: { _is_null: false } }, { originatingEventId: { _is_null: false } }]
        #         originatingItem: { typeName: { _neq: SPONSOR } }
        #         managementModeName: { _in: [PUBLIC, PRIVATE] }
        #     }
        #     order_by: { name: asc }
        # ) {
        #     ...RoomListRoomDetails
        # }
        programRooms: room_Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                events: {}
                managementModeName: { _in: [PUBLIC, PRIVATE] }
                _or: [{ originatingItemId: { _is_null: true } }, { originatingItem: { typeName: { _neq: SPONSOR } } }]
            }
            order_by: { name: asc }
        ) {
            ...RoomListRoomDetails
        }
    }

    query GetAllTodaysRooms(
        $conferenceId: uuid!
        $todayStart: timestamptz!
        $todayEnd: timestamptz!
        $registrantId: uuid!
    ) {
        socialOrDiscussionRooms: room_Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                _not: { _or: [{ events: {} }, { chat: { enableMandatorySubscribe: { _eq: true } } }] }
                _and: [
                    {
                        _or: [
                            { originatingItemId: { _is_null: true } }
                            { originatingItem: { typeName: { _neq: SPONSOR } } }
                        ]
                    }
                    {
                        _or: [
                            { managementModeName: { _eq: PUBLIC } }
                            {
                                managementModeName: { _eq: PRIVATE }
                                roomPeople: { registrantId: { _eq: $registrantId } }
                            }
                        ]
                    }
                ]
            }
            order_by: { name: asc }
        ) {
            ...RoomListRoomDetails
        }
        programRooms: room_Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                events: { startTime: { _lte: $todayEnd }, endTime: { _gte: $todayStart } }
                _or: [{ originatingItemId: { _is_null: true } }, { originatingItem: { typeName: { _neq: SPONSOR } } }]
                managementModeName: { _in: [PUBLIC, PRIVATE] }
            }
            order_by: { name: asc }
        ) {
            ...RoomListRoomDetails
        }
    }

    fragment RoomListRoomDetails on room_Room {
        id
        name
        priority
        managementModeName
        originatingItem {
            id
            itemPeople(where: { roleName: { _neq: "REVIEWER" } }) {
                id
                roleName
                person {
                    id
                    registrantId
                }
            }
        }
        originatingEventId
    }
`;

export default function RoomListPage(): JSX.Element {
    const conference = useConference();
    const registrant = useCurrentRegistrant();

    const title = useTitle(`Rooms - ${conference.shortName}`);

    const result = useGetAllRoomsQuery({
        variables: {
            conferenceId: conference.id,
            registrantId: registrant.id,
        },
        pollInterval: 2.5 * 60 * 1000,
        fetchPolicy: "cache-and-network",
        nextFetchPolicy: "cache-first",
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
            componentIfDenied={<PageNotFound />}
            permissions={[
                Permissions_Permission_Enum.ConferenceViewAttendees,
                Permissions_Permission_Enum.ConferenceView,
                Permissions_Permission_Enum.ConferenceManageSchedule,
            ]}
        >
            {title}
            <CreateRoomModal isOpen={isOpen} onClose={onClose} onCreated={refetch} />
            <Heading as="h1" id="page-heading" display="none">
                Rooms
            </Heading>
            <HStack flexWrap="wrap" justifyContent="center" mt={2} w="100%">
                <LinkButton
                    to={`/conference/${conference.slug}/shuffle`}
                    colorScheme="PrimaryActionButton"
                    linkProps={{ flex: "40% 1 1", maxW: "600px" }}
                    w="100%"
                >
                    <FAIcon icon="random" iconStyle="s" mr={3} />
                    Networking
                </LinkButton>
                <LinkButton
                    to={`/conference/${conference.slug}/registrants`}
                    colorScheme="PrimaryActionButton"
                    linkProps={{ flex: "40% 1 1", maxW: "600px" }}
                    w="100%"
                >
                    <FAIcon icon="cat" iconStyle="s" mr={3} />
                    People
                </LinkButton>
            </HStack>
            <ApolloQueryWrapper getter={(data) => data.socialRooms} queryResult={result}>
                {(rooms: readonly RoomListRoomDetailsFragment[]) => (
                    <RoomList rooms={rooms} layout={{ type: "grid", title: "Social Rooms" }} />
                )}
            </ApolloQueryWrapper>
            <HStack flexWrap="wrap" justifyContent="center" mt={2}>
                <Button onClick={onOpen} colorScheme="PrimaryActionButton">
                    Create new room
                </Button>
            </HStack>
            <ApolloQueryWrapper getter={(data) => data.programRooms} queryResult={result}>
                {(rooms: readonly RoomListRoomDetailsFragment[]) => (
                    <RoomList rooms={rooms} layout={{ type: "grid", title: "Program Rooms" }} />
                )}
            </ApolloQueryWrapper>
            {/* <ApolloQueryWrapper getter={(data) => data.discussionRooms} queryResult={result}>
                {(rooms: readonly RoomListRoomDetailsFragment[]) => (
                    <RoomList rooms={rooms} layout={{ type: "grid", title: "Discussion Rooms" }} limit={25} />
                )}
            </ApolloQueryWrapper> */}
        </RequireAtLeastOnePermissionWrapper>
    );
}
