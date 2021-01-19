import { gql } from "@apollo/client";
import React, { useCallback, useRef } from "react";
import { useGetPresenceCountOfQuery } from "../../generated/graphql";
import { useConference } from "../Conference/useConference";
import { useLocation } from "react-router-dom";

interface PresenceCount {
    pageCount: number | undefined;
    getPageCountOf: (path: string) => Promise<number | undefined>;
}

const PresenceCountContext = React.createContext<PresenceCount | undefined>(undefined);

export function usePresenceCount(): PresenceCount {
    const ctx = React.useContext(PresenceCountContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

gql`
    subscription PresenceCount($path: String!, $conferenceId: uuid!) {
        presence_Page_by_pk(path: $path, conferenceId: $conferenceId) {
            path
            conferenceId
            count
        }
    }

    query GetPresenceCountOf($path: String!, $conferenceId: uuid!) {
        presence_Page(where: { path: { _eq: $path }, conferenceId: { _eq: $conferenceId } }, limit: 1) {
            path
            conferenceId
            count
        }
    }
`;

export default function PresenceCountProvider({
    children,
}: // disableSubscription,
{
    children: React.ReactNode | React.ReactNodeArray;
    disableSubscription?: boolean;
}): JSX.Element {
    const location = useLocation();
    const conference = useConference();
    const presenceCount = useGetPresenceCountOfQuery({
        variables: {
            conferenceId: conference.id,
            path: location.pathname,
        },
        pollInterval: 30000,
        fetchPolicy: "network-only",
    });
    const { refetch: getPresenceCountOfQ } = useGetPresenceCountOfQuery({
        skip: true,
        fetchPolicy: "network-only",
    });
    const previousErrorPath = useRef<string | null>(null);

    const pageCount = presenceCount.data?.presence_Page[0]?.count;

    const getPageCountOf = useCallback(
        async (path: string) => {
            if (path === previousErrorPath.current) {
                return undefined;
            }

            try {
                previousErrorPath.current = null;
                const r = await getPresenceCountOfQ({
                    conferenceId: conference.id,
                    path,
                });
                return r.data?.presence_Page && r.data?.presence_Page.length > 0
                    ? r.data?.presence_Page[0].count
                    : undefined;
            } catch {
                previousErrorPath.current = path;
                return undefined;
            }
        },
        [conference.id, getPresenceCountOfQ]
    );

    return (
        <PresenceCountContext.Provider
            value={{
                pageCount,
                getPageCountOf,
            }}
        >
            {children}
        </PresenceCountContext.Provider>
    );
}
