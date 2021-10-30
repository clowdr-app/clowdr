import { Cache } from "@midspace/component-clients/cache/cache";
import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "graphql-tag";
import type { EventInfoQuery, EventInfoQueryVariables } from "../../generated/graphql";
import { EventInfoDocument } from "../../generated/graphql";

gql`
    query EventInfo($eventId: uuid!) {
        schedule_Event_by_pk(id: $eventId) {
            id
            conferenceId
            roomId
        }
    }
`;

export type EventInfo = {
    conferenceId: string;
    roomId: string;
};

const eventInfoCache = new Cache<EventInfo>(
    "realtime.caches:EventInfo",
    async (eventId) => {
        const response =
            gqlClient &&
            (await gqlClient
                .query<EventInfoQuery, EventInfoQueryVariables>(EventInfoDocument, {
                    eventId,
                })
                .toPromise());

        const result: EventInfo | undefined = response?.data?.schedule_Event_by_pk
            ? {
                  conferenceId: response.data.schedule_Event_by_pk.conferenceId,
                  roomId: response.data.schedule_Event_by_pk.roomId,
              }
            : undefined;

        return result;
    },
    JSON.stringify,
    JSON.parse
);

export async function getEventInfo(eventId: string, refetchNow = false): Promise<EventInfo | undefined> {
    const info = await eventInfoCache.get(eventId, refetchNow);
    if (!info && !refetchNow) {
        return getEventInfo(eventId, true);
    }
    return info;
}
