import { gql } from "@apollo/client";
import React, { useEffect } from "react";
import {
    useGetCurrentUserLastSeenQuery,
    useInsertCurrentUserOnlineStatusMutation,
    useUpdateCurrentUserLastSeenMutation,
} from "../../../../generated/graphql";
import useUserId from "../../../Auth/useUserId";
import usePolling from "../../../Generic/usePolling";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import { LastSeenContext } from "./useLastSeen";

const _currentUserLastSeenQueries = gql`
    query getCurrentUserLastSeen($userId: String!) {
        OnlineStatus(where: { userId: { _eq: $userId } }) {
            id
            lastSeen
        }
    }

    mutation insertCurrentUserOnlineStatus($userId: String!) {
        insert_OnlineStatus(objects: { userId: $userId, isIncognito: false }) {
            returning {
                id
                isIncognito
                lastSeen
                userId
            }
        }
    }

    mutation updateCurrentUserLastSeen(
        $userId: String!
        $lastSeen: timestamptz
    ) {
        update_OnlineStatus(
            _set: { lastSeen: $lastSeen }
            where: { userId: { _eq: $userId } }
        ) {
            returning {
                id
                lastSeen
            }
        }
    }
`;

export default function LastSeenProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const userId = useUserId();
    if (userId) {
        return (
            <LastSeenProvider_UserIdExists userId={userId}>
                {children}
            </LastSeenProvider_UserIdExists>
        );
    }
    return (
        <LastSeenContext.Provider value={undefined}>
            {children}
        </LastSeenContext.Provider>
    );
}

function LastSeenProvider_UserIdExists({
    userId,
    children,
}: {
    userId: string;
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const {
        loading: getLastSeenLoading,
        error: getLastSeenError,
        data: lastSeenData,
        refetch: refetchGetLastSeen,
    } = useGetCurrentUserLastSeenQuery({
        variables: { userId },
    });
    const lastSeen = lastSeenData?.OnlineStatus[0]?.lastSeen;

    const [
        insertCurrentUserLastSeenMutation,
        { loading: insertLastSeenLoading, error: insertLastSeenError },
    ] = useInsertCurrentUserOnlineStatusMutation({
        variables: {
            userId,
        },
    });

    const [
        updateCurrentUserLastSeenMutation,
        { loading: setLastSeenLoading, error: setLastSeenError },
    ] = useUpdateCurrentUserLastSeenMutation();

    const loading =
        getLastSeenLoading || setLastSeenLoading || insertLastSeenLoading;
    const error = getLastSeenError
        ? "Error loading last seen time! " + getLastSeenError
        : setLastSeenError
        ? "Error setting last seen time! " + setLastSeenError
        : insertLastSeenError
        ? "Error creating online status record! " + insertLastSeenError
        : false;

    useQueryErrorToast(error);

    useEffect(() => {
        if (!getLastSeenLoading && lastSeen === undefined) {
            insertCurrentUserLastSeenMutation().then(() =>
                refetchGetLastSeen()
            );
        }
    }, [
        insertCurrentUserLastSeenMutation,
        lastSeen,
        getLastSeenLoading,
        refetchGetLastSeen,
    ]);

    usePolling(() => {
        updateCurrentUserLastSeenMutation({
            variables: {
                userId,
                lastSeen: new Date().toUTCString(),
            },
        });
    }, 60 * 1000);

    const value = lastSeen && (loading ? undefined : new Date(lastSeen));
    return (
        <LastSeenContext.Provider value={value}>
            {children}
        </LastSeenContext.Provider>
    );
}
