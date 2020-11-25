import { gql } from "@apollo/client";
import React from "react";
import { useSelectCurrentUserQuery } from "../../generated/graphql";
import useQueryErrorToast from "../useQueryErrorToast";
import useUserId from "../useUserId";
import {
    CurrentUserContext,
    defaultCurrentUserContext,
} from "./useMaybeCurrentUser";

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

export default function CurrentUserProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const userId = useUserId();

    if (userId) {
        return (
            <CurrentUserProvider_IsAuthenticated userId={userId}>
                {children}
            </CurrentUserProvider_IsAuthenticated>
        );
    } else {
        return (
            <CurrentUserContext.Provider value={defaultCurrentUserContext}>
                {children}
            </CurrentUserContext.Provider>
        );
    }
}

function CurrentUserProvider_IsAuthenticated({
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

    // TODO: Split out fetch of onlineStatus and use polling (and provider separate refetch function)

    // TODO: Split out subscription to pinned chats, followed chats, unread indices

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
