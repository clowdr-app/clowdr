import React, { useContext, useMemo } from "react";
import { Permission_Enum } from "../../generated/graphql";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import { useConference } from "./useConference";

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
    const user = useMaybeCurrentUser();
    const conference = useConference();

    const value: Set<Permission_Enum> = useMemo(() => {
        const publicPermissions: Set<Permission_Enum> = reduceToSet(conference.publicGroups, (acc, group) => {
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

        if (user.user) {
            if (conference.createdBy === user.user.id) {
                return new Set(Object.values(Permission_Enum));
            } else {
                if ("attendees" in conference && conference.attendees.length > 0) {
                    return reduceToSet(
                        conference.attendees[0].groupAttendees,
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
                        publicPermissions
                    );
                }
            }
        }

        return publicPermissions;
    }, [conference, user.user]);

    return (
        <ConferenceCurrentUserActivePermissionsContext.Provider value={value}>
            {children}
        </ConferenceCurrentUserActivePermissionsContext.Provider>
    );
}
