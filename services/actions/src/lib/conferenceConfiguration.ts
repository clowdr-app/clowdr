import { gql } from "@apollo/client/core";
import { is } from "typescript-is";
import type { Conference_ConfigurationKey_Enum} from "../generated/graphql";
import { GetConfigurationValueDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

gql`
    query GetConfigurationValue($key: conference_ConfigurationKey_enum!, $conferenceId: uuid!) {
        conference_Configuration_by_pk(conferenceId: $conferenceId, key: $key) {
            key
            value
        }
    }
`;

export async function getConferenceConfiguration<T = any>(
    conferenceId: string,
    key: Conference_ConfigurationKey_Enum
): Promise<any | null> {
    const result = await apolloClient.query({
        query: GetConfigurationValueDocument,
        variables: {
            conferenceId,
            key,
        },
    });

    if (
        result.data?.conference_Configuration_by_pk?.value !== undefined &&
        result.data?.conference_Configuration_by_pk?.value !== null &&
        is<T>(result.data.conference_Configuration_by_pk.value)
    ) {
        return result.data.conference_Configuration_by_pk.value;
    } else {
        return null;
    }
}
