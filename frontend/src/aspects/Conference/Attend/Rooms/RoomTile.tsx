import { Spinner } from "@chakra-ui/react";
import { AuthHeader } from "@midspace/shared-types/auth";
import React, { useMemo } from "react";
import { gql } from "urql";
import { Room_ManagementMode_Enum, useRoomTile_GetRoomQuery } from "../../../../generated/graphql";
import Card from "../../../Card";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { makeContext } from "../../../GQL/make-context";
import RoomPresenceGrid from "./RoomPresenceGrid";

gql`
    query RoomTile_GetRoom($roomId: uuid!) @cached {
        room_Room_by_pk(id: $roomId) {
            ...RoomTile_Room
        }
    }

    fragment RoomTile_Room on room_Room {
        id
        name
        managementModeName
        itemId
        item {
            id
            title
        }
    }
`;

export default function RoomTile({ roomId }: { roomId: string }): JSX.Element {
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.RoomId]: roomId,
            }),
        [roomId]
    );
    const [response] = useRoomTile_GetRoomQuery({
        variables: {
            roomId,
        },
        context,
    });
    const { conferencePath } = useAuthParameters();
    return (
        <Card
            w="100%"
            to={`${conferencePath}/room/${roomId}`}
            heading={
                response.data?.room_Room_by_pk?.item?.title ?? response.data?.room_Room_by_pk?.name ?? "Loading..."
            }
            topLeftButton={
                response.data?.room_Room_by_pk?.managementModeName === Room_ManagementMode_Enum.Private
                    ? {
                          colorScheme: "gray",
                          iconStyle: "s",
                          icon: "lock",
                          label: "Private",
                          variant: "solid",
                          showLabel: true,
                      }
                    : undefined
            }
        >
            {response.data?.room_Room_by_pk ? (
                <RoomPresenceGrid roomId={roomId} />
            ) : (
                <Spinner label="Loading room information" />
            )}
        </Card>
    );
}
