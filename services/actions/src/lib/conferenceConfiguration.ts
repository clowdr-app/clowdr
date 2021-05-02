import { gql } from "@apollo/client/core";
import { is } from "typescript-is";
import { GetConfigurationValueDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

gql`
    query GetConfigurationValue($key: String!, $conferenceId: uuid!) {
        conference_Configuration(where: { key: { _eq: $key }, conferenceId: { _eq: $conferenceId } }) {
            id
            value
        }
    }
`;

export async function getConferenceConfiguration<T = any>(conferenceId: string, key: string): Promise<any | null> {
    const result = await apolloClient.query({
        query: GetConfigurationValueDocument,
        variables: {
            conferenceId,
            key,
        },
    });

    if (result.data.conference_Configuration.length > 0 && is<T>(result.data.conference_Configuration[0].value)) {
        return result.data.conference_Configuration[0].value;
    } else {
        return null;
    }
}
