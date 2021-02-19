import { gql } from "@apollo/client";
import React, { useMemo } from "react";
import { useSelectCurrentUserQuery } from "../../../generated/graphql";
import useUserId from "../../Auth/useUserId";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { CurrentUserContext, defaultCurrentUserContext, UserInfo } from "./useMaybeCurrentUser";

gql`
    fragment AttendeeFields on Attendee {
        id
        userId
        conferenceId
        displayName
        createdAt
        updatedAt
        profile {
            attendeeId
            photoURL_50x50
        }
        conference {
            id
            name
            shortName
            slug
        }
        groupAttendees {
            id
            group {
                id
                enabled
                name
                groupRoles {
                    id
                    role {
                        id
                        name
                        rolePermissions {
                            id
                            permissionName
                        }
                    }
                }
            }
        }
    }

    query SelectCurrentUser($userId: String!) {
        User_by_pk(id: $userId) {
            id
            email
            lastName
            firstName
            attendees {
                ...AttendeeFields
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
        return <CurrentUserProvider_IsAuthenticated userId={userId}>{children}</CurrentUserProvider_IsAuthenticated>;
    } else {
        return <CurrentUserProvider_NotAuthenticated>{children}</CurrentUserProvider_NotAuthenticated>;
    }
}

function CurrentUserProvider_NotAuthenticated({ children }: { children: string | JSX.Element | Array<JSX.Element> }) {
    const ctx = useMemo(
        () => ({
            ...defaultCurrentUserContext,
            loading: false,
        }),
        []
    );
    return <CurrentUserContext.Provider value={ctx}>{children}</CurrentUserContext.Provider>;
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
        nextFetchPolicy: "cache-first",
    });
    useQueryErrorToast(error, false, "useSelectCurrentUserQuery");

    const value = loading ? undefined : error ? false : data;
    const ctx: UserInfo = useMemo(
        () => ({
            loading,
            user: value ? value?.User_by_pk ?? false : value,
            refetchUser: refetch,
        }),
        [loading, refetch, value]
    );

    return <CurrentUserContext.Provider value={ctx}>{children}</CurrentUserContext.Provider>;
}
