import { Cache } from "@midspace/component-clients/cache/cache";
import { gql } from "graphql-tag";
import type { Room_ManagementMode_Enum } from "../../generated/graphql";
import { EventInfoDocument } from "../../generated/graphql";
import { testMode } from "../../testMode";
import type { Person } from "./chatInfo";

gql`
    query EventInfo($eventId: uuid!) {
        schedule_Event_by_pk(id: $eventId) {
            id
            conference {
                id
                slug
                shortName
            }
            room {
                id
                name
                managementModeName
                roomMemberships {
                    id
                    registrant {
                        id
                        userId
                    }
                }
            }
        }
    }
`;

export type EventInfo = {
    conference: {
        id: string;
        slug: string;
        shortName?: string;
    };
    room: {
        id: string;
        name: string;
        managementMode: Room_ManagementMode_Enum;
        people: Person[];
    };
};

const eventInfoCache = new Cache<EventInfo>(
    "realtime.caches:EventInfo",
    async (eventId, testMode_ExpectedValue) => {
        return testMode(
            async (apolloClient) => {
                const response = await apolloClient.query({
                    query: EventInfoDocument,
                    variables: {
                        eventId,
                    },
                });

                const result: EventInfo | undefined = response.data.schedule_Event_by_pk
                    ? {
                          conference: {
                              id: response.data.schedule_Event_by_pk.conference.id,
                              slug: response.data.schedule_Event_by_pk.conference.slug,
                              shortName: response.data.schedule_Event_by_pk.conference.shortName,
                          },
                          room: {
                              id: response.data.schedule_Event_by_pk.room.id,
                              name: response.data.schedule_Event_by_pk.room.name,
                              managementMode: response.data.schedule_Event_by_pk.room.managementModeName,
                              people: response.data.schedule_Event_by_pk.room.roomPeople.map<Person>((p) => ({
                                  registrantId: p.registrant.id,
                                  userId: p.registrant.userId ?? undefined,
                              })),
                          },
                      }
                    : undefined;

                return result;
            },
            async () => testMode_ExpectedValue
        );
    },
    JSON.stringify,
    JSON.parse
);

export async function getEventInfo(
    eventId: string,
    testMode_ExpectedInfo: EventInfo,
    refetchNow = false
): Promise<EventInfo | undefined> {
    const info = await eventInfoCache.get(eventId, testMode_ExpectedInfo, refetchNow);
    if (!info && !refetchNow) {
        return getEventInfo(eventId, testMode_ExpectedInfo, true);
    }
    return info;
}
