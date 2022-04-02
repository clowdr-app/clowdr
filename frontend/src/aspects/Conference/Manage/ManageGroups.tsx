import { Button, Flex, FormLabel, Input, Spinner, useClipboard } from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import type { LegacyRef } from "react";
import React, { useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import type { ManageGroups_GroupFragment } from "../../../generated/graphql";
import {
    useCreateDeleteGroupsMutation,
    useSelectAllGroupsQuery,
    useUpdateGroupMutation,
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
    Update,
} from "../../CRUDTable2/CRUDTable2";
import CRUDTable, { SortDirection } from "../../CRUDTable2/CRUDTable2";
import { useAuthParameters } from "../../GQL/AuthParameters";
import { makeContext } from "../../GQL/make-context";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { maybeCompare } from "../../Utils/maybeCompare";
import { useConference } from "../useConference";
import { DashboardPage } from "./DashboardPage";

gql`
    fragment ManageGroups_Group on registrant_Group {
        conferenceId
        id
        name
    }

    query SelectAllGroups($conferenceId: uuid!, $subconferenceCond: uuid_comparison_exp!) {
        registrant_Group(where: { conferenceId: { _eq: $conferenceId }, subconferenceId: $subconferenceCond }) {
            ...ManageGroups_Group
        }
    }

    mutation CreateDeleteGroups($deleteGroupIds: [uuid!] = [], $insertGroups: [registrant_Group_insert_input!]!) {
        delete_registrant_Group(where: { id: { _in: $deleteGroupIds } }) {
            returning {
                id
            }
        }
        insert_registrant_Group(objects: $insertGroups) {
            returning {
                id
                conferenceId
                subconferenceId
                name
            }
        }
    }

    mutation UpdateGroup($groupId: uuid!, $groupName: String!) {
        update_registrant_Group(where: { id: { _eq: $groupId } }, _set: { name: $groupName }) {
            returning {
                id
                name
                conferenceId
                subconferenceId
            }
        }
    }
`;

export default function ManageGroups(): JSX.Element {
    const conference = useConference();
    const { subconferenceId } = useAuthParameters();

    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
            }),
        [subconferenceId]
    );
    const [{ fetching: loadingAllGroups, error: errorAllGroups, data: allGroups }] = useSelectAllGroupsQuery({
        requestPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
        },
        context,
    });
    useQueryErrorToast(errorAllGroups, false);
    const data = useMemo(() => [...(allGroups?.registrant_Group ?? [])], [allGroups?.registrant_Group]);

    const [createDeleteGroupsResponse, createDeleteGroups] = useCreateDeleteGroupsMutation();
    const [updateGroupResponse, updateGroup] = useUpdateGroupMutation();

    const row: RowSpecification<ManageGroups_GroupFragment> = useMemo(
        () => ({
            getKey: (record) => record.id,
            canSelect: (_record) => true,
            pages: {
                defaultToLast: false,
            },
            invalid: (record) =>
                !record.name?.length
                    ? {
                          columnId: "name",
                          reason: "Name required",
                      }
                    : false,
        }),
        []
    );

    const columns: ColumnSpecification<ManageGroups_GroupFragment>[] = useMemo(
        () => [
            {
                id: "name",
                defaultSortDirection: SortDirection.Asc,
                header: function NameHeader({
                    isInCreate,
                    onClick,
                    sortDir,
                }: ColumnHeaderProps<ManageGroups_GroupFragment>) {
                    return isInCreate ? (
                        <FormLabel>Name</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Name{sortDir !== null ? ` ${sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.name,
                set: (record, value: string | undefined) => {
                    record.name = value;
                },
                filterFn: (rows: Array<ManageGroups_GroupFragment>, filterValue: string) => {
                    if (filterValue === "") {
                        return rows.filter((row) => (row.name ?? "") === "");
                    } else {
                        return rows.filter((row) => row.name?.toLowerCase().includes(filterValue.toLowerCase()));
                    }
                },
                filterEl: TextColumnFilter,
                sort: (x: string | undefined, y: string | undefined) =>
                    maybeCompare(x, y, (a, b) => a.localeCompare(b)),
                cell: function GroupCell({
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<ManageGroups_GroupFragment>, string | undefined>) {
                    const { onCopy, hasCopied } = useClipboard(value ?? "");
                    return (
                        <Flex alignItems="center">
                            <Input
                                type="text"
                                value={value ?? ""}
                                onChange={(ev) => onChange?.(ev.target.value)}
                                onBlur={onBlur}
                                ref={ref as LegacyRef<HTMLInputElement>}
                                mr={2}
                            />
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

    const insert: Insert<ManageGroups_GroupFragment> = useMemo(
        () => ({
            ongoing: createDeleteGroupsResponse.fetching,
            generateDefaults: () => {
                const groupId = uuidv4();
                return {
                    id: groupId,
                    conferenceId: conference.id,
                    subconferenceId,
                };
            },
            makeWhole: (d) => (d.name?.length ? (d as ManageGroups_GroupFragment) : undefined),
            start: (record) => {
                createDeleteGroups(
                    {
                        insertGroups: [
                            {
                                id: record.id,
                                conferenceId: conference.id,
                                subconferenceId,
                                name: record.name,
                            },
                        ],
                        deleteGroupIds: [],
                    },
                    {
                        fetchOptions: {
                            headers: {
                                [AuthHeader.Role]: subconferenceId
                                    ? HasuraRoleName.SubconferenceOrganizer
                                    : HasuraRoleName.ConferenceOrganizer,
                            },
                        },
                    }
                );
            },
        }),
        [conference.id, createDeleteGroups, createDeleteGroupsResponse.fetching, subconferenceId]
    );

    const startUpdate = useCallback(
        async (record: ManageGroups_GroupFragment) => {
            return updateGroup(
                {
                    groupId: record.id,
                    groupName: record.name as string,
                },
                {
                    fetchOptions: {
                        headers: {
                            [AuthHeader.Role]: subconferenceId
                                ? HasuraRoleName.SubconferenceOrganizer
                                : HasuraRoleName.ConferenceOrganizer,
                        },
                    },
                }
            );
        },
        [subconferenceId, updateGroup]
    );

    const update: Update<ManageGroups_GroupFragment> = useMemo(
        () => ({
            ongoing: updateGroupResponse.fetching,
            start: startUpdate,
        }),
        [updateGroupResponse.fetching, startUpdate]
    );

    const deleteP: Delete<ManageGroups_GroupFragment> = useMemo(
        () => ({
            ongoing: createDeleteGroupsResponse.fetching,
            start: (keys) => {
                createDeleteGroups(
                    {
                        insertGroups: [],
                        deleteGroupIds: keys,
                    },
                    {
                        fetchOptions: {
                            headers: {
                                [AuthHeader.Role]: subconferenceId
                                    ? HasuraRoleName.SubconferenceOrganizer
                                    : HasuraRoleName.ConferenceOrganizer,
                            },
                        },
                    }
                );
            },
        }),
        [createDeleteGroups, createDeleteGroupsResponse.fetching, subconferenceId]
    );

    const pageSizes = useMemo(() => [10, 20, 35, 50], []);

    return (
        <DashboardPage title="Groups">
            {loadingAllGroups && !allGroups ? (
                <Spinner />
            ) : errorAllGroups ? (
                <>An error occurred loading in data - please see further information in notifications.</>
            ) : (
                <></>
            )}
            <CRUDTable
                data={!loadingAllGroups && (allGroups?.registrant_Group ? data : null)}
                tableUniqueName="ManageConferenceGroups"
                row={row}
                columns={columns}
                pageSizes={pageSizes}
                insert={insert}
                update={update}
                delete={deleteP}
            />
        </DashboardPage>
    );
}
