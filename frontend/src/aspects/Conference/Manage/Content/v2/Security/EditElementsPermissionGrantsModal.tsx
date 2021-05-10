import { gql, Reference } from "@apollo/client";
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
import {
    ElementSecurity_ElementPgFragment,
    ElementSecurity_ElementPgFragmentDoc,
    ElementSecurity_UploadablePgFragment,
    ElementSecurity_UploadablePgFragmentDoc,
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
    uploadableIds: {
        uploadableId: string;
        elementId?: string;
    }[];
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

    fragment ElementSecurity_UploadablePG on content_UploadableElementPermissionGrant {
        id
        permissionSetId
        conferenceSlug
        groupId
        entityId
        entity {
            id
            element {
                id
                permissionGrants {
                    ...ElementSecurity_ElementPG
                }
            }
        }
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

    query ElementSecurity_SelectGrants($elementIds: [uuid!]!, $uploadableIds: [uuid!]!, $conferenceId: uuid!) {
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
        content_UploadableElementPermissionGrant(
            where: {
                _or: [
                    { _and: [{ entityId: { _is_null: true } }, { conference: { id: { _eq: $conferenceId } } }] }
                    { entityId: { _in: $uploadableIds } }
                ]
            }
        ) {
            ...ElementSecurity_UploadablePG
        }
        permissions_Role(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ElementSecurity_PermissionSet
        }
        permissions_Group(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ElementSecurity_Group
        }
    }

    mutation ElementSecurity_InsertGrants(
        $elementGrants: [content_ElementPermissionGrant_insert_input!]!
        $uploadableGrants: [content_UploadableElementPermissionGrant_insert_input!]!
    ) {
        insert_content_ElementPermissionGrant(
            objects: $elementGrants
            on_conflict: { constraint: ElementPermissionGrant_permissionSetId_groupId_entityId_key, update_columns: [] }
        ) {
            returning {
                ...ElementSecurity_ElementPG
            }
        }
        insert_content_UploadableElementPermissionGrant(
            objects: $uploadableGrants
            on_conflict: {
                constraint: UploadableElementPermissionGr_permissionSetId_groupId_entit_key
                update_columns: []
            }
        ) {
            returning {
                ...ElementSecurity_UploadablePG
            }
        }
    }

    mutation ElementSecurity_DeleteGrants($elementGrantIds: [uuid!]!, $uploadableGrantIds: [uuid!]!) {
        delete_content_ElementPermissionGrant(where: { id: { _in: $elementGrantIds } }) {
            returning {
                id
            }
        }
        delete_content_UploadableElementPermissionGrant(where: { id: { _in: $uploadableGrantIds } }) {
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
    uploadables: ElementSecurity_UploadablePgFragment[];
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
    uploadableIds,
    treatEmptyAsAny = false,
}: Omit<Props, "isOpen" | "onClose">): JSX.Element {
    const conference = useConference();
    const grantsResponse = useElementSecurity_SelectGrantsQuery({
        variables: {
            elementIds,
            uploadableIds: uploadableIds.map((x) => x.uploadableId),
            conferenceId: conference.id,
        },
        fetchPolicy: "network-only",
    });
    const data: RowType[] = useMemo(
        () =>
            Object.values(
                R.groupBy((x) => x.permissionSetId + "¦" + (x.groupId ?? "NULL"), [
                    ...(grantsResponse.data?.content_ElementPermissionGrant ?? []),
                    ...(grantsResponse.data?.content_UploadableElementPermissionGrant ?? []),
                ])
            ).map((xs) => ({
                permissionSetId: xs[0].permissionSetId,
                groupId: xs[0].groupId ?? null,
                elements: xs.filter(
                    (x) => x.__typename === "content_ElementPermissionGrant"
                ) as ElementSecurity_ElementPgFragment[],
                uploadables: xs.filter(
                    (x) => x.__typename === "content_UploadableElementPermissionGrant"
                ) as ElementSecurity_UploadablePgFragment[],
            })),
        [
            grantsResponse.data?.content_ElementPermissionGrant,
            grantsResponse.data?.content_UploadableElementPermissionGrant,
        ]
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
                header: function PermissionSetHeader(props: ColumnHeaderProps<RowType>) {
                    return props.isInCreate ? (
                        <FormLabel>Permission Set</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Permission Set{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.permissionSetId,
                set: (record, value: string) => {
                    record.permissionSetId = (value as any) as DeepWriteable<string | undefined>;
                },
                sort: (x: string, y: string) => x.localeCompare(y),
                cell: function PermissionSetCell(props: CellProps<Partial<RowType>>) {
                    return props.isInCreate ? (
                        <Select
                            value={props.value ?? ""}
                            onChange={(ev) => props.onChange?.(ev.target.value)}
                            onBlur={props.onBlur}
                            ref={props.ref as LegacyRef<HTMLSelectElement>}
                        >
                            <option value="">Select a permission set</option>
                            {permissionSetOptions}
                        </Select>
                    ) : (
                        <Text>{props.value ? permissionSets.get(props.value)?.name ?? "<Unknown>" : "<Unset>"}</Text>
                    );
                },
            },
            {
                id: "group",
                defaultSortDirection: SortDirection.Asc,
                header: function GroupHeader(props: ColumnHeaderProps<RowType>) {
                    return props.isInCreate ? (
                        <FormLabel>Group</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Group{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.groupId,
                set: (record, value: string | null) => {
                    record.groupId = (value === "" ? null : (value as any)) as DeepWriteable<string | null | undefined>;
                },
                sort: (x: string | null, y: string | null) => maybeCompare(x, y, (a, b) => a.localeCompare(b)),
                cell: function GroupCell(props: CellProps<Partial<RowType>>) {
                    return props.isInCreate ? (
                        <Select
                            value={props.value ?? ""}
                            onChange={(ev) => props.onChange?.(ev.target.value)}
                            onBlur={props.onBlur}
                            ref={props.ref as LegacyRef<HTMLSelectElement>}
                        >
                            <option value="">Any group</option>
                            {groupOptions}
                        </Select>
                    ) : (
                        <Text>{props.value ? groups.get(props.value)?.name ?? "<Unknown>" : "<Any>"}</Text>
                    );
                },
            },
            {
                id: "elements",
                header: function ElementsHeader(props: ColumnHeaderProps<RowType>) {
                    return props.isInCreate ? (
                        <FormLabel>Elements</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Elements{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
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
                cell: function GroupCell(props: CellProps<Partial<RowType>>) {
                    return <Text>{props.value}</Text>;
                },
            },
            {
                id: "uploadables",
                header: function UploadablesHeader(props: ColumnHeaderProps<RowType>) {
                    return props.isInCreate ? (
                        <FormLabel>Uploadables</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Uploadables{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => {
                    const uploadables = data.uploadables;
                    if (uploadables) {
                        if (uploadables.some((x) => !x.entityId)) {
                            return "Any";
                        } else if (uploadables.length === 0) {
                            if (uploadableIds.length === 0) {
                                return "All of selected";
                            } else {
                                return "None of selected";
                            }
                        }
                        return uploadableIds.every((id) => uploadables.some((x) => x.entityId === id.uploadableId))
                            ? "All of selected"
                            : "Some of selected";
                    }
                    return "All of selected";
                },
                cell: function GroupCell(props: CellProps<Partial<RowType>>) {
                    return <Text>{props.value}</Text>;
                },
            },
        ],
        [elementIds, uploadableIds, groupOptions, groups, permissionSetOptions, permissionSets]
    );

    const [insertGrants, insertGrantsResponse] = useElementSecurity_InsertGrantsMutation({
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
                if (response.data.insert_content_UploadableElementPermissionGrant) {
                    const datas = response.data.insert_content_UploadableElementPermissionGrant.returning;
                    for (const data of datas) {
                        cache.writeFragment({
                            data,
                            fragment: ElementSecurity_UploadablePgFragmentDoc,
                            fragmentName: "ElementSecurity_UploadablePG",
                        });
                    }
                }
            }
        },
    });
    const [deleteGrants, deleteGrantsResponse] = useElementSecurity_DeleteGrantsMutation({
        update: (cache, response) => {
            if (response.data) {
                const dataE = response.data.delete_content_ElementPermissionGrant;
                const dataU = response.data.delete_content_UploadableElementPermissionGrant;

                const deletedIdsE = dataE?.returning.map((x) => x.id) ?? [];
                const deletedIdsU = dataU?.returning.map((x) => x.id) ?? [];

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
                        content_UploadableElementPermissionGrant(existingRefs: Reference[] = [], { readField }) {
                            deletedIdsU.forEach((x) => {
                                cache.evict({
                                    id: x.id,
                                    fieldName: "ElementSecurity_UploadablePG",
                                    broadcast: true,
                                });
                            });
                            return existingRefs.filter((ref) => !deletedIdsU.includes(readField("id", ref)));
                        },
                    },
                });
            }
        },
    });

    return (
        <>
            {grantsResponse.loading && !grantsResponse.data ? <Spinner label="Loading permission grants" /> : undefined}
            {grantsResponse.data ? (
                <>
                    <CRUDTable
                        data={
                            !grantsResponse.loading && (grantsResponse.data && permissionSets && groups ? data : null)
                        }
                        tableUniqueName="EditElementPermissionGrants"
                        row={row}
                        columns={columns}
                        insert={{
                            ongoing: insertGrantsResponse.loading,
                            generateDefaults: () => ({}),
                            makeWhole: (d) => (d.permissionSetId ? (d as RowType) : undefined),
                            start: (record) => {
                                insertGrants({
                                    variables: {
                                        elementGrants:
                                            treatEmptyAsAny && elementIds.length === 0 && uploadableIds.length === 0
                                                ? [
                                                      {
                                                          entityId: null,
                                                          groupId: record.groupId,
                                                          permissionSetId: record.permissionSetId,
                                                      },
                                                  ]
                                                : [
                                                      ...elementIds.map((elementId) => ({
                                                          entityId: elementId,
                                                          groupId: record.groupId,
                                                          permissionSetId: record.permissionSetId,
                                                      })),
                                                      ...uploadableIds
                                                          .filter((x) => x.elementId)
                                                          .map((uploadableId) => ({
                                                              entityId: uploadableId.elementId,
                                                              groupId: record.groupId,
                                                              permissionSetId: record.permissionSetId,
                                                          })),
                                                  ],
                                        uploadableGrants:
                                            treatEmptyAsAny && elementIds.length === 0 && uploadableIds.length === 0
                                                ? [
                                                      {
                                                          entityId: null,
                                                          groupId: record.groupId,
                                                          permissionSetId: record.permissionSetId,
                                                      },
                                                  ]
                                                : uploadableIds.map((uploadableId) => ({
                                                      entityId: uploadableId.uploadableId,
                                                      groupId: record.groupId,
                                                      permissionSetId: record.permissionSetId,
                                                  })),
                                    },
                                });
                            },
                        }}
                        delete={{
                            ongoing: deleteGrantsResponse.loading,
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
                                deleteGrants({
                                    variables: {
                                        elementGrantIds: R.flatten(
                                            data.map((row) => {
                                                const ids = [];
                                                if (
                                                    keyPairs.some(
                                                        (pair) =>
                                                            pair.permissionSetId === row.permissionSetId &&
                                                            pair.groupId === row.groupId
                                                    )
                                                ) {
                                                    ids.push(...row.elements.map((x) => x.id));
                                                }
                                                const uploadablesElementGrants = R.flatten(
                                                    row.uploadables
                                                        .map((x) => x.entity?.element?.permissionGrants)
                                                        .filter((x) => !!x) as ElementSecurity_ElementPgFragment[][]
                                                );
                                                ids.push(
                                                    uploadablesElementGrants
                                                        .filter((elementGrant) =>
                                                            keyPairs.some(
                                                                (pair) =>
                                                                    pair.permissionSetId ===
                                                                        elementGrant.permissionSetId &&
                                                                    pair.groupId === elementGrant.groupId
                                                            )
                                                        )
                                                        .map((x) => x.id)
                                                );
                                                return ids;
                                            })
                                        ),
                                        uploadableGrantIds: R.flatten(
                                            data.map((row) => {
                                                const ids = [];
                                                if (
                                                    keyPairs.some(
                                                        (pair) =>
                                                            pair.permissionSetId === row.permissionSetId &&
                                                            pair.groupId === row.groupId
                                                    )
                                                ) {
                                                    ids.push(...row.uploadables.map((x) => x.id));
                                                }
                                                return ids;
                                            })
                                        ),
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
