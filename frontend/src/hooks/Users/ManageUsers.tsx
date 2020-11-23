import { gql } from "@apollo/client";
import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect } from "react";
import { useSelectUsersQuery } from "../../generated/graphql";
import useQueryErrorToast from "../useQueryErrorToast";
import { UsersContext } from "./useUsers";

const _usersQueries = gql`
    query selectUsers {
        user {
            id
            lastName
            firstName
            onlineStatus {
                id
                lastSeen
                isIncognito
            }
        }
    }
`;

export default function ManageUsers({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const { isAuthenticated } = useAuth0();

    if (isAuthenticated) {
        return (
            <ManagerUsers_IsAuthenticated>
                {children}
            </ManagerUsers_IsAuthenticated>
        );
    } else {
        return (
            <UsersContext.Provider value={undefined}>
                {children}
            </UsersContext.Provider>
        );
    }
}

function ManagerUsers_IsAuthenticated({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}) {
    const { loading, error, data, refetch } = useSelectUsersQuery();
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
        <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
    );
}
