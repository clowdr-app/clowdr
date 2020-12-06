import { FetchResult, gql } from "@apollo/client";
import { Heading, Spinner } from "@chakra-ui/react";
import assert from "assert";
import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    CreateDeleteRolesMutation,
    Permission_Enum,
    UpdateRoleMutation,
    useCreateDeleteRolesMutation,
    useSelectAllPermissionsQuery,
    useSelectAllRolesQuery,
    useUpdateRoleMutation,
} from "../../../generated/graphql";
import CRUDTable, {
    BooleanFieldFormat,
    BooleanFieldSpec,
    CRUDTableProps,
    defaultStringFilter,
    FieldType,
    PrimaryField,
    UpdateResult,
} from "../../CRUDTable/CRDUTable";
import PageNotFound from "../../Errors/PageNotFound";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import isValidUUID from "../../Utils/isValidUUID";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

gql`
    query SelectAllPermissions {
        Permission {
            name
            description
        }
    }

    query SelectAllRoles($conferenceId: uuid!) {
        Role(where: { conferenceId: { _eq: $conferenceId } }) {
            conferenceId
            id
            name
            rolePermissions {
                id
                permissionName
                roleId
            }
        }
    }

    mutation CreateDeleteRoles(
        $deleteRoleIds: [uuid!] = []
        $insertRoles: [Role_insert_input!]!
    ) {
        delete_Role(where: { id: { _in: $deleteRoleIds } }) {
            returning {
                id
            }
        }
        insert_Role(objects: $insertRoles) {
            returning {
                id
                conferenceId
                name
                rolePermissions {
                    id
                    permissionName
                    roleId
                }
            }
        }
    }

    mutation UpdateRole(
        $roleId: uuid!
        $roleName: String!
        $insertPermissions: [RolePermission_insert_input!]!
        $deletePermissionNames: [Permission_enum!] = []
    ) {
        update_Role(
            where: { id: { _eq: $roleId } }
            _set: { name: $roleName }
        ) {
            returning {
                id
                name
                rolePermissions {
                    id
                    permissionName
                    roleId
                }
                conferenceId
            }
        }
        insert_RolePermission(objects: $insertPermissions) {
            returning {
                id
                permissionName
                roleId
            }
        }
        delete_RolePermission(
            where: { permissionName: { _in: $deletePermissionNames } }
        ) {
            returning {
                id
            }
        }
    }
`;

type RoleDescriptor = {
    isNew: boolean;
    id: string;
    name: string;
    permissions: { [K: string]: boolean };
};

const RolesCRUDTable = (
    props: Readonly<CRUDTableProps<RoleDescriptor, "id">>
) => CRUDTable(props);

export default function ManageConferenceRolesPage(): JSX.Element {
    const conference = useConference();

    useDashboardPrimaryMenuButtons();

    const {
        loading: loadingAllPermissions,
        error: errorAllPermissions,
        data: allPermissions,
    } = useSelectAllPermissionsQuery();
    useQueryErrorToast(errorAllPermissions);

    const {
        loading: loadingAllRoles,
        error: errorAllRoles,
        data: allRoles,
        refetch: refetchAllRoles,
    } = useSelectAllRolesQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorAllRoles);

    const [createDeleteRolesMutation] = useCreateDeleteRolesMutation();
    const [updateRoleMutation] = useUpdateRoleMutation();

    const [allRolesMap, setAllRolesMap] = useState<
        Map<string, RoleDescriptor>
    >();

    const parsedDBRoles = useMemo(() => {
        if (!allRoles || !allPermissions) {
            return undefined;
        }

        const result = new Map<string, RoleDescriptor>();

        for (const role of allRoles.Role) {
            const permissions: { [K: string]: boolean } = {};
            for (const key in Permission_Enum) {
                const value = (Permission_Enum as any)[key] as string;
                permissions[key] = role.rolePermissions.some(
                    (x) => x.permissionName === value
                );
            }
            result.set(role.id, {
                isNew: false,
                id: role.id,
                name: role.name,
                permissions,
            });
        }

        return result;
    }, [allPermissions, allRoles]);

    useEffect(() => {
        if (parsedDBRoles) {
            setAllRolesMap(parsedDBRoles);
        }
    }, [parsedDBRoles]);

    const permissionFieldSpec: BooleanFieldSpec<boolean> = useMemo(
        () => ({
            fieldType: FieldType.boolean,
            convertFromUI: (x) => x,
            convertToUI: (x: boolean) => x,
            format: BooleanFieldFormat.checkbox,
        }),
        []
    );

    const fields = useMemo(() => {
        const result: {
            [K: string]: Readonly<PrimaryField<RoleDescriptor, any>>;
        } = {
            name: {
                heading: "Name",
                ariaLabel: "Name",
                description: "Role name",
                isHidden: false,
                isEditable: true,
                defaultValue: "New role name",
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
        };
        for (const permissionEnumKey in Permission_Enum) {
            const permissionEnumValue = (Permission_Enum as any)[
                permissionEnumKey
            ] as string;
            const name = permissionEnumValue
                .split("_")
                .reduce(
                    (acc, part) =>
                        `${acc} ${part[0].toUpperCase()}${part
                            .toLowerCase()
                            .substr(1)}`,
                    ""
                )
                .substr(1)
                .replace("Conference ", "");

            result[permissionEnumKey] = {
                heading: `${name}?`,
                ariaLabel: `${name} Permission`,
                description:
                    allPermissions?.Permission.find(
                        (x) => x.name === permissionEnumValue
                    )?.description ?? "No description provided.",
                isHidden: false,
                defaultValue:
                    permissionEnumValue === Permission_Enum.ConferenceView ||
                    permissionEnumValue ===
                        Permission_Enum.ConferenceViewAttendees,
                editorFalseLabel: "Deny",
                editorTrueLabel: "Allow",
                isEditable: true,
                insert: (item, v) => {
                    return {
                        ...item,
                        permissions: {
                            ...item.permissions,
                            [permissionEnumKey]: v,
                        },
                    };
                },
                extract: (v) => v.permissions[permissionEnumKey],
                spec: permissionFieldSpec,
            };
        }
        return result;
    }, [allPermissions?.Permission, permissionFieldSpec]);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageRoles]}
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
                Roles
            </Heading>
            {loadingAllRoles || loadingAllPermissions || !allRolesMap ? (
                <Spinner />
            ) : errorAllPermissions || errorAllRoles ? (
                <>
                    An error occurred loading in data - please see further
                    information in notifications.
                </>
            ) : (
                <></>
            )}
            <RolesCRUDTable
                key="crud-table"
                data={allRolesMap ?? new Map()}
                csud={{
                    cudCallbacks: {
                        generateTemporaryKey: () => uuidv4(),
                        create: (tempKey, item) => {
                            const newItem = {
                                ...item,
                                isNew: true,
                                id: tempKey,
                            } as RoleDescriptor;
                            setAllRolesMap((oldData) => {
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

                            setAllRolesMap((oldData) => {
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

                            setAllRolesMap((oldData) => {
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
                            assert(allRolesMap);

                            const newKeys = new Set<string>();
                            const updatedKeys = new Map<
                                string,
                                {
                                    added: Set<Permission_Enum>;
                                    deleted: Set<Permission_Enum>;
                                }
                            >();
                            const deletedKeys = new Set<string>();

                            const results: Map<string, boolean> = new Map();

                            keys.forEach((key) => {
                                const item = allRolesMap.get(key);
                                if (!item) {
                                    deletedKeys.add(key);
                                } else {
                                    if (item.isNew) {
                                        newKeys.add(key);
                                    } else {
                                        const existing = parsedDBRoles?.get(
                                            key
                                        );
                                        if (!existing) {
                                            console.error(
                                                "Not-new value was not found in the existing DB dataset."
                                            );
                                            results.set(key, false);
                                            return;
                                        }

                                        let changed =
                                            item.name !== existing.name;
                                        const permissionsAdded = new Set<
                                            Permission_Enum
                                        >();
                                        const permissionsDeleted = new Set<
                                            Permission_Enum
                                        >();
                                        for (const permissionEnumKey in Permission_Enum) {
                                            const permissionEnumValue = (Permission_Enum as any)[
                                                permissionEnumKey
                                            ] as Permission_Enum;
                                            if (
                                                item.permissions[
                                                    permissionEnumKey
                                                ] &&
                                                !existing.permissions[
                                                    permissionEnumKey
                                                ]
                                            ) {
                                                changed = true;
                                                permissionsAdded.add(
                                                    permissionEnumValue
                                                );
                                            } else if (
                                                !item.permissions[
                                                    permissionEnumKey
                                                ] &&
                                                existing.permissions[
                                                    permissionEnumKey
                                                ]
                                            ) {
                                                changed = true;
                                                permissionsDeleted.add(
                                                    permissionEnumValue
                                                );
                                            }
                                        }
                                        if (changed) {
                                            updatedKeys.set(key, {
                                                added: permissionsAdded,
                                                deleted: permissionsDeleted,
                                            });
                                        }
                                    }
                                }
                            });

                            let createDeleteRolesResult: FetchResult<
                                CreateDeleteRolesMutation,
                                Record<string, any>,
                                Record<string, any>
                            >;
                            try {
                                createDeleteRolesResult = await createDeleteRolesMutation(
                                    {
                                        variables: {
                                            deleteRoleIds: Array.from(
                                                deletedKeys.values()
                                            ),
                                            insertRoles: Array.from(
                                                newKeys.values()
                                            ).map((key) => {
                                                const item = allRolesMap.get(
                                                    key
                                                );
                                                assert(item);
                                                const permissionEnumKeys = Object.keys(
                                                    item.permissions
                                                ).filter(
                                                    (key) =>
                                                        item.permissions[key]
                                                );
                                                return {
                                                    conferenceId: conference.id,
                                                    name: item.name,
                                                    rolePermissions: {
                                                        data: permissionEnumKeys.map(
                                                            (
                                                                permissionEnumKey
                                                            ) => {
                                                                return {
                                                                    permissionName: (Permission_Enum as any)[
                                                                        permissionEnumKey
                                                                    ],
                                                                };
                                                            }
                                                        ),
                                                    },
                                                };
                                            }),
                                        },
                                    }
                                );
                            } catch (e) {
                                createDeleteRolesResult = {
                                    errors: [e],
                                };
                            }
                            if (createDeleteRolesResult.errors) {
                                // TODO: Set new/deleted results to "error"
                            } else {
                                // TODO: Set new/deleted results to "success"
                            }
                            console.log(
                                "Created/deleted",
                                createDeleteRolesResult
                            );

                            let updatedResults: FetchResult<
                                UpdateRoleMutation,
                                Record<string, any>,
                                Record<string, any>
                            >[];
                            try {
                                updatedResults = await Promise.all(
                                    Array.from(updatedKeys.entries()).map(
                                        async ([key, { added, deleted }]) => {
                                            const item = allRolesMap.get(key);
                                            assert(item);
                                            return updateRoleMutation({
                                                variables: {
                                                    roleId: item.id,
                                                    roleName: item.name,
                                                    deletePermissionNames: Array.from(
                                                        deleted.values()
                                                    ),
                                                    insertPermissions: Array.from(
                                                        added.values()
                                                    ).map(
                                                        (
                                                            permissionEnumValue
                                                        ) => {
                                                            return {
                                                                roleId: item.id,
                                                                permissionName: permissionEnumValue,
                                                            };
                                                        }
                                                    ),
                                                },
                                            });
                                        }
                                    )
                                );
                            } catch (e) {
                                updatedResults = [
                                    {
                                        errors: [e],
                                    },
                                ];
                            }
                            console.log("Updated", updatedResults);

                            // TODO: Set updated results to error/succcess
                            // keys.forEach((key) => {
                            //     results.set(key, false);
                            // });

                            await refetchAllRoles();

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
