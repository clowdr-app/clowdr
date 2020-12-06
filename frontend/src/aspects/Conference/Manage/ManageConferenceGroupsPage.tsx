import { gql } from "@apollo/client";
import { Heading, Spinner } from "@chakra-ui/react";
import assert from "assert";
import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    Permission_Enum,
    useSelectAllGroupsQuery,
    useSelectAllRolesQuery,
} from "../../../generated/graphql";
import CRUDTable, {
    BooleanFieldFormat,
    CRUDTableProps,
    defaultStringFilter,
    FieldType,
    PrimaryField,
    SelectOption,
    UpdateResult,
} from "../../CRUDTable/CRDUTable";
import PageNotFound from "../../Errors/PageNotFound";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import isValidUUID from "../../Utils/isValidUUID";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

gql`
    query SelectAllGroups($conferenceId: uuid!) {
        Group(where: { conferenceId: { _eq: $conferenceId } }) {
            conferenceId
            enabled
            id
            includeUnauthenticated
            name
            groupRoles {
                id
                roleId
                groupId
            }
        }
    }
`;

type RoleOption = SelectOption;

type GroupDescriptor = {
    isNew: boolean;
    id: string;
    name: string;
    enabled: boolean;
    includeUnauthenticated: boolean;
    roleIds: Set<string>;
};

const GroupsCRUDTable = (
    props: Readonly<CRUDTableProps<GroupDescriptor, "id">>
) => CRUDTable(props);

export default function ManageConferenceGroupsPage(): JSX.Element {
    const conference = useConference();

    useDashboardPrimaryMenuButtons();

    const {
        loading: loadingAllRoles,
        error: errorAllRoles,
        data: allRoles,
    } = useSelectAllRolesQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorAllRoles);

    const {
        loading: loadingAllGroups,
        error: errorAllGroups,
        data: allGroups,
        refetch: refetchAllGroups,
    } = useSelectAllGroupsQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorAllGroups);

    const [allGroupsMap, setAllGroupsMap] = useState<
        Map<string, GroupDescriptor>
    >();

    const parsedDBGroups = useMemo(() => {
        if (!allGroups || !allRoles) {
            return undefined;
        }

        const result = new Map<string, GroupDescriptor>();

        for (const group of allGroups.Group) {
            const roleIds: Set<string> = new Set();
            for (const groupRole of group.groupRoles) {
                roleIds.add(groupRole.roleId);
            }
            result.set(group.id, {
                isNew: false,
                id: group.id,
                name: group.name,
                enabled: group.enabled,
                includeUnauthenticated: group.includeUnauthenticated,
                roleIds,
            });
        }

        return result;
    }, [allGroups, allRoles]);

    useEffect(() => {
        if (parsedDBGroups) {
            setAllGroupsMap(parsedDBGroups);
        }
    }, [parsedDBGroups]);

    const fields = useMemo(() => {
        const roleOptions: RoleOption[] =
            allRoles?.Role.map((role) => ({
                value: role.id,
                label: role.name,
            })) ?? [];
        const result: {
            [K: string]: Readonly<PrimaryField<GroupDescriptor, any>>;
        } = {
            name: {
                heading: "Name",
                ariaLabel: "Name",
                description: "Group name",
                isHidden: false,
                isEditable: true,
                defaultValue: "New group name",
                insert: (item, v) => {
                    return {
                        ...item,
                        name: v,
                    };
                },
                extract: (v) => v.name,
                spec: {
                    fieldType: FieldType.string,
                    convertFromUI: (x) => x,
                    convertToUI: (x) => x,
                    filter: defaultStringFilter,
                },
                validate: (v) =>
                    v.length >= 3 || ["Name must be at least 3 characters"],
            },
            enabled: {
                heading: "Enabled",
                ariaLabel: "Enabled",
                description:
                    "Members do not have the group's permissions while the group is disabled. You can use this to manually schedule access to the conference on certain days.",
                isHidden: false,
                isEditable: true,
                isMultiEditable: true,
                defaultValue: true,
                insert: (item, v) => {
                    return {
                        ...item,
                        enabled: v,
                    };
                },
                extract: (v) => v.enabled,
                spec: {
                    fieldType: FieldType.boolean,
                    convertFromUI: (x) => x,
                    convertToUI: (x: boolean) => x,
                    format: BooleanFieldFormat.switch,
                },
            },
            includeUnauthenticated: {
                heading: "Include public?",
                ariaLabel: "Include public users",
                description:
                    "Include public users (i.e. those who are not logged in) as part of this group.",
                isHidden: false,
                isEditable: true,
                defaultValue: false,
                insert: (item, v) => {
                    return {
                        ...item,
                        includeUnauthenticated: v,
                    };
                },
                extract: (v) => v.includeUnauthenticated,
                spec: {
                    fieldType: FieldType.boolean,
                    convertFromUI: (x) => x,
                    convertToUI: (x: boolean) => x,
                    format: BooleanFieldFormat.switch,
                },
            },
            roles: {
                heading: "Roles",
                ariaLabel: "Roles",
                description: "The roles for members of this group.",
                isHidden: false,
                isEditable: true,
                defaultValue: new Set(),
                insert: (item, v) => {
                    return {
                        ...item,
                        roleIds: v,
                    };
                },
                extract: (item) => item.roleIds,
                spec: {
                    fieldType: FieldType.select,
                    multiSelect: true,
                    convertToUI: (ids) =>
                        Array.from(ids.values()).map((id) => {
                            const opt = roleOptions.find((x) => x.value === id);
                            assert(opt);
                            return opt;
                        }),
                    convertFromUI: (opts) =>
                        opts instanceof Array
                            ? new Set(opts.map((x) => x.value))
                            : new Set([opts.value]),
                    options: () => roleOptions,
                },
            },
        };
        return result;
    }, [allRoles?.Role]);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[
                Permission_Enum.ConferenceManageRoles,
                Permission_Enum.ConferenceManageGroups,
            ]}
            componentIfDenied={<PageNotFound />}
        >
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading
                as="h2"
                fontSize="1.7rem"
                lineHeight="2.4rem"
                fontStyle="italic"
            >
                Groups
            </Heading>
            {loadingAllGroups || loadingAllRoles || !allGroupsMap ? (
                <Spinner />
            ) : errorAllRoles || errorAllGroups ? (
                <>
                    An error occurred loading in data - please see further
                    information in notifications.
                </>
            ) : (
                <></>
            )}
            <GroupsCRUDTable
                key="crud-table"
                data={allGroupsMap ?? new Map()}
                csud={{
                    cudCallbacks: {
                        generateTemporaryKey: () => uuidv4(),
                        create: (tempKey, item) => {
                            const newItem = {
                                ...item,
                                isNew: true,
                                id: tempKey,
                            } as GroupDescriptor;
                            setAllGroupsMap((oldData) => {
                                const newData = new Map(
                                    oldData ? oldData.entries() : []
                                );
                                newData.set(tempKey, newItem);
                                return newData;
                            });
                            return true;
                        },
                        update: (items) => {
                            const results: Map<
                                string,
                                UpdateResult
                            > = new Map();
                            items.forEach((item, key) => {
                                results.set(key, true);
                            });

                            setAllGroupsMap((oldData) => {
                                if (oldData) {
                                    const newData = new Map(oldData.entries());
                                    items.forEach((item, key) => {
                                        newData.set(key, item);
                                    });
                                    return newData;
                                }
                                return undefined;
                            });

                            return results;
                        },
                        delete: (keys) => {
                            const results: Map<string, boolean> = new Map();
                            keys.forEach((key) => {
                                results.set(key, true);
                            });

                            setAllGroupsMap((oldData) => {
                                const newData = new Map(
                                    oldData ? oldData.entries() : []
                                );
                                keys.forEach((key) => {
                                    newData.delete(key);
                                });
                                return newData;
                            });

                            return results;
                        },
                        save: async (keys) => {
                            assert(allGroupsMap);

                            const results: Map<string, boolean> = new Map();

                            keys.forEach((key) => {
                                results.set(key, false);
                            });

                            return results;
                        },
                    },
                }}
                primaryFields={{
                    keyField: {
                        heading: "Id",
                        ariaLabel: "Unique identifier",
                        description: "Unique identifier",
                        isHidden: true,
                        insert: (item, v) => {
                            return {
                                ...item,
                                id: v,
                            };
                        },
                        extract: (v) => v.id,
                        spec: {
                            fieldType: FieldType.string,
                            convertToUI: (x) => x,
                            disallowSpaces: true,
                        },
                        validate: (v) => isValidUUID(v) || ["Invalid UUID"],
                    },
                    otherFields: fields,
                }}
            />
        </RequireAtLeastOnePermissionWrapper>
    );
}
