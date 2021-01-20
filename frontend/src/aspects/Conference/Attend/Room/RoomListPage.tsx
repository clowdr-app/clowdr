import { gql } from "@apollo/client";
import { Button, Heading, useDisclosure } from "@chakra-ui/react";
import React, { useCallback, useEffect } from "react";
import { Permission_Enum, RoomListRoomDetailsFragment, useGetAllRoomsQuery } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import usePrimaryMenuButtons from "../../../Menu/usePrimaryMenuButtons";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import { CreateRoomModal } from "./CreateRoomModal";
import { RoomList } from "./RoomList";

gql`
    query GetAllRooms($conferenceId: uuid!) {
        Room(
            where: { conferenceId: { _eq: $conferenceId }, roomPrivacyName: { _neq: MANAGED } }
            order_by: { name: asc }
        ) {
            ...RoomListRoomDetails
        }
    }

    fragment RoomListRoomDetails on Room {
        id
        name
        roomPrivacyName
    }
`;

export default function RoomListPage(): JSX.Element {
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
            <ApolloQueryWrapper getter={(data) => data.Room} queryResult={result}>
                {(rooms: readonly RoomListRoomDetailsFragment[]) => (
                    <>
                        <Heading as="h2">Rooms</Heading>
                        <Button onClick={onOpen} colorScheme="green">
                            Create new room
                        </Button>
                        <RoomList rooms={rooms} layout="grid" />
                        <CreateRoomModal isOpen={isOpen} onClose={onClose} onCreated={refetch} />
                    </>
                )}
            </ApolloQueryWrapper>
        </RequireAtLeastOnePermissionWrapper>
    );
}
