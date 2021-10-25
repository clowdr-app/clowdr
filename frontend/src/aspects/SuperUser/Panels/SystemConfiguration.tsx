import { Button, chakra, Flex, FormLabel, Input, NumberInput, Select, useClipboard } from "@chakra-ui/react";
import type { LegacyRef } from "react";
import React, { useMemo } from "react";
import { gql } from "urql";
import { v4 as uuidv4 } from "uuid";
import type {
    SysConfigPermissionGrantFragment,
    SystemConfigurationFragment,
    System_Configuration,
} from "../../../generated/graphql";
import {
    System_ConfigurationKey_Enum,
    System_SuperUserPermission_Enum,
    useAllSystemConfigurationsQuery,
    useDeleteSysConfigPermissionGrantsMutation,
    useInsertSysConfigPermissionGrantMutation,
    useUserSysConfigPermissionsQuery,
} from "../../../generated/graphql";
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
import { useShieldedHeaders } from "../../GQL/useShieldedHeaders";
import { FAIcon } from "../../Icons/FAIcon";
import useCurrentUser from "../../Users/CurrentUser/useCurrentUser";

gql`
    query UserSysConfigPermissions($userId: String!) {
        system_ConfigurationPermissionGrant(where: { userId: { _eq: $userId } }) {
            ...SysConfigPermissionGrant
        }
    }

    fragment SystemConfiguration on system_Configuration {
        key
        value
        updated_at
        created_at
    }

    query AllSystemConfigurations {
        system_Configuration {
            ...SystemConfiguration
        }
    }

    mutation InsertSystemConfiguration($object: system_Configuration_insert_input!) {
        insert_system_Configuration_one(object: $object) {
            ...SystemConfiguration
        }
    }

    mutation UpdateSystemConfiguration($key: system_ConfigurationKey_enum!, $set: system_Configuration_set_input!) {
        update_system_Configuration_by_pk(pk_columns: { key: $key }, _set: $set) {
            ...SystemConfiguration
        }
    }

    mutation DeleteSystemConfigurations($keys: [system_ConfigurationKey_enum!]!) {
        delete_system_Configuration(where: { key: { _in: $keys } }) {
            returning {
                key
            }
        }
    }
`;

export default function SystemConfiguration(): JSX.Element {
    const currentUser = useCurrentUser();
    const context = useShieldedHeaders({
        "X-Auth-Role": "superuser",
    });
    const [currentUserPermissionsResponse] = useUserSysConfigPermissionsQuery({
        variables: {
            userId: currentUser.user.id,
        },
        context,
        requestPolicy: "network-only",
    });
    const editableKeys = useMemo(
        () =>
            currentUserPermissionsResponse.data?.system_ConfigurationPermissionGrant
                .filter(
                    (x) =>
                        x.permissionName === System_SuperUserPermission_Enum.SetSystemConfiguration &&
                        x.configurationKey
                )
                .map((x) => x.configurationKey)
                .sort(),
        [currentUserPermissionsResponse.data?.system_ConfigurationPermissionGrant]
    );

    const [allConfigurationsResponse] = useAllSystemConfigurationsQuery({
        context,
        requestPolicy: "network-only",
    });

    const row: RowSpecification<SystemConfigurationFragment> = useMemo(
        () => ({
            getKey: (record) => record.key,
            canSelect: (record) => !!editableKeys?.includes(record.key) || "",
            canDelete: (record) => !!editableKeys?.includes(record.key) || "You do not have permission to delete this.",
            invalid: (record) => {
                switch (record.key) {
                    case System_ConfigurationKey_Enum.AllowEmailsToDomains:
                        return (
                            !(record.value instanceof Array && record.value.every((x) => typeof x === "string")) && {
                                reason: "Allow emails to domains should be an array of strings in JSON format",
                                columnId: "value",
                            }
                        );
                    case System_ConfigurationKey_Enum.CookiePolicyLatestRevisionTimestamp:
                    case System_ConfigurationKey_Enum.PrivacyPolicyLatestRevisionTimestamp:
                    case System_ConfigurationKey_Enum.TermsLatestRevisionTimestamp:
                        return (
                            typeof record.value !== "number" && {
                                reason: "Timestamp should be a number representing the number of milliseconds since 1970/01/01T00:00. See JavaScript's Date.now() function.",
                                columnId: "value",
                            }
                        );
                    case System_ConfigurationKey_Enum.CookiePolicyUrl:
                    case System_ConfigurationKey_Enum.DefaultFrontendHost:
                    case System_ConfigurationKey_Enum.HostOrganisationName:
                    case System_ConfigurationKey_Enum.PrivacyPolicyUrl:
                    case System_ConfigurationKey_Enum.SendgridApiKey:
                    case System_ConfigurationKey_Enum.SendgridReplyto:
                    case System_ConfigurationKey_Enum.SendgridSender:
                    case System_ConfigurationKey_Enum.StopEmailsContactEmailAddress:
                    case System_ConfigurationKey_Enum.TermsUrl:
                    case System_ConfigurationKey_Enum.VapidPrivateKey:
                    case System_ConfigurationKey_Enum.VapidPublicKey:
                        return (
                            typeof record.value !== "string" && {
                                reason: "Value should be a string.",
                                columnId: "value",
                            }
                        );
                    case System_ConfigurationKey_Enum.DefaultVideoRoomBackend:
                        return typeof record.value !== "string"
                            ? { reason: "Value should be a string", columnId: "value" }
                            : !(record.value === "CHIME" || record.value === "VONAGE") && {
                                  reason: "Value should be CHIME or VONAGE.",
                                  columnId: "value",
                              };
                    default:
                        return { reason: "Validation of this key is missing.", columnId: "value" };
                }

                return false;
            },
            pages: {
                defaultToLast: false,
            },
        }),
        [editableKeys]
    );

    const columns: ColumnSpecification<SystemConfigurationFragment>[] = useMemo(
        () => [
            {
                id: "key",
                defaultSortDirection: SortDirection.Asc,
                header: function Header(props: ColumnHeaderProps<SystemConfigurationFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Key</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Key{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.key,
                set: (data, value) => {
                    data.key = value;
                },
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows: Array<SystemConfigurationFragment>, filterValue: string) => {
                    if (filterValue === "") {
                        return [];
                    } else {
                        return rows.filter((row) => {
                            return !!row.key?.toLowerCase().includes(filterValue.toLowerCase());
                        });
                    }
                },
                filterEl: TextColumnFilter,
                cell: function Cell({
                    isInCreate,
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<System_Configuration>>) {
                    const { onCopy, hasCopied } = useClipboard(value ?? "");
                    if (isInCreate) {
                        return (
                            <Select
                                value={value}
                                onChange={(ev) => {
                                    onChange?.(ev.target.value);
                                }}
                                onBlur={onBlur}
                                ref={ref as LegacyRef<HTMLSelectElement>}
                            >
                                <option value="">Please select a key</option>
                                {Object.values(System_ConfigurationKey_Enum).map((key) => (
                                    <option key={key} value={key}>
                                        {key}
                                    </option>
                                ))}
                            </Select>
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
                id: "value",
                header: function Header(props: ColumnHeaderProps<SystemConfigurationFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Value</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Value{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) =>
                    data.key === System_ConfigurationKey_Enum.AllowEmailsToDomains
                        ? data.value instanceof Array
                            ? JSON.stringify(data.value)
                            : data.value
                        : data.value,
                set: (data, value) => {
                    try {
                        data.value =
                            data.key === System_ConfigurationKey_Enum.AllowEmailsToDomains ? JSON.parse(value) : value;
                    } catch {
                        data.value = value;
                    }
                },
                cell: function Cell({
                    value,
                    onChange,
                    onBlur,
                    ref,
                    staleRecord,
                }: CellProps<Partial<SystemConfigurationFragment>>) {
                    const { onCopy, hasCopied } = useClipboard(
                        value
                            ? staleRecord.key === System_ConfigurationKey_Enum.AllowEmailsToDomains
                                ? value
                                : JSON.stringify(value)
                            : ""
                    );
                    let editor: JSX.Element;
                    switch (staleRecord.key) {
                        case System_ConfigurationKey_Enum.AllowEmailsToDomains:
                            editor = (
                                <Input
                                    value={value}
                                    onChange={(ev) => {
                                        onChange?.(ev.target.value);
                                    }}
                                    onBlur={onBlur}
                                    ref={ref as LegacyRef<HTMLInputElement>}
                                />
                            );
                            break;
                        case System_ConfigurationKey_Enum.CookiePolicyLatestRevisionTimestamp:
                        case System_ConfigurationKey_Enum.PrivacyPolicyLatestRevisionTimestamp:
                        case System_ConfigurationKey_Enum.TermsLatestRevisionTimestamp:
                            editor = (
                                <>
                                    <NumberInput
                                        value={value}
                                        onChange={(_valStr, val) => {
                                            onChange?.(val);
                                        }}
                                        onBlur={onBlur}
                                        ref={ref as LegacyRef<HTMLInputElement>}
                                    />
                                    <Button
                                        onClick={() => {
                                            onChange?.(Date.now());
                                        }}
                                        size="xs"
                                        mx="auto"
                                    >
                                        Now
                                    </Button>
                                </>
                            );
                            break;
                        case System_ConfigurationKey_Enum.DefaultVideoRoomBackend:
                            editor = (
                                <Select
                                    value={value}
                                    onChange={(ev) => {
                                        onChange?.(ev.target.value);
                                    }}
                                    onBlur={onBlur}
                                    ref={ref as LegacyRef<HTMLSelectElement>}
                                >
                                    <option value="CHIME">CHIME</option>
                                    <option value="VONAGE">VONAGE</option>
                                </Select>
                            );
                            break;
                        case System_ConfigurationKey_Enum.CookiePolicyUrl:
                        case System_ConfigurationKey_Enum.DefaultFrontendHost:
                        case System_ConfigurationKey_Enum.HostOrganisationName:
                        case System_ConfigurationKey_Enum.PrivacyPolicyUrl:
                        case System_ConfigurationKey_Enum.SendgridApiKey:
                        case System_ConfigurationKey_Enum.SendgridReplyto:
                        case System_ConfigurationKey_Enum.SendgridSender:
                        case System_ConfigurationKey_Enum.StopEmailsContactEmailAddress:
                        case System_ConfigurationKey_Enum.TermsUrl:
                        case System_ConfigurationKey_Enum.VapidPrivateKey:
                        case System_ConfigurationKey_Enum.VapidPublicKey:
                            editor = (
                                <Input
                                    value={value}
                                    onChange={(ev) => {
                                        onChange?.(ev.target.value);
                                    }}
                                    onBlur={onBlur}
                                    ref={ref as LegacyRef<HTMLInputElement>}
                                />
                            );
                            break;
                        default:
                            editor = <>Editor for key not implemented</>;
                    }
                    return (
                        <Flex alignItems="center">
                            {editor}
                            <Button onClick={onCopy} size="xs" ml="auto">
                                <FAIcon iconStyle="s" icon={hasCopied ? "check-circle" : "clipboard"} />
                            </Button>
                        </Flex>
                    );
                },
            },
        ],
        []
    );

    const data = useMemo(
        () =>
            (allConfigurationsResponse.data?.system_Configuration && [
                ...allConfigurationsResponse.data?.system_Configuration,
            ]) ??
            null,
        [allConfigurationsResponse.data?.system_Configuration]
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
                    {
                        fetchOptions: {
                            headers: {
                                "X-Auth-Role": "superuser",
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
                    {
                        fetchOptions: {
                            headers: {
                                "X-Auth-Role": "superuser",
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
                !allConfigurationsResponse.fetching &&
                (allConfigurationsResponse.data?.system_Configuration ? data : null)
            }
            tableUniqueName="SysConfigPermissionGrants"
            row={row}
            columns={columns}
            // insert={insertablePermissionNames?.length ? insert : undefined}
            // update={update}
            // delete={deleteO}
            // alert={
            //     insertResponse.error || updateResponse.error || deleteResponse.error
            //         ? {
            //               status: "error",
            //               title: "Error saving changes",
            //               description:
            //                   insertResponse.error?.message ?? updateResponse.error?.message ?? deleteResponse.error?.message ?? "Unknown error",
            //           }
            //         : undefined
            // }
        />
    );
}
