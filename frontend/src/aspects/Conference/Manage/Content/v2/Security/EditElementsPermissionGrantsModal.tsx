import {
    Button,
    FormLabel,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Select,
    Spinner,
    Text,
} from "@chakra-ui/react";
import * as R from "ramda";
import React, { LegacyRef, useMemo } from "react";
import { gql, Reference } from "urql";
import {
    ElementSecurity_ElementPgFragment,
    ElementSecurity_ElementPgFragmentDoc,
    useElementSecurity_DeleteGrantsMutation,
    useElementSecurity_InsertGrantsMutation,
    useElementSecurity_SelectGrantsQuery,
} from "../../../../../../generated/graphql";
import CRUDTable, {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    DeepWriteable,
    RowSpecification,
    SortDirection,
} from "../../../../../CRUDTable2/CRUDTable2";
import { maybeCompare } from "../../../../../Utils/maybeSort";
import { useConference } from "../../../../useConference";

export interface PermissionGrant {
    id: string;
    permissionSetId: string;
    groupId: string | null | undefined;
    entityId: string | null | undefined;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    elementIds: string[];
    treatEmptyAsAny?: boolean;
}

gql`
    fragment ElementSecurity_ElementPG on content_ElementPermissionGrant {
        id
        permissionSetId
        conferenceSlug
        groupId
        entityId
    }

    fragment ElementSecurity_PermissionSet on permissions_Role {
        id
        name
    }

    fragment ElementSecurity_Group on permissions_Group {
        id
        name
        enabled
        includeUnauthenticated
    }

    query ElementSecurity_SelectGrants($elementIds: [uuid!]!, $conferenceId: uuid!) {
        content_ElementPermissionGrant(
            where: {
                _or: [
                    { _and: [{ entityId: { _is_null: true } }, { conference: { id: { _eq: $conferenceId } } }] }
                    { entityId: { _in: $elementIds } }
                ]
            }
        ) {
            ...ElementSecurity_ElementPG
        }
        permissions_Role(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ElementSecurity_PermissionSet
        }
        permissions_Group(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ElementSecurity_Group
        }
    }

    mutation ElementSecurity_InsertGrants($elementGrants: [content_ElementPermissionGrant_insert_input!]!) {
        insert_content_ElementPermissionGrant(
            objects: $elementGrants
            on_conflict: { constraint: ElementPermissionGrant_permissionSetId_groupId_entityId_key, update_columns: [] }
        ) {
            returning {
                ...ElementSecurity_ElementPG
            }
        }
    }

    mutation ElementSecurity_DeleteGrants($elementGrantIds: [uuid!]!) {
        delete_content_ElementPermissionGrant(where: { id: { _in: $elementGrantIds } }) {
            returning {
                id
            }
        }
    }
`;

type RowType = {
    permissionSetId: string;
    groupId: string | null;
    elements: ElementSecurity_ElementPgFragment[];
};

export function EditElementsPermissionGrantsModal({ isOpen, onClose, ...props }: Props): JSX.Element {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="2xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    Edit security
                    <ModalCloseButton />
                </ModalHeader>
                <ModalBody pb={4}>
                    {isOpen ? <EditElementsPermissionGrantsModalInner {...props} /> : undefined}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

function EditElementsPermissionGrantsModalInner({
    elementIds,
    treatEmptyAsAny = false,
}: Omit<Props, "isOpen" | "onClose">): JSX.Element {
    const conference = useConference();
    const [grantsResponse] = useElementSecurity_SelectGrantsQuery({
        variables: {
            elementIds,
            conferenceId: conference.id,
        },
        fetchPolicy: "network-only",
    });
    const data: RowType[] = useMemo(
        () =>
            Object.values(
                R.groupBy(
                    (x) => x.permissionSetId + "¦" + (x.groupId ?? "NULL"),
                    grantsResponse.data?.content_ElementPermissionGrant ?? []
                )
            ).map((xs) => ({
                permissionSetId: xs[0].permissionSetId,
                groupId: xs[0].groupId ?? null,
                elements: xs.filter(
                    (x) => x.__typename === "content_ElementPermissionGrant"
                ) as ElementSecurity_ElementPgFragment[],
            })),
        [grantsResponse.data?.content_ElementPermissionGrant]
    );

    const permissionSets = useMemo(
        () =>
            new Map(
                grantsResponse.data?.permissions_Role.map((permissionSet) => [
                    permissionSet.id as string,
                    permissionSet,
                ]) ?? []
            ),
        [grantsResponse.data?.permissions_Role]
    );

    const groups = useMemo(
        () => new Map(grantsResponse.data?.permissions_Group.map((group) => [group.id as string, group]) ?? []),
        [grantsResponse.data?.permissions_Group]
    );

    const row: RowSpecification<RowType> = useMemo(
        () => ({
            getKey: (record) => record.permissionSetId + "¦" + (record.groupId ?? "NULL"),
            canSelect: (_record) => true,
            pages: {
                defaultToLast: false,
            },
        }),
        []
    );

    const permissionSetOptions = useMemo(
        () =>
            [...permissionSets.values()].map((x) => (
                <option key={x.id} value={x.id}>
                    {x.name}
                </option>
            )),
        [permissionSets]
    );
    const groupOptions = useMemo(
        () =>
            [...groups.values()].map((x) => (
                <option key={x.id} value={x.id}>
                    {x.name}
                </option>
            )),
        [groups]
    );

    const columns: ColumnSpecification<RowType>[] = useMemo(
        () => [
            {
                id: "permissionSet",
                defaultSortDirection: SortDirection.Asc,
                header: function PermissionSetHeader({ isInCreate, onClick, sortDir }: ColumnHeaderProps<RowType>) {
                    return isInCreate ? (
                        <FormLabel>Permission Set</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Permission Set{sortDir !== null ? ` ${sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.permissionSetId,
                set: (record, value: string) => {
                    record.permissionSetId = value as any as DeepWriteable<string | undefined>;
                },
                sort: (x: string, y: string) => x.localeCompare(y),
                cell: function PermissionSetCell({
                    isInCreate,
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<RowType>>) {
                    return isInCreate ? (
                        <Select
                            value={value ?? ""}
                            onChange={(ev) => onChange?.(ev.target.value)}
                            onBlur={onBlur}
                            ref={ref as LegacyRef<HTMLSelectElement>}
                        >
                            <option value="">Select a permission set</option>
                            {permissionSetOptions}
                        </Select>
                    ) : (
                        <Text>{value ? permissionSets.get(value)?.name ?? "<Unknown>" : "<Unset>"}</Text>
                    );
                },
            },
            {
                id: "group",
                defaultSortDirection: SortDirection.Asc,
                header: function GroupHeader({ isInCreate, onClick, sortDir }: ColumnHeaderProps<RowType>) {
                    return isInCreate ? (
                        <FormLabel>Group</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Group{sortDir !== null ? ` ${sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.groupId,
                set: (record, value: string | null) => {
                    record.groupId = (value === "" ? null : (value as any)) as DeepWriteable<string | null | undefined>;
                },
                sort: (x: string | null, y: string | null) => maybeCompare(x, y, (a, b) => a.localeCompare(b)),
                cell: function GroupCell({ isInCreate, value, onChange, onBlur, ref }: CellProps<Partial<RowType>>) {
                    return isInCreate ? (
                        <Select
                            value={value ?? ""}
                            onChange={(ev) => onChange?.(ev.target.value)}
                            onBlur={onBlur}
                            ref={ref as LegacyRef<HTMLSelectElement>}
                        >
                            <option value="">Any group</option>
                            {groupOptions}
                        </Select>
                    ) : (
                        <Text>{value ? groups.get(value)?.name ?? "<Unknown>" : "<Any>"}</Text>
                    );
                },
            },
            {
                id: "elements",
                header: function ElementsHeader({ isInCreate, onClick, sortDir }: ColumnHeaderProps<RowType>) {
                    return isInCreate ? (
                        <FormLabel>Elements</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Elements{sortDir !== null ? ` ${sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => {
                    const elements = data.elements;
                    if (elements) {
                        if (elements.some((x) => !x.entityId)) {
                            return "Any";
                        } else if (elements.length === 0) {
                            if (elementIds.length === 0) {
                                return "All of selected";
                            } else {
                                return "None of selected";
                            }
                        }
                        return elementIds.every((id) => elements.some((x) => x.entityId === id))
                            ? "All of selected"
                            : "Some of selected";
                    }
                    return "All of selected";
                },
                cell: function GroupCell({ value }: CellProps<Partial<RowType>>) {
                    return <Text>{value}</Text>;
                },
            },
        ],
        [elementIds, groupOptions, groups, permissionSetOptions, permissionSets]
    );

    const [insertGrantsResponse, insertGrants] = useElementSecurity_InsertGrantsMutation({
        update: (cache, response) => {
            if (response.data) {
                if (response.data.insert_content_ElementPermissionGrant) {
                    const datas = response.data.insert_content_ElementPermissionGrant.returning;
                    for (const data of datas) {
                        cache.writeFragment({
                            data,
                            fragment: ElementSecurity_ElementPgFragmentDoc,
                            fragmentName: "ElementSecurity_ElementPG",
                        });
                    }
                }
            }
        },
    });
    const [deleteGrantsResponse, deleteGrants] = useElementSecurity_DeleteGrantsMutation({
        update: (cache, response) => {
            if (response.data) {
                const dataE = response.data.delete_content_ElementPermissionGrant;
                const deletedIdsE = dataE?.returning.map((x) => x.id) ?? [];

                cache.modify({
                    fields: {
                        content_ElementPermissionGrant(existingRefs: Reference[] = [], { readField }) {
                            deletedIdsE.forEach((x) => {
                                cache.evict({
                                    id: x.id,
                                    fieldName: "ElementSecurity_ElementPG",
                                    broadcast: true,
                                });
                            });
                            return existingRefs.filter((ref) => !deletedIdsE.includes(readField("id", ref)));
                        },
                    },
                });
            }
        },
    });

    return (
        <>
            {grantsResponse.fetching && !grantsResponse.data ? (
                <Spinner label="Loading permission grants" />
            ) : undefined}
            {grantsResponse.data ? (
                <>
                    <CRUDTable
                        data={
                            !grantsResponse.fetching && (grantsResponse.data && permissionSets && groups ? data : null)
                        }
                        tableUniqueName="EditElementPermissionGrants"
                        row={row}
                        columns={columns}
                        insert={{
                            ongoing: insertGrantsResponse.fetching,
                            generateDefaults: () => ({}),
                            makeWhole: (d) => (d.permissionSetId ? (d as RowType) : undefined),
                            start: (record) => {
                                insertGrants({
                                    variables: {
                                        elementGrants:
                                            treatEmptyAsAny && elementIds.length === 0
                                                ? [
                                                      {
                                                          entityId: null,
                                                          groupId: record.groupId,
                                                          permissionSetId: record.permissionSetId,
                                                      },
                                                  ]
                                                : elementIds.map((elementId) => ({
                                                      entityId: elementId,
                                                      groupId: record.groupId,
                                                      permissionSetId: record.permissionSetId,
                                                  })),
                                    },
                                });
                            },
                        }}
                        delete={{
                            ongoing: deleteGrantsResponse.fetching,
                            start: (keys) => {
                                const keyPairs: {
                                    permissionSetId: string;
                                    groupId: string | null;
                                }[] = [];
                                keys.forEach((key) => {
                                    const keyParts = key.split("¦");
                                    const keyPermissionSetId = keyParts[0];
                                    const keyGroupId = keyParts[1] === "NULL" ? null : keyParts[1];
                                    keyPairs.push({
                                        permissionSetId: keyPermissionSetId,
                                        groupId: keyGroupId,
                                    });
                                });
                                const elementGrantIds = R.flatten(
                                    data.map((row) => {
                                        if (
                                            keyPairs.some(
                                                (pair) =>
                                                    pair.permissionSetId === row.permissionSetId &&
                                                    pair.groupId === row.groupId
                                            )
                                        ) {
                                            return row.elements
                                                .filter(
                                                    (grant) =>
                                                        (!grant.entityId && elementIds.length === 0) ||
                                                        (grant.entityId && elementIds.includes(grant.entityId))
                                                )
                                                .map((x) => x.id);
                                        }
                                        return [];
                                    })
                                );
                                deleteGrants({
                                    variables: {
                                        elementGrantIds,
                                    },
                                });
                            },
                        }}
                        alert={
                            insertGrantsResponse.error || deleteGrantsResponse.error
                                ? {
                                      status: "error",
                                      title: "Error saving changes",
                                      description:
                                          insertGrantsResponse.error?.message ??
                                          deleteGrantsResponse.error?.message ??
                                          "Unknown error",
                                  }
                                : undefined
                        }
                    />
                </>
            ) : undefined}
        </>
    );
}
