import { Cache } from "@midspace/component-clients/cache/cache";
import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "@urql/core";
import type { GetRoomQuery, GetRoomQueryVariables, Room_ManagementMode_Enum } from "../generated/graphql";
import { GetRoomDocument } from "../generated/graphql";

gql`
    query GetRoom($id: uuid!) {
        room_Room_by_pk(id: $id) {
            id
            conferenceId
            subconferenceId
            managementModeName
        }
    }
`;

export type Room = {
    id: string;
    conferenceId: string;
    subconferenceId?: string | null;
    managementModeName: Room_ManagementMode_Enum;
};

const RoomCache = new Cache<Room>(
    "auth.caches:Room",
    async (roomId) => {
        const response = await gqlClient
            ?.query<GetRoomQuery, GetRoomQueryVariables>(GetRoomDocument, {
                id: roomId,
            })
            .toPromise();

        const data = response?.data?.room_Room_by_pk;
        if (data) {
            // Remapping is necessary to remove __typename
            return {
                id: data.id,
                conferenceId: data.conferenceId,
                subconferenceId: data.subconferenceId,
                managementModeName: data.managementModeName,
            };
        }
        return undefined;
    },
    JSON.stringify,
    JSON.parse,
    7 * 24 * 60 * 60 * 1000, // Refetch room every 7 days
    5 * 60 * 1000
);

export async function getRoom(roomId: string, refetchNow = false): Promise<Room | undefined> {
    const info = await RoomCache.get(roomId, refetchNow);
    if (!info && !refetchNow) {
        return getRoom(roomId, true);
    }
    return info;
}

export async function invalidateCachedRoom(roomId: string): Promise<void> {
    await RoomCache.delete(roomId);
}

export async function updateCachedRoom(
    roomId: string,
    managementModeName: Room_ManagementMode_Enum,
    subconferenceId: string | null | undefined
): Promise<void> {
    await RoomCache.update(
        roomId,
        (existing) => {
            if (existing) {
                return {
                    ...existing,
                    managementModeName,
                    subconferenceId,
                };
            }
            return existing;
        },
        false
    );
}
