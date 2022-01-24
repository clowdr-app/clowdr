import { gql } from "@apollo/client/core";
import type { getSlugArgs } from "@midspace/hasura/action-types";
import { CheckForFrontendHostsDocument } from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

gql`
    query CheckForFrontendHosts($host: jsonb!) {
        system_Configuration(where: { key: { _eq: DEFAULT_FRONTEND_HOST }, value: { _eq: $host } }) {
            key
            value
        }
        conference_Configuration(where: { key: { _eq: FRONTEND_HOST }, value: { _eq: $host } }) {
            key
            value
            conference {
                id
                slug
            }
        }
    }
`;

export async function handleGetSlug(args: getSlugArgs): Promise<string | null> {
    const directSlugMatch = args.url.match(/https:\/\/[^/]*\/conference\/([^/]*)/i);
    if (directSlugMatch?.length === 2) {
        return directSlugMatch[1];
    }

    const originMatch = args.url.match(/(https:\/\/[^/]+).*/i);
    if (originMatch?.length === 2) {
        const origin = originMatch[1];
        const response = await apolloClient.query({
            query: CheckForFrontendHostsDocument,
            variables: {
                host: origin,
            },
        });
        return response.data.system_Configuration[0]?.value
            ? null
            : response.data.conference_Configuration[0]?.conference?.slug ?? null;
    }

    return null;
}
