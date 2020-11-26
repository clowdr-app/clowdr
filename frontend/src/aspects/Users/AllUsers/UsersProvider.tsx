import { gql } from "@apollo/client";
import { useAuth0 } from "@auth0/auth0-react";
import React from "react";
import { useSelectUsersQuery } from "../../../generated/graphql";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { UsersContext } from "./useUsers";

const _usersQueries = gql`
    query selectUsers {
        User {
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

export default function UsersProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const { isAuthenticated } = useAuth0();

    if (isAuthenticated) {
        return (
            <UsersProvider_IsAuthenticated>
                {children}
            </UsersProvider_IsAuthenticated>
        );
    } else {
        return (
            <UsersContext.Provider value={undefined}>
                {children}
            </UsersContext.Provider>
        );
    }
}

function UsersProvider_IsAuthenticated({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}) {
    const { loading, error, data } = useSelectUsersQuery({
        pollInterval: 60 * 1000,
    });
    useQueryErrorToast(error);

    const value = loading ? undefined : error ? false : data;

    return (
        <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
    );
}
