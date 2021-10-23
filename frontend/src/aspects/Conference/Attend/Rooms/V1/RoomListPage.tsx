import { Button, Heading, HStack, useDisclosure } from "@chakra-ui/react";
import { gql } from "@urql/core";
import React, { useCallback } from "react";
import { useHistory } from "react-router-dom";
import type { RoomListRoomDetailsFragment } from "../../../../../generated/graphql";
import { useGetAllRoomsQuery } from "../../../../../generated/graphql";
import { LinkButton } from "../../../../Chakra/LinkButton";
import PageNotFound from "../../../../Errors/PageNotFound";
import usePolling from "../../../../Generic/usePolling";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import QueryWrapper from "../../../../GQL/QueryWrapper";
import FAIcon from "../../../../Icons/FAIcon";
import { useTitle } from "../../../../Utils/useTitle";
import RequireRole from "../../../RequireRole";
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
                _and: [
                    { originatingItem: { typeName: { _neq: SPONSOR } } }
                    { _not: { _or: [{ events: {} }, { chat: { enableMandatorySubscribe: { _eq: true } } }] } }
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
    const { conferencePath } = useAuthParameters();
    const conference = useConference();
    const registrant = useCurrentRegistrant();

    const title = useTitle(`Rooms - ${conference.shortName}`);

    const [result, refetchAllRooms] = useGetAllRoomsQuery({
        variables: {
            conferenceId: conference.id,
            registrantId: registrant.id,
        },
        requestPolicy: "cache-and-network",
    });
    usePolling(refetchAllRooms, 2.5 * 60 * 1000);

    const { isOpen, onClose, onOpen } = useDisclosure();

    const history = useHistory();
    const refetch = useCallback(
        async (id, cb) => {
            // Wait, because Vonage session creation is not instantaneous
            setTimeout(() => {
                cb();
                history.push(`${conferencePath}/room/${id}`);
            }, 2000);
        },
        [conferencePath, history]
    );

    return (
        <RequireRole attendeeRole componentIfDenied={<PageNotFound />}>
            {title}
            <CreateRoomModal isOpen={isOpen} onClose={onClose} onCreated={refetch} />
            <Heading as="h1" id="page-heading" display="none">
                Rooms
            </Heading>
            <HStack flexWrap="wrap" justifyContent="center" mt={2} w="100%">
                <LinkButton
                    to={`${conferencePath}/shuffle`}
                    colorScheme="PrimaryActionButton"
                    linkProps={{ flex: "40% 1 1", maxW: "600px" }}
                    w="100%"
                >
                    <FAIcon icon="random" iconStyle="s" mr={3} />
                    Networking
                </LinkButton>
                <LinkButton
                    to={`${conferencePath}/registrants`}
                    colorScheme="PrimaryActionButton"
                    linkProps={{ flex: "40% 1 1", maxW: "600px" }}
                    w="100%"
                >
                    <FAIcon icon="cat" iconStyle="s" mr={3} />
                    People
                </LinkButton>
            </HStack>
            <QueryWrapper getter={(data) => data.socialRooms} queryResult={result}>
                {(rooms: readonly RoomListRoomDetailsFragment[]) => (
                    <RoomList rooms={rooms} layout={{ type: "grid", title: "Social Rooms" }} />
                )}
            </QueryWrapper>
            <HStack flexWrap="wrap" justifyContent="center" mt={2}>
                <Button onClick={onOpen} colorScheme="PrimaryActionButton">
                    Create new room
                </Button>
            </HStack>
            <QueryWrapper getter={(data) => data.programRooms} queryResult={result}>
                {(rooms: readonly RoomListRoomDetailsFragment[]) => (
                    <RoomList rooms={rooms} layout={{ type: "grid", title: "Program Rooms" }} />
                )}
            </QueryWrapper>
            {/* <QueryWrapper getter={(data) => data.discussionRooms} queryResult={result}>
                {(rooms: readonly RoomListRoomDetailsFragment[]) => (
                    <RoomList rooms={rooms} layout={{ type: "grid", title: "Discussion Rooms" }} limit={25} />
                )}
            </QueryWrapper> */}
        </RequireRole>
    );
}
