import { gql } from "@apollo/client";
import { Box, Spinner } from "@chakra-ui/react";
import assert from "assert";
import React from "react";
import {
    CurrentUserGroupsRolesPermissionsQuery,
    PublicUserGroupsRolesPermissionsQuery,
    SelectCurrentUserQuery,
    useCurrentUserGroupsRolesPermissionsQuery,
    usePublicUserGroupsRolesPermissionsQuery,
} from "../../generated/graphql";
import PageNotFound from "../Errors/PageNotFound";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import { useConference } from "./useConference";

gql`
    fragment GroupData on Group {
        groupRoles {
            role {
                rolePermissions {
                    permissionName
                    id
                    roleId
                }
                id
                name
                conferenceId
            }
            id
            roleId
            groupId
        }
        enabled
        id
        includeUnauthenticated
        name
        conferenceId
    }

    query CurrentUserGroupsRolesPermissions($userId: String, $conferenceId: uuid!) {
        User_by_pk(where: { id: { _eq: $userId } }) {
            conferencesCreated(where: { id: { _eq: $conferenceId } }) {
                id
            }
            attendees(where: { conferenceId: { _eq: $conferenceId } }) {
                groupAttendees {
                    group {
                        ...GroupData
                    }
                    id
                    groupId
                    attendeeId
                }
                id
                userId
                conferenceId
                displayName
            }
            id
        }
        publicGroups: Group(
            where: {
                conferenceId: { _eq: $conferenceId }
                enabled: { _eq: true }
                includeUnauthenticated: { _eq: true }
            }
        ) {
            ...GroupData
        }
    }

    query PublicUserGroupsRolesPermissions($conferenceId: uuid!) {
        publicGroups: Group(
            where: {
                conferenceId: { _eq: $conferenceId }
                enabled: { _eq: true }
                includeUnauthenticated: { _eq: true }
            }
        ) {
            ...GroupData
        }
    }
`;

const CurrentUserGroupsRolesPermissionsContext = React.createContext<
    CurrentUserGroupsRolesPermissionsQuery | PublicUserGroupsRolesPermissionsQuery | undefined
>(undefined);

export function useCurrentUserGroupsRolesPermissions():
    | CurrentUserGroupsRolesPermissionsQuery
    | PublicUserGroupsRolesPermissionsQuery {
    const conf = React.useContext(CurrentUserGroupsRolesPermissionsContext);
    assert(conf);
    return conf;
}

function PublicUserGroupsRolesPermissionsProvider({
    children,
}: {
    children: string | JSX.Element | JSX.Element[];
}): JSX.Element {
    const conference = useConference();
    const { loading, error, data } = usePublicUserGroupsRolesPermissionsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    if (loading && !data) {
        return (
            <Box>
                <Spinner />
            </Box>
        );
    }

    if (error) {
        return <PageNotFound />;
    }

    if (!data || !data.publicGroups.length) {
        return <PageNotFound />;
    }

    return (
        <CurrentUserGroupsRolesPermissionsContext.Provider value={data}>
            {children}
        </CurrentUserGroupsRolesPermissionsContext.Provider>
    );
}

function AuthedUserGroupsRolesPermissionsProvider({
    children,
    user,
}: {
    children: string | JSX.Element | JSX.Element[];
    user: NonNullable<SelectCurrentUserQuery["User_by_pk"]>;
}): JSX.Element {
    const conference = useConference();
    const { loading, error, data } = useCurrentUserGroupsRolesPermissionsQuery({
        variables: {
            conferenceId: conference.id,
            userId: user.id,
        },
    });

    if (loading && !data) {
        return (
            <Box>
                <Spinner />
            </Box>
        );
    }

    if (error) {
        return <PageNotFound />;
    }

    if (
        !data ||
        data.User.length === 0 ||
        ((data.User[0].attendees.length === 0 ||
            data.User[0].attendees[0].groupAttendees.length === 0 ||
            data.User[0].attendees[0].groupAttendees[0].group.groupRoles.length === 0) &&
            data.User[0].conferencesCreated.length == 0 &&
            !data.publicGroups.length)
    ) {
        return <PageNotFound />;
    }

    return (
        <CurrentUserGroupsRolesPermissionsContext.Provider value={data}>
            {children}
        </CurrentUserGroupsRolesPermissionsContext.Provider>
    );
}

export default function CurrentUserGroupsRolesPermissionsProvider({
    children,
}: {
    children: string | JSX.Element | JSX.Element[];
}): JSX.Element {
    const { user } = useMaybeCurrentUser();
    return user ? (
        <AuthedUserGroupsRolesPermissionsProvider user={user}>{children}</AuthedUserGroupsRolesPermissionsProvider>
    ) : (
        <PublicUserGroupsRolesPermissionsProvider>{children}</PublicUserGroupsRolesPermissionsProvider>
    );
}
