import { gql } from "@apollo/client";
import { Spinner } from "@chakra-ui/react";
import assert from "assert";
import React from "react";
import { Conference, useConferenceBySlugQuery } from "../../generated/graphql";
import PageNotFound from "../Errors/PageNotFound";

const _conferenceProviderQueries = gql`
    query ConferenceBySlug($slug: String!) {
        Conference(where: { slug: { _eq: $slug } }, limit: 1) {
            createdBy
            id
            name
            shortName
            slug
            updatedAt
            createdAt
        }
    }
`;

export type ConferenceInfo = Pick<
    Conference,
    | "createdBy"
    | "id"
    | "name"
    | "shortName"
    | "slug"
    | "updatedAt"
    | "createdAt"
>;

const ConferenceContext = React.createContext<ConferenceInfo | undefined>(
    undefined
);

export function useConference(): ConferenceInfo {
    const conf = React.useContext(ConferenceContext);
    assert(conf);
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

    if (loading) {
        return <Spinner />;
    }

    if (error) {
        return <PageNotFound />;
    }

    if (!data || data.Conference.length === 0) {
        return <PageNotFound />;
    }

    return (
        <ConferenceContext.Provider value={data.Conference[0]}>
            {children}
        </ConferenceContext.Provider>
    );
}
