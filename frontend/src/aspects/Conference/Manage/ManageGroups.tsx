import { Spinner } from "@chakra-ui/react";
import { assert } from "@midspace/assert";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4, validate } from "uuid";
import {
    useCreateDeleteGroupsMutation,
    useSelectAllGroupsQuery,
    useUpdateGroupMutation,
} from "../../../generated/graphql";
import type { CRUDTableProps, PrimaryField, UpdateResult } from "../../CRUDTable/CRUDTable";
import CRUDTable, { defaultStringFilter, FieldType } from "../../CRUDTable/CRUDTable";
import { useAuthParameters } from "../../GQL/AuthParameters";
import { makeContext } from "../../GQL/make-context";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { useTitle } from "../../Hooks/useTitle";
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

type GroupDescriptor = {
    isNew: boolean;
    id: string;
    name: string;
};

const GroupsCRUDTable = (props: Readonly<CRUDTableProps<GroupDescriptor, "id">>) => CRUDTable(props);

export default function ManageGroups(): JSX.Element {
    const conference = useConference();
    const { subconferenceId } = useAuthParameters();
    const title = useTitle(`Manage groups of ${conference.shortName}`);

    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
            }),
        [subconferenceId]
    );
    const [{ fetching: loadingAllGroups, error: errorAllGroups, data: allGroups }, refetchAllGroups] =
        useSelectAllGroupsQuery({
            requestPolicy: "network-only",
            variables: {
                conferenceId: conference.id,
                subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
            },
            context,
        });
    useQueryErrorToast(errorAllGroups, false);

    const [, createDeleteGroupsMutation] = useCreateDeleteGroupsMutation();
    const [, updateGroupMutation] = useUpdateGroupMutation();

    const [allGroupsMap, setAllGroupsMap] = useState<Map<string, GroupDescriptor>>();

    const parsedDBGroups = useMemo(() => {
        if (!allGroups) {
            return undefined;
        }

        const result = new Map<string, GroupDescriptor>();

        for (const group of allGroups.registrant_Group) {
            result.set(group.id, {
                isNew: false,
                id: group.id,
                name: group.name,
            });
        }

        return result;
    }, [allGroups]);

    useEffect(() => {
        if (parsedDBGroups) {
            setAllGroupsMap(parsedDBGroups);
        }
    }, [parsedDBGroups]);

    const fields = useMemo(() => {
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
        };
        return result;
    }, []);

    return (
        <DashboardPage title="Groups">
            {title}
            {loadingAllGroups && !allGroupsMap ? (
                <Spinner />
            ) : errorAllGroups ? (
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
                            items.forEach((_item, key) => {
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
                            assert.truthy(allGroupsMap);

                            const newKeys = new Set<string>();
                            const updatedKeys = new Set<string>();
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

                                        if (item.name !== existing.name) {
                                            updatedKeys.add(key);
                                        }
                                    }
                                }
                            });

                            let createDeleteGroupsResult;
                            try {
                                createDeleteGroupsResult = await createDeleteGroupsMutation(
                                    {
                                        deleteGroupIds: Array.from(deletedKeys.values()),
                                        insertGroups: Array.from(newKeys.values()).map((key) => {
                                            const item = allGroupsMap.get(key);
                                            assert.truthy(item);
                                            return {
                                                conferenceId: conference.id,
                                                subconferenceId,
                                                name: item.name,
                                            };
                                        }),
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
                            } catch (e) {
                                createDeleteGroupsResult = {
                                    error: [e],
                                };
                            }
                            if (createDeleteGroupsResult.error) {
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
                                result: any;
                            }[];
                            try {
                                updatedResults = await Promise.all(
                                    Array.from(updatedKeys.values()).map(async (key) => {
                                        const item = allGroupsMap.get(key);
                                        assert.truthy(item);
                                        let result: any;
                                        try {
                                            result = await updateGroupMutation(
                                                {
                                                    groupId: item.id,
                                                    groupName: item.name,
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
                                        } catch (e) {
                                            result = {
                                                error: [e],
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
                                        result: { error: e },
                                    });
                                });
                            }

                            updatedResults.forEach((result) => {
                                if (result.result.error) {
                                    results.set(result.key, false);
                                } else {
                                    results.set(result.key, true);
                                }
                            });

                            refetchAllGroups();

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
                        validate: (v) => validate(v) || ["Invalid UUID"],
                        getRowTitle: (v) => v.name,
                    },
                    otherFields: fields,
                }}
            />
        </DashboardPage>
    );
}
