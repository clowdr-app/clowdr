import { gql } from "@apollo/client/core";
import { RegistrantInfoDocument } from "../../generated/graphql";
import { testMode } from "../../testMode";
import { Cache } from "./cache";

gql`
    query RegistrantInfo($registrantId: uuid!) {
        registrant_Registrant_by_pk(id: $registrantId) {
            id
            userId
            displayName
        }
    }
`;

export type RegistrantInfo = {
    userId?: string;
    displayName: string;
};

const RegistrantInfoCache = new Cache<RegistrantInfo>(
    "realtime.caches:RegistrantInfo",
    async (registrantId, testMode_ExpectedValue) => {
        return testMode(
            async (apolloClient) => {
                const response = await apolloClient.query({
                    query: RegistrantInfoDocument,
                    variables: {
                        registrantId,
                    },
                });

                const result: RegistrantInfo | undefined = response.data.registrant_Registrant_by_pk
                    ? {
                          displayName: response.data.registrant_Registrant_by_pk.displayName,
                          userId: response.data.registrant_Registrant_by_pk.userId ?? undefined,
                      }
                    : undefined;

                return result;
            },
            async () => testMode_ExpectedValue
        );
    },
    JSON.stringify,
    JSON.parse,
    1 * 60 * 60 * 1000, // Refetch registrant info every hour
    5 * 60 * 1000
);

export async function getRegistrantInfo(
    registrantId: string,
    testMode_ExpectedInfo: RegistrantInfo,
    refetchNow = false
): Promise<(RegistrantInfo & { id: string }) | undefined> {
    const info = await RegistrantInfoCache.get(registrantId, testMode_ExpectedInfo, refetchNow);
    if (!info && !refetchNow) {
        return getRegistrantInfo(registrantId, testMode_ExpectedInfo, true);
    }
    return info ? { ...info, id: registrantId } : undefined;
}
