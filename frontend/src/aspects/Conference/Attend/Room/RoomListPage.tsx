import { gql } from "@apollo/client";
import { Button, Heading, HStack, useDisclosure, VStack } from "@chakra-ui/react";
import React, { useCallback } from "react";
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
        socialRooms: Room(
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

    const refetch = useCallback(async () => {
        await result.refetch();
    }, [result]);

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
            <ApolloQueryWrapper getter={(data) => data.programRooms} queryResult={result}>
                {(rooms: readonly RoomListRoomDetailsFragment[]) => (
                    <VStack>
                        <Heading as="h2" mb={5} mt={5}>
                            Program Rooms
                        </Heading>
                        <RoomList rooms={rooms} layout="grid" />
                        <CreateRoomModal isOpen={isOpen} onClose={onClose} onCreated={refetch} />
                    </VStack>
                )}
            </ApolloQueryWrapper>
            <ApolloQueryWrapper getter={(data) => data.socialRooms} queryResult={result}>
                {(rooms: readonly RoomListRoomDetailsFragment[]) => (
                    <VStack>
                        <Heading as="h2" my={5}>
                            Social Rooms
                        </Heading>
                        <HStack flexWrap="wrap" justifyContent="center">
                            <Button onClick={onOpen} colorScheme="green" mb={2}>
                                Create new room
                            </Button>
                            <LinkButton to={`/conference/${conference.slug}/shuffle`} colorScheme="blue" mb={2}>
                                <FAIcon icon="random" iconStyle="s" mr={3} />
                                Shuffle queues
                            </LinkButton>
                        </HStack>
                        <RoomList rooms={rooms} layout="grid" />
                        <CreateRoomModal isOpen={isOpen} onClose={onClose} onCreated={refetch} />
                    </VStack>
                )}
            </ApolloQueryWrapper>
        </RequireAtLeastOnePermissionWrapper>
    );
}
