import { gql } from "@apollo/client";
import { Box, Spinner } from "@chakra-ui/react";
import assert from "assert";
import React from "react";
import { Conference, useConferenceBySlugQuery } from "../../generated/graphql";
import PageNotFound from "../Errors/PageNotFound";

const _conferenceProviderQueries = gql`
    query ConferenceBySlug($slug: String!) {
        Conference(where: { slug: { _eq: $slug } }) {
            id
            name
            shortName
            slug
        }
    }
`;

export type ConferenceInfo = Pick<Conference, "id" | "name" | "shortName" | "slug">;

const ConferenceContext = React.createContext<ConferenceInfo | undefined>(undefined);

export function useConference(): ConferenceInfo {
    const conf = React.useContext(ConferenceContext);
    assert(conf, "useConference: Context not available");
    return conf;
}

export default function ConferenceProvider({
    confSlug,
    children,
}: {
    confSlug: string;
    children: string | JSX.Element | JSX.Element[];
}): JSX.Element {
    const { loading, error, data } = useConferenceBySlugQuery({
        variables: {
            slug: confSlug,
        },
    });

    if (loading && !data) {
        return (
            <Box>
                <Spinner />
            </Box>
        );
    }

    if (error) {
        return <PageNotFound />;
    }

    if (!data || data.Conference.length === 0) {
        return <PageNotFound />;
    }

    return <ConferenceContext.Provider value={data.Conference[0]}>{children}</ConferenceContext.Provider>;
}
