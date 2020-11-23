import { gql } from "@apollo/client";
import React, { useEffect } from "react";
import {
    useGetCurrentUserLastSeenQuery,
    useInsertCurrentUserOnlineStatusMutation,
    useUpdateCurrentUserLastSeenMutation,
} from "../../generated/graphql";
import useQueryErrorToast from "../../hooks/useQueryErrorToast";
import useUserId from "../../hooks/useUserId";
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

export default function ManageLastSeen({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const userId = useUserId();
    if (userId) {
        return (
            <ManageLastSeen_UserIdExists userId={userId}>
                {children}
            </ManageLastSeen_UserIdExists>
        );
    }
    return (
        <LastSeenContext.Provider value={undefined}>
            {children}
        </LastSeenContext.Provider>
    );
}

function ManageLastSeen_UserIdExists({
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

    useEffect(() => {
        function doUpdate() {
            updateCurrentUserLastSeenMutation({
                variables: {
                    userId,
                    lastSeen: new Date().toUTCString(),
                },
            });
        }

        const intervalId = setInterval(doUpdate, 1000 * 60);
        doUpdate();

        return () => {
            clearInterval(intervalId);
        };
    }, [updateCurrentUserLastSeenMutation, userId]);

    const value = lastSeen && (loading ? undefined : new Date(lastSeen));
    return (
        <LastSeenContext.Provider value={value}>
            {children}
        </LastSeenContext.Provider>
    );
}
