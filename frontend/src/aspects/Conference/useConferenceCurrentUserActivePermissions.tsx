import React, { useContext, useMemo } from "react";
import { Permission_Enum } from "../../generated/graphql";
import { useCurrentUserGroupsRolesPermissions } from "./useConferenceCurrentUserGroups";

function reduceToSet<S, T>(array: ReadonlyArray<S>, reduce: (acc: Set<T>, i: S) => Set<T>, start?: Set<T>) {
    return array.reduce(reduce, new Set(start?.values() ?? []));
}

const ConferenceCurrentUserActivePermissionsContext = React.createContext<Set<Permission_Enum>>(new Set());

export function useConferenceCurrentUserActivePermissions(): Set<Permission_Enum> {
    return useContext(ConferenceCurrentUserActivePermissionsContext);
}

export default function ConferenceCurrentUserActivePermissionsProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const groups = useCurrentUserGroupsRolesPermissions();

    const value: Set<Permission_Enum> = useMemo(() => {
        if (groups.User[0].conferencesCreated.length > 0) {
            return new Set(Object.values(Permission_Enum));
        } else {
            const publicPermissions: Set<Permission_Enum> = reduceToSet(groups.publicGroups, (acc, group) => {
                return reduceToSet(
                    group.groupRoles,
                    (acc, groupRole) => {
                        return reduceToSet(
                            groupRole.role.rolePermissions,
                            (acc, rolePermission) => {
                                acc.add(rolePermission.permissionName);
                                return acc;
                            },
                            acc
                        );
                    },
                    acc
                );
            });
            if (groups.User.length > 0) {
                return reduceToSet(
                    groups.User[0].attendees,
                    (acc, attendee) => {
                        return reduceToSet(
                            attendee.groupAttendees,
                            (acc, groupAttendee) => {
                                if (groupAttendee.group.enabled) {
                                    return reduceToSet(
                                        groupAttendee.group.groupRoles,
                                        (acc, groupRole) => {
                                            return reduceToSet(
                                                groupRole.role.rolePermissions,
                                                (acc, rolePermission) => {
                                                    acc.add(rolePermission.permissionName);
                                                    return acc;
                                                },
                                                acc
                                            );
                                        },
                                        acc
                                    );
                                }
                                return acc;
                            },
                            acc
                        );
                    },
                    publicPermissions
                );
            } else {
                return publicPermissions;
            }
        }
    }, [groups.User, groups.publicGroups]);

    return (
        <ConferenceCurrentUserActivePermissionsContext.Provider value={value}>
            {children}
        </ConferenceCurrentUserActivePermissionsContext.Provider>
    );
}
