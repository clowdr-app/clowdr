import { gql } from "@apollo/client/core";
import { AttendeeInfoDocument } from "../../generated/graphql";
import { testMode } from "../../testMode";
import { Cache } from "./cache";

gql`
    query AttendeeInfo($attendeeId: uuid!) {
        Attendee_by_pk(id: $attendeeId) {
            id
            userId
            displayName
        }
    }
`;

export type AttendeeInfo = {
    userId?: string;
    displayName: string;
};

const AttendeeInfoCache = new Cache<AttendeeInfo>(
    "caches:AttendeeInfo",
    async (attendeeId, testMode_ExpectedValue) => {
        return testMode(
            async (apolloClient) => {
                const response = await apolloClient.query({
                    query: AttendeeInfoDocument,
                    variables: {
                        attendeeId,
                    },
                });

                const result: AttendeeInfo | undefined = response.data.Attendee_by_pk
                    ? {
                          displayName: response.data.Attendee_by_pk.displayName,
                          userId: response.data.Attendee_by_pk.userId ?? undefined,
                      }
                    : undefined;

                return result;
            },
            async () => testMode_ExpectedValue
        );
    },
    JSON.stringify,
    JSON.parse,
    1 * 60 * 60 * 1000, // Refetch attendee info every hour
    5 * 60 * 1000
);

export async function getAttendeeInfo(
    attendeeId: string,
    testMode_ExpectedInfo: AttendeeInfo,
    refetchNow = false
): Promise<(AttendeeInfo & { id: string }) | undefined> {
    const info = await AttendeeInfoCache.get(attendeeId, testMode_ExpectedInfo, refetchNow);
    if (!info && !refetchNow) {
        return getAttendeeInfo(attendeeId, testMode_ExpectedInfo, true);
    }
    return info ? { ...info, id: attendeeId } : undefined;
}
