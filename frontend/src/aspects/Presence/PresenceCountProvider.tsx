import { gql } from "@apollo/client";
import React, { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useGetPresenceCountOfQuery, usePresenceCountSubscription } from "../../generated/graphql";
import { useConference } from "../Conference/useConference";

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
        presence_Page_by_pk(path: $path, conferenceId: $conferenceId) {
            path
            conferenceId
            count
        }
    }
`;

export default function PresenceCountProvider({
    children,
    disableSubscription,
}: {
    children: React.ReactNode | React.ReactNodeArray;
    disableSubscription?: boolean;
}): JSX.Element {
    const location = useLocation();
    const conference = useConference();
    const presenceCount = usePresenceCountSubscription({
        skip: disableSubscription,
        variables: {
            conferenceId: conference.id,
            path: location.pathname,
        },
    });
    const { refetch: getPresenceCountOfQ } = useGetPresenceCountOfQuery({
        skip: true,
    });

    const pageCount = presenceCount.data?.presence_Page_by_pk?.count;

    const getPageCountOf = useCallback(
        async (path: string) => {
            try {
                return (
                    await getPresenceCountOfQ({
                        conferenceId: conference.id,
                        path,
                    })
                ).data?.presence_Page_by_pk?.count;
            } catch {
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
