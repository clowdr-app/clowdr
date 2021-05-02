import { FetchResult, gql } from "@apollo/client";
import { Heading, Spinner } from "@chakra-ui/react";
import assert from "assert";
import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    CreateDeleteGroupsMutation,
    Permissions_Permission_Enum,
    UpdateGroupMutation,
    useCreateDeleteGroupsMutation,
    useSelectAllGroupsQuery,
    useSelectAllRolesQuery,
    useUpdateGroupMutation,
} from "../../../generated/graphql";
import CRUDTable, {
    BooleanFieldFormat,
    CRUDTableProps,
    defaultSelectFilter,
    defaultStringFilter,
    FieldType,
    PrimaryField,
    SelectOption,
    UpdateResult,
} from "../../CRUDTable/CRUDTable";
import PageNotFound from "../../Errors/PageNotFound";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import isValidUUID from "../../Utils/isValidUUID";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";

gql`
    fragment ManageGroups_Group on permissions_Group {
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

    query SelectAllGroups($conferenceId: uuid!) {
        permissions_Group(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ManageGroups_Group
        }
    }

    mutation CreateDeleteGroups($deleteGroupIds: [uuid!] = [], $insertGroups: [permissions_Group_insert_input!]!) {
        delete_permissions_Group(where: { id: { _in: $deleteGroupIds } }) {
            returning {
                id
            }
        }
        insert_permissions_Group(objects: $insertGroups) {
            returning {
                id
                conferenceId
                name
                enabled
                includeUnauthenticated
                groupRoles {
                    id
                    groupId
                    roleId
                }
            }
        }
    }

    mutation UpdateGroup(
        $groupId: uuid!
        $groupName: String!
        $enabled: Boolean!
        $includeUnauthenticated: Boolean!
        $insertRoles: [permissions_GroupRole_insert_input!]!
        $deleteRoleIds: [uuid!] = []
    ) {
        update_permissions_Group(
            where: { id: { _eq: $groupId } }
            _set: { name: $groupName, enabled: $enabled, includeUnauthenticated: $includeUnauthenticated }
        ) {
            returning {
                id
                name
                groupRoles {
                    id
                    groupId
                    roleId
                }
                conferenceId
            }
        }
        insert_permissions_GroupRole(objects: $insertRoles) {
            returning {
                id
                groupId
                roleId
            }
        }
        delete_permissions_GroupRole(where: { roleId: { _in: $deleteRoleIds } }) {
            returning {
                id
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

const GroupsCRUDTable = (props: Readonly<CRUDTableProps<GroupDescriptor, "id">>) => CRUDTable(props);

export default function ManageConferenceGroupsPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage groups of ${conference.shortName}`);

    const { loading: loadingAllRoles, error: errorAllRoles, data: allRoles } = useSelectAllRolesQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorAllRoles, false);

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
    useQueryErrorToast(errorAllGroups, false);

    const [createDeleteGroupsMutation] = useCreateDeleteGroupsMutation();
    const [updateGroupMutation] = useUpdateGroupMutation();

    const [allGroupsMap, setAllGroupsMap] = useState<Map<string, GroupDescriptor>>();

    const parsedDBGroups = useMemo(() => {
        if (!allGroups || !allRoles) {
            return undefined;
        }

        const result = new Map<string, GroupDescriptor>();

        for (const group of allGroups.permissions_Group) {
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
            allRoles?.permissions_Role.map((role) => ({
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
                validate: (v) => v.length >= 3 || ["Name must be at least 3 characters"],
            },
            enabled: {
                heading: "Enabled",
                ariaLabel: "Enabled",
                description:
                    "Members do not have the group's permissions while the group is disabled. You can use this to manually schedule access to the conference on certain days.",
                isHidden: false,
                isEditable: true,
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
                description: "Include public users (i.e. those who are not logged in) as part of this group.",
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
                defaultValue: [],
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
                    convertFromUI: (opts) => {
                        opts ??= [];
                        return opts instanceof Array ? new Set(opts.map((x) => x.value)) : new Set([opts.value]);
                    },
                    filter: defaultSelectFilter,
                    options: () => roleOptions,
                },
            },
        };
        return result;
    }, [allRoles?.permissions_Role]);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[
                Permissions_Permission_Enum.ConferenceManageRoles,
                Permissions_Permission_Enum.ConferenceManageGroups,
            ]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Groups
            </Heading>
            {(loadingAllRoles && !allRoles) || (loadingAllGroups && !allGroupsMap) ? (
                <Spinner />
            ) : errorAllRoles || errorAllGroups ? (
                <>An error occurred loading in data - please see further information in notifications.</>
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
                                const newData = new Map(oldData ? oldData.entries() : []);
                                newData.set(tempKey, newItem);
                                return newData;
                            });
                            return true;
                        },
                        update: (items) => {
                            const results: Map<string, UpdateResult> = new Map();
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
                                const newData = new Map(oldData ? oldData.entries() : []);
                                keys.forEach((key) => {
                                    newData.delete(key);
                                });
                                return newData;
                            });

                            return results;
                        },
                        save: async (keys) => {
                            assert(allGroupsMap);
                            assert(allRoles);

                            const newKeys = new Set<string>();
                            const updatedKeys = new Map<
                                string,
                                {
                                    added: Set<string>;
                                    deleted: Set<string>;
                                }
                            >();
                            const deletedKeys = new Set<string>();

                            const results: Map<string, boolean> = new Map();

                            keys.forEach((key) => {
                                results.set(key, false);
                            });

                            keys.forEach((key) => {
                                const item = allGroupsMap.get(key);
                                if (!item) {
                                    deletedKeys.add(key);
                                } else {
                                    if (item.isNew) {
                                        newKeys.add(key);
                                    } else {
                                        const existing = parsedDBGroups?.get(key);
                                        if (!existing) {
                                            console.error("Not-new value was not found in the existing DB dataset.");
                                            results.set(key, false);
                                            return;
                                        }

                                        let changed =
                                            item.name !== existing.name ||
                                            item.enabled !== existing.enabled ||
                                            item.includeUnauthenticated !== existing.includeUnauthenticated;
                                        const roleIdsAdded = new Set<string>();
                                        const roleIdsDeleted = new Set<string>();
                                        for (const role of allRoles.permissions_Role) {
                                            if (item.roleIds.has(role.id) && !existing.roleIds.has(role.id)) {
                                                changed = true;
                                                roleIdsAdded.add(role.id);
                                            } else if (!item.roleIds.has(role.id) && existing.roleIds.has(role.id)) {
                                                changed = true;
                                                roleIdsDeleted.add(role.id);
                                            }
                                        }
                                        if (changed) {
                                            updatedKeys.set(key, {
                                                added: roleIdsAdded,
                                                deleted: roleIdsDeleted,
                                            });
                                        }
                                    }
                                }
                            });

                            let createDeleteGroupsResult: FetchResult<
                                CreateDeleteGroupsMutation,
                                Record<string, any>,
                                Record<string, any>
                            >;
                            try {
                                createDeleteGroupsResult = await createDeleteGroupsMutation({
                                    variables: {
                                        deleteGroupIds: Array.from(deletedKeys.values()),
                                        insertGroups: Array.from(newKeys.values()).map((key) => {
                                            const item = allGroupsMap.get(key);
                                            assert(item);
                                            return {
                                                conferenceId: conference.id,
                                                name: item.name,
                                                enabled: item.enabled,
                                                includeUnauthenticated: item.includeUnauthenticated,
                                                groupRoles: {
                                                    data: Array.from(item.roleIds.values()).map((roleId) => ({
                                                        roleId,
                                                    })),
                                                },
                                            };
                                        }),
                                    },
                                });
                            } catch (e) {
                                createDeleteGroupsResult = {
                                    errors: [e],
                                };
                            }
                            if (createDeleteGroupsResult.errors) {
                                newKeys.forEach((key) => {
                                    results.set(key, false);
                                });
                                deletedKeys.forEach((key) => {
                                    results.set(key, false);
                                });
                            } else {
                                newKeys.forEach((key) => {
                                    results.set(key, true);
                                });
                                deletedKeys.forEach((key) => {
                                    results.set(key, true);
                                });
                            }

                            let updatedResults: {
                                key: string;
                                result: FetchResult<UpdateGroupMutation, Record<string, any>, Record<string, any>>;
                            }[];
                            try {
                                updatedResults = await Promise.all(
                                    Array.from(updatedKeys.entries()).map(async ([key, { added, deleted }]) => {
                                        const item = allGroupsMap.get(key);
                                        assert(item);
                                        let result: FetchResult<
                                            UpdateGroupMutation,
                                            Record<string, any>,
                                            Record<string, any>
                                        >;
                                        try {
                                            result = await updateGroupMutation({
                                                variables: {
                                                    groupId: item.id,
                                                    groupName: item.name,
                                                    enabled: item.enabled,
                                                    includeUnauthenticated: item.includeUnauthenticated,
                                                    deleteRoleIds: Array.from(deleted.values()),
                                                    insertRoles: Array.from(added.values()).map((roleId) => {
                                                        return {
                                                            groupId: item.id,
                                                            roleId,
                                                        };
                                                    }),
                                                },
                                            });
                                        } catch (e) {
                                            result = {
                                                errors: [e],
                                            };
                                        }
                                        return {
                                            key,
                                            result,
                                        };
                                    })
                                );
                            } catch (e) {
                                updatedResults = [];
                                updatedKeys.forEach((_item, key) => {
                                    updatedResults.push({
                                        key,
                                        result: { errors: [e] },
                                    });
                                });
                            }

                            updatedResults.forEach((result) => {
                                if (result.result.errors) {
                                    results.set(result.key, false);
                                } else {
                                    results.set(result.key, true);
                                }
                            });

                            await refetchAllGroups();

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
                        getRowTitle: (v) => v.name,
                    },
                    otherFields: fields,
                }}
            />
        </RequireAtLeastOnePermissionWrapper>
    );
}
