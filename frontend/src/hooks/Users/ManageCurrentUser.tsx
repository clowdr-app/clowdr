import { gql } from "@apollo/client";
import React, { useEffect } from "react";
import { useSelectCurrentUserQuery } from "../../generated/graphql";
import useQueryErrorToast from "../useQueryErrorToast";
import useUserId from "../useUserId";
import {
    CurrentUserContext,
    defaultCurrentUserContext,
} from "./useCurrentUser";

const _currentuserQueries = gql`
    query selectCurrentUser($userId: String!) {
        user(where: { id: { _eq: $userId } }) {
            id
            lastName
            firstName
            onlineStatus {
                id
                lastSeen
                isIncognito
            }
            pinnedChats {
                id
                chatId
            }
            followedChats {
                id
                chatId
            }
            unreadIndices {
                id
                chatId
                index
            }
        }
    }
`;

export default function ManageCurrentUser({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const userId = useUserId();

    if (userId) {
        return (
            <ManagerCurrentUser_IsAuthenticated userId={userId}>
                {children}
            </ManagerCurrentUser_IsAuthenticated>
        );
    } else {
        return (
            <CurrentUserContext.Provider value={defaultCurrentUserContext}>
                {children}
            </CurrentUserContext.Provider>
        );
    }
}

function ManagerCurrentUser_IsAuthenticated({
    children,
    userId,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
    userId: string;
}) {
    const { loading, error, data, refetch } = useSelectCurrentUserQuery({
        variables: {
            userId,
        },
    });
    useQueryErrorToast(error);

    useEffect(() => {
        const intervalId = setInterval(() => {
            refetch();
        }, 1000 * 60);
        return () => {
            clearInterval(intervalId);
        };
    }, [refetch]);

    const value = loading ? undefined : error ? false : data;

    return (
        <CurrentUserContext.Provider
            value={{
                user: value,
                refetchUser: refetch,
            }}
        >
            {children}
        </CurrentUserContext.Provider>
    );
}
