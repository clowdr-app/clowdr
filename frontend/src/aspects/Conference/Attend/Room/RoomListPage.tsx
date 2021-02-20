import { gql } from "@apollo/client";
import { Button, Heading, useDisclosure, VStack } from "@chakra-ui/react";
import React, { useCallback } from "react";
import { Permission_Enum, RoomListRoomDetailsFragment, useGetAllRoomsQuery } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { useNoPrimaryMenuButtons } from "../../../Menu/usePrimaryMenuButtons";
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
                _not: { events: {} }
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

    fragment RoomListRoomDetails on Room {
        id
        name
        roomPrivacyName
        originatingContentGroupId
        originatingEventId
    }
`;

export default function RoomListPage(): JSX.Element {
    const conference = useConference();
    useNoPrimaryMenuButtons();

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
            componentIfDenied={<PageNotFound />}
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
                        <Button onClick={onOpen} colorScheme="green" mb={5}>
                            Create new room
                        </Button>
                        <RoomList rooms={rooms} layout="grid" />
                        <CreateRoomModal isOpen={isOpen} onClose={onClose} onCreated={refetch} />
                    </VStack>
                )}
            </ApolloQueryWrapper>
        </RequireAtLeastOnePermissionWrapper>
    );
}
