import { Button, chakra, Code, Flex, FormLabel, Input, Select, useClipboard } from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import type { LegacyRef } from "react";
import React, { useMemo } from "react";
import { gql } from "urql";
import { v4 as uuidv4 } from "uuid";
import type { SysConfigPermissionGrantFragment } from "../../../generated/graphql";
import {
    System_ConfigurationKey_Enum,
    System_SuperUserPermission_Enum,
    useDeleteSysConfigPermissionGrantsMutation,
    useInsertSysConfigPermissionGrantMutation,
    useSelectSysConfigPermissionsQuery,
    useSuPermissionGrants_AllUsersQuery,
    useUserSuPermissionsQuery,
} from "../../../generated/graphql";
import FAIcon from "../../Chakra/FAIcon";
import { TextColumnFilter } from "../../CRUDTable2/CRUDComponents";
import type {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    Delete,
    Insert,
    RowSpecification,
} from "../../CRUDTable2/CRUDTable2";
import CRUDTable, { SortDirection } from "../../CRUDTable2/CRUDTable2";
import extractActualError from "../../GQL/ExtractActualError";
import { makeContext } from "../../GQL/make-context";
import useCurrentUser from "../../Users/CurrentUser/useCurrentUser";

gql`
    fragment SysConfigPermissionGrant on system_ConfigurationPermissionGrant {
        id
        created_at
        updated_at
        permissionName
        userId
        configurationKey
    }

    query SelectSysConfigPermissions {
        system_ConfigurationPermissionGrant {
            ...SysConfigPermissionGrant
        }
    }

    mutation InsertSysConfigPermissionGrant($object: system_ConfigurationPermissionGrant_insert_input!) {
        insert_system_ConfigurationPermissionGrant_one(object: $object) {
            ...SysConfigPermissionGrant
        }
    }

    mutation DeleteSysConfigPermissionGrants($ids: [uuid!]!) {
        delete_system_ConfigurationPermissionGrant(where: { id: { _in: $ids } }) {
            returning {
                id
            }
        }
    }
`;

export default function SysConfigPermissionGrants(): JSX.Element {
    const currentUser = useCurrentUser();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.Superuser,
            }),
        []
    );
    const [currentUserPermissionsResponse] = useUserSuPermissionsQuery({
        variables: {
            userId: currentUser.user.id,
        },
        context,
        requestPolicy: "network-only",
    });
    const [allUsersResponse] = useSuPermissionGrants_AllUsersQuery({
        context,
    });

    const insertablePermissionNames = useMemo(
        () =>
            currentUserPermissionsResponse.data?.system_SuperUserPermissionGrant
                .filter(
                    (x) =>
                        x.grantedPermissionName === System_SuperUserPermission_Enum.InsertSuPermission &&
                        x.targetPermissionName
                )
                .map((x) => x.targetPermissionName)
                .sort(),
        [currentUserPermissionsResponse.data?.system_SuperUserPermissionGrant]
    );
    const deletablePermissionNames = useMemo(
        () =>
            currentUserPermissionsResponse.data?.system_SuperUserPermissionGrant
                .filter(
                    (x) =>
                        x.grantedPermissionName === System_SuperUserPermission_Enum.DeleteSuPermission &&
                        x.targetPermissionName
                )
                .map((x) => x.targetPermissionName)
                .sort(),
        [currentUserPermissionsResponse.data?.system_SuperUserPermissionGrant]
    );

    const [allPermissionsResponse] = useSelectSysConfigPermissionsQuery({
        context,
        requestPolicy: "network-only",
    });

    const row: RowSpecification<SysConfigPermissionGrantFragment> = useMemo(
        () => ({
            getKey: (record) => record.id,
            canSelect: (record) => !!deletablePermissionNames?.includes(record.permissionName) || "",
            canDelete: (record) =>
                !!deletablePermissionNames?.includes(record.permissionName) ||
                "You do not have permission to delete this.",
            invalid: (record) => {
                if (!record.userId) {
                    return {
                        reason: "User not found",
                        columnId: "user-id",
                    };
                }

                if (!record.permissionName?.length) {
                    return {
                        reason: "Granted permission not chosen",
                        columnId: "granted-permission",
                    };
                }

                if (
                    record.permissionName === System_SuperUserPermission_Enum.DeleteSuPermission ||
                    record.permissionName === System_SuperUserPermission_Enum.InsertSuPermission ||
                    record.permissionName === System_SuperUserPermission_Enum.ViewSuPermissionGrant
                ) {
                    if (!record.configurationKey?.length) {
                        return {
                            reason: "Configuration key not chosen",
                            columnId: "target-permission",
                        };
                    }
                } else {
                    if (record.configurationKey?.length) {
                        return {
                            reason: "A configuration key has been chosen but should be NULL",
                            columnId: "target-permission",
                        };
                    }
                }

                return false;
            },
            pages: {
                defaultToLast: false,
            },
        }),
        [deletablePermissionNames]
    );

    const columns: ColumnSpecification<SysConfigPermissionGrantFragment>[] = useMemo(
        () => [
            {
                id: "user-email",
                defaultSortDirection: SortDirection.Asc,
                header: function EmailHeader(props: ColumnHeaderProps<SysConfigPermissionGrantFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>User Email</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            User Email{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => allUsersResponse.data?.User.find((x) => x.id === data.userId)?.email ?? "Unknown",
                set: (data, value) => {
                    const user = allUsersResponse.data?.User.find((x) => x.email === value);
                    data.userId = user?.id;
                },
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows: Array<SysConfigPermissionGrantFragment>, filterValue: string) => {
                    if (filterValue === "") {
                        return [];
                    } else {
                        return rows.filter((row) => {
                            const user = allUsersResponse.data?.User.find((x) => x.id === row.userId);
                            return !!user?.email?.toLowerCase().includes(filterValue.toLowerCase());
                        });
                    }
                },
                filterEl: TextColumnFilter,
                cell: function EmailCell({
                    isInCreate,
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<SysConfigPermissionGrantFragment>>) {
                    const { onCopy, hasCopied } = useClipboard(value ?? "");
                    if (isInCreate) {
                        return (
                            <Input
                                value={value}
                                onChange={(ev) => {
                                    onChange?.(ev.target.value);
                                }}
                                onBlur={onBlur}
                                ref={ref as LegacyRef<HTMLInputElement>}
                            />
                        );
                    } else {
                        return (
                            <Flex alignItems="center">
                                <chakra.span>{value}</chakra.span>
                                <Button onClick={onCopy} size="xs" ml="auto">
                                    <FAIcon iconStyle="s" icon={hasCopied ? "check-circle" : "clipboard"} />
                                </Button>
                            </Flex>
                        );
                    }
                },
            },
            {
                id: "granted-permission",
                defaultSortDirection: SortDirection.Asc,
                header: function GrantedPermissionHeader(props: ColumnHeaderProps<SysConfigPermissionGrantFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Granted Permission</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Granted Permission{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.permissionName ?? "NULL",
                set: (data, value) => {
                    data.permissionName = value === "NULL" ? undefined : value;
                },
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows: Array<SysConfigPermissionGrantFragment>, filterValue: string) => {
                    if (filterValue === "") {
                        return [];
                    } else {
                        return rows.filter(
                            (row) => !!row.permissionName?.toLowerCase().includes(filterValue.toLowerCase())
                        );
                    }
                },
                filterEl: TextColumnFilter,
                cell: function GrantedPermissionCell({
                    isInCreate,
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<SysConfigPermissionGrantFragment>>) {
                    if (isInCreate) {
                        return (
                            <Select
                                value={value ?? ""}
                                onChange={(ev) => onChange?.(ev.target.value)}
                                onBlur={onBlur}
                                ref={ref as LegacyRef<HTMLSelectElement>}
                            >
                                <option value="NULL">Please select a permission</option>
                                {insertablePermissionNames?.map((name) => (
                                    <option key={name} value={name ?? ""}>
                                        {name}
                                    </option>
                                ))}
                            </Select>
                        );
                    } else {
                        return <Code>{value}</Code>;
                    }
                },
            },
            {
                id: "target-key",
                defaultSortDirection: SortDirection.Asc,
                header: function TargetPermissionHeader(props: ColumnHeaderProps<SysConfigPermissionGrantFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Target Configuration Key</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Target Configuration Key{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.configurationKey ?? "",
                set: (data, value) => {
                    data.configurationKey = value === "NULL" || value === "" ? null : value;
                },
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows: Array<SysConfigPermissionGrantFragment>, filterValue: string) => {
                    if (filterValue === "") {
                        return [];
                    } else {
                        return rows.filter(
                            (row) => !!row.configurationKey?.toLowerCase().includes(filterValue.toLowerCase())
                        );
                    }
                },
                filterEl: TextColumnFilter,
                cell: function TargetPermissionCell({
                    isInCreate,
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<SysConfigPermissionGrantFragment>>) {
                    if (isInCreate) {
                        return (
                            <Select
                                value={value ?? ""}
                                onChange={(ev) => onChange?.(ev.target.value)}
                                onBlur={onBlur}
                                ref={ref as LegacyRef<HTMLSelectElement>}
                            >
                                <option value="NULL">Please select an option</option>
                                {Object.values(System_ConfigurationKey_Enum).map((name) => (
                                    <option key={name} value={name ?? ""}>
                                        {name}
                                    </option>
                                ))}
                            </Select>
                        );
                    } else {
                        return <Code>{value}</Code>;
                    }
                },
            },
            {
                id: "id",
                header: function EmailHeader(props: ColumnHeaderProps<SysConfigPermissionGrantFragment>) {
                    return props.isInCreate ? (
                        <></>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Id{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.id,
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows: Array<SysConfigPermissionGrantFragment>, filterValue: string) => {
                    if (filterValue === "") {
                        return rows.filter((row) => (row.id ?? "") === "");
                    } else {
                        return rows.filter((row) => !!row.id.toLowerCase().includes(filterValue.toLowerCase()));
                    }
                },
                filterEl: TextColumnFilter,
                cell: function IdCell({ isInCreate, value }: CellProps<Partial<SysConfigPermissionGrantFragment>>) {
                    const { onCopy, hasCopied } = useClipboard(value ?? "");
                    if (isInCreate) {
                        return <></>;
                    }
                    return (
                        <Flex alignItems="center">
                            <chakra.span>{value}</chakra.span>
                            <Button onClick={onCopy} size="xs" ml="auto">
                                <FAIcon iconStyle="s" icon={hasCopied ? "check-circle" : "clipboard"} />
                            </Button>
                        </Flex>
                    );
                },
            },

            {
                id: "user-id",
                header: function UserIdHeader(props: ColumnHeaderProps<SysConfigPermissionGrantFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>User Id</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            User Id{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.userId,
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows: Array<SysConfigPermissionGrantFragment>, filterValue: string) => {
                    if (filterValue === "") {
                        return rows.filter((row) => (row.userId ?? "") === "");
                    } else {
                        return rows.filter((row) => !!row.userId.toLowerCase().includes(filterValue.toLowerCase()));
                    }
                },
                filterEl: TextColumnFilter,
                cell: function UserIdCell({ value }: CellProps<Partial<SysConfigPermissionGrantFragment>>) {
                    const { onCopy, hasCopied } = useClipboard(value ?? "");
                    return (
                        <Flex alignItems="center">
                            <chakra.span>{value}</chakra.span>
                            <Button onClick={onCopy} size="xs" ml="auto">
                                <FAIcon iconStyle="s" icon={hasCopied ? "check-circle" : "clipboard"} />
                            </Button>
                        </Flex>
                    );
                },
            },
        ],
        [allUsersResponse.data?.User, insertablePermissionNames]
    );
    const data = useMemo(
        () =>
            (allPermissionsResponse.data?.system_ConfigurationPermissionGrant && [
                ...allPermissionsResponse.data.system_ConfigurationPermissionGrant,
            ]) ??
            null,
        [allPermissionsResponse.data?.system_ConfigurationPermissionGrant]
    );

    const [insertResponse, insertM] = useInsertSysConfigPermissionGrantMutation();
    const insert = useMemo<Insert<SysConfigPermissionGrantFragment>>(
        () => ({
            ongoing: insertResponse.fetching,
            generateDefaults: () => ({
                id: uuidv4(),
                userId: currentUser.user.id,
            }),
            makeWhole: (d) => d as SysConfigPermissionGrantFragment,
            start: (record) => {
                insertM(
                    {
                        object: record,
                    },
                    // update: (cache, { data: _data }) => {
                    //     if (_data?.insert_room_Room_one) {
                    //         const data = _data.insert_room_Room_one;
                    //         cache.writeFragment({
                    //             data,
                    //             fragment: RoomWithParticipantInfoFragmentDoc,
                    //             fragmentName: "RoomWithParticipantInfo",
                    //         });
                    //     }
                    // },
                    {
                        fetchOptions: {
                            headers: {
                                [AuthHeader.Role]: "superuser",
                            },
                        },
                    }
                );
            },
        }),
        [currentUser.user.id, insertM, insertResponse.fetching]
    );

    const [deleteResponse, deleteM] = useDeleteSysConfigPermissionGrantsMutation();
    const deleteO = useMemo<Delete<SysConfigPermissionGrantFragment>>(
        () => ({
            ongoing: deleteResponse.fetching,
            start: (keys) => {
                deleteM(
                    {
                        ids: keys,
                    },
                    // update: (cache, { data: _data }) => {
                    //     if (_data?.delete_room_Room) {
                    //         const data = _data.delete_room_Room;
                    //         const deletedIds = data.returning.map((x) => x.id);
                    //         cache.modify({
                    //             fields: {
                    //                 room_Room(existingRefs: Reference[] = [], { readField }) {
                    //                     deletedIds.forEach((x) => {
                    //                         cache.evict({
                    //                             id: x.id,
                    //                             fieldName: "RoomWithParticipantInfo",
                    //                             broadcast: true,
                    //                         });
                    //                     });
                    //                     return existingRefs.filter(
                    //                         (ref) => !deletedIds.includes(readField("id", ref))
                    //                     );
                    //                 },
                    //             },
                    //         });
                    //     }
                    // },
                    {
                        fetchOptions: {
                            headers: {
                                [AuthHeader.Role]: "superuser",
                            },
                        },
                    }
                );
            },
        }),
        [deleteM, deleteResponse.fetching]
    );

    return (
        <CRUDTable
            data={
                !allPermissionsResponse.fetching &&
                (allPermissionsResponse.data?.system_ConfigurationPermissionGrant ? data : null)
            }
            tableUniqueName="SysConfigPermissionGrants"
            row={row}
            columns={columns}
            insert={insertablePermissionNames?.length ? insert : undefined}
            delete={deleteO}
            alert={
                insertResponse.error || deleteResponse.error
                    ? {
                          status: "error",
                          title: "Error saving changes",
                          description:
                              extractActualError(insertResponse.error ?? deleteResponse.error) ?? "Unknown error",
                      }
                    : undefined
            }
        />
    );
}
