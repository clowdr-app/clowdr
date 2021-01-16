import { FetchResult, gql } from "@apollo/client";
import { Heading, Spinner, useToast } from "@chakra-ui/react";
import assert from "assert";
import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    CreateDeleteAttendeesMutation,
    Permission_Enum,
    UpdateAttendeeMutation,
    useCreateDeleteAttendeesMutation,
    useInsertInvitationEmailJobsMutation,
    useSelectAllAttendeesQuery,
    useSelectAllGroupsQuery,
    useUpdateAttendeeMutation,
} from "../../../generated/graphql";
import CRUDTable, {
    BooleanFieldFormat,
    CRUDTableProps,
    defaultBooleanFilter,
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
import type { AttendeeDescriptor } from "./People/Types";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

gql`
    fragment AttendeeParts on Attendee {
        conferenceId
        id
        groupAttendees {
            attendeeId
            id
            groupId
        }
        invitation {
            attendeeId
            id
            inviteCode
            invitedEmailAddress
            linkToUserId
            createdAt
            updatedAt
            hash
        }
        userId
        updatedAt
        createdAt
        displayName
        inviteSent
    }

    query SelectAllAttendees($conferenceId: uuid!) {
        Attendee(where: { conferenceId: { _eq: $conferenceId } }) {
            ...AttendeeParts
        }
    }

    mutation CreateDeleteAttendees(
        $deleteAttendeeIds: [uuid!] = []
        $insertAttendees: [Attendee_insert_input!]!
        $insertInvitations: [Invitation_insert_input!]!
    ) {
        delete_Attendee(where: { id: { _in: $deleteAttendeeIds } }) {
            returning {
                id
            }
        }
        insert_Attendee(objects: $insertAttendees) {
            returning {
                ...AttendeeParts
            }
        }
        insert_Invitation(objects: $insertInvitations) {
            affected_rows
        }
    }

    mutation UpdateAttendee(
        $attendeeId: uuid!
        $attendeeName: String!
        $insertGroups: [GroupAttendee_insert_input!]!
        $deleteGroupIds: [uuid!] = []
    ) {
        update_Attendee_by_pk(pk_columns: { id: $attendeeId }, _set: { displayName: $attendeeName }) {
            ...AttendeeParts
        }
        insert_GroupAttendee(objects: $insertGroups) {
            returning {
                id
                attendeeId
                groupId
            }
        }
        delete_GroupAttendee(where: { attendeeId: { _eq: $attendeeId }, groupId: { _in: $deleteGroupIds } }) {
            returning {
                id
            }
        }
    }

    mutation InsertInvitationEmailJobs($attendeeIds: jsonb!, $conferenceId: uuid!, $sendRepeat: Boolean!) {
        insert_job_queues_InvitationEmailJob(
            objects: [{ attendeeIds: $attendeeIds, conferenceId: $conferenceId, sendRepeat: $sendRepeat }]
        ) {
            affected_rows
        }
    }
`;

type GroupOption = SelectOption;

const AttendeesCRUDTable = (props: Readonly<CRUDTableProps<AttendeeDescriptor, "id">>) => CRUDTable(props);

// TODO: Email validation
// TODO: Client-side de-duplication/validation
// TODO: Import/export

export default function ManageConferencePeoplePage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage people at ${conference.shortName}`);

    useDashboardPrimaryMenuButtons();

    const { loading: loadingAllGroups, error: errorAllGroups, data: allGroups } = useSelectAllGroupsQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorAllGroups);

    const {
        loading: loadingAllAttendees,
        error: errorAllAttendees,
        data: allAttendees,
        refetch: refetchAllAttendees,
    } = useSelectAllAttendeesQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorAllAttendees);

    const [createDeleteAttendeesMutation] = useCreateDeleteAttendeesMutation();
    const [updateAttendeeMutation] = useUpdateAttendeeMutation();

    const [allAttendeesMap, setAllAttendeesMap] = useState<Map<string, AttendeeDescriptor>>();

    const parsedDBAttendees = useMemo(() => {
        if (!allAttendees || !allGroups) {
            return undefined;
        }

        const result = new Map<string, AttendeeDescriptor>();

        for (const attendee of allAttendees.Attendee) {
            const groupIds: Set<string> = new Set();
            for (const attendeeRole of attendee.groupAttendees) {
                groupIds.add(attendeeRole.groupId);
            }
            result.set(attendee.id, {
                isNew: false,
                id: attendee.id,
                userId: attendee.userId,
                displayName: attendee.displayName,
                invitedEmailAddress: attendee.invitation?.invitedEmailAddress,
                inviteSent: attendee.inviteSent ?? true,
                inviteCode: attendee.invitation?.inviteCode,
                groupIds,
            });
        }

        return result;
    }, [allAttendees, allGroups]);

    useEffect(() => {
        if (parsedDBAttendees) {
            setAllAttendeesMap(parsedDBAttendees);
        }
    }, [parsedDBAttendees]);

    const fields = useMemo(() => {
        const groupOptions: GroupOption[] =
            allGroups?.Group.map((group) => ({
                value: group.id,
                label: group.name,
            })) ?? [];
        const result: {
            [K: string]: Readonly<PrimaryField<AttendeeDescriptor, any>>;
        } = {
            name: {
                heading: "Name",
                ariaLabel: "Name",
                description: "Attendee name",
                isHidden: false,
                isEditable: true,
                defaultValue: "New attendee name",
                insert: (item, v) => {
                    return {
                        ...item,
                        displayName: v,
                    };
                },
                extract: (v) => v.displayName,
                spec: {
                    fieldType: FieldType.string,
                    convertFromUI: (x) => x,
                    convertToUI: (x) => x,
                    filter: defaultStringFilter,
                },
                validate: (v) => v.length >= 3 || ["Name must be at least 3 characters"],
            },
            inviteSent: {
                heading: "Invite sent?",
                ariaLabel: "Invite sent",
                description: "Has at least one invitation email been sent to this user.",
                isHidden: false,
                isEditable: false,
                defaultValue: false,
                extract: (v) => v.inviteSent,
                spec: {
                    fieldType: FieldType.boolean,
                    convertToUI: (x: boolean) => x,
                    format: BooleanFieldFormat.checkbox,
                    filter: defaultBooleanFilter,
                },
            },
            inviteAccepted: {
                heading: "Invite accepted?",
                ariaLabel: "Invite accepted",
                description: "Has this attendee accepted their invitation.",
                isHidden: false,
                isEditable: false,
                defaultValue: false,
                extract: (v) => !!v.userId,
                spec: {
                    fieldType: FieldType.boolean,
                    convertToUI: (x: boolean) => x,
                    format: BooleanFieldFormat.checkbox,
                    filter: defaultBooleanFilter,
                },
            },
            invitedEmailAddress: {
                heading: "Invitation email address",
                ariaLabel: "Invitation email address",
                description: "The email address this attendee's invitation should be sent to.",
                isHidden: false,
                isEditableAtCreate: true,
                isEditable: false,
                defaultValue: "",
                insert: (item, v) => {
                    if ("isNew" in item && !item.isNew && !item.invitedEmailAddress) {
                        return item;
                    }

                    return {
                        ...item,
                        invitedEmailAddress: v,
                    };
                },
                extract: (v) => v.invitedEmailAddress ?? "N/A",
                spec: {
                    fieldType: FieldType.string,
                    convertFromUI: (x) => x,
                    convertToUI: (x) => x,
                    filter: defaultStringFilter,
                },
                validate: (_v) => true, // TODO: Validation
            },
            inviteCode: {
                heading: "Invitation code",
                ariaLabel: "Invitation code",
                description: "The code for this attendee's invitation. May change after certain operations.",
                isHidden: false,
                isEditable: false,
                defaultValue: "",
                extract: (v) => v.inviteCode ?? "N/A",
                spec: {
                    fieldType: FieldType.string,
                    convertFromUI: (x) => x,
                    convertToUI: (x) => x,
                    filter: defaultStringFilter,
                },
                validate: (_v) => true, // TODO: Validation
            },
            groups: {
                heading: "Groups",
                ariaLabel: "Groups",
                description: "The groups for this attendee.",
                isHidden: false,
                isEditable: true,
                defaultValue: [],
                insert: (item, v) => {
                    return {
                        ...item,
                        groupIds: v,
                    };
                },
                extract: (item) => item.groupIds,
                spec: {
                    fieldType: FieldType.select,
                    multiSelect: true,
                    convertToUI: (ids) =>
                        Array.from(ids.values()).map((id) => {
                            const opt = groupOptions.find((x) => x.value === id);
                            assert(opt);
                            return opt;
                        }),
                    convertFromUI: (opts) => {
                        opts ??= [];
                        return opts instanceof Array ? new Set(opts.map((x) => x.value)) : new Set([opts.value]);
                    },
                    filter: defaultSelectFilter,
                    options: () => groupOptions,
                },
            },
        };
        return result;
    }, [allGroups?.Group]);

    const [
        insertInvitationEmailJobsMutation,
        { loading: insertInvitationEmailJobsLoading },
    ] = useInsertInvitationEmailJobsMutation();

    const toast = useToast();

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[
                Permission_Enum.ConferenceManageAttendees,
                Permission_Enum.ConferenceManageRoles,
                Permission_Enum.ConferenceManageGroups,
            ]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                People
            </Heading>
            {(loadingAllGroups && !allGroups) || (loadingAllAttendees && !allAttendeesMap) ? (
                <Spinner />
            ) : errorAllAttendees || errorAllGroups ? (
                <>An error occurred loading in data - please see further information in notifications.</>
            ) : (
                <></>
            )}
            <AttendeesCRUDTable
                key="crud-table"
                data={allAttendeesMap ?? new Map()}
                csud={{
                    cudCallbacks: {
                        generateTemporaryKey: () => uuidv4(),
                        create: (tempKey, item) => {
                            const newItem = {
                                ...item,
                                isNew: true,
                                id: tempKey,
                            } as AttendeeDescriptor;
                            setAllAttendeesMap((oldData) => {
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

                            setAllAttendeesMap((oldData) => {
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

                            setAllAttendeesMap((oldData) => {
                                const newData = new Map(oldData ? oldData.entries() : []);
                                keys.forEach((key) => {
                                    newData.delete(key);
                                });
                                return newData;
                            });

                            return results;
                        },
                        save: async (keys) => {
                            assert(allAttendeesMap);
                            assert(allGroups);

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
                                const item = allAttendeesMap.get(key);
                                if (!item) {
                                    deletedKeys.add(key);
                                } else {
                                    if (item.isNew) {
                                        newKeys.add(key);
                                    } else {
                                        const existing = parsedDBAttendees?.get(key);
                                        if (!existing) {
                                            console.error("Not-new value was not found in the existing DB dataset.");
                                            results.set(key, false);
                                            return;
                                        }

                                        let changed = item.displayName !== existing.displayName;
                                        const groupIdsAdded = new Set<string>();
                                        const groupIdsDeleted = new Set<string>();
                                        for (const group of allGroups.Group) {
                                            if (item.groupIds.has(group.id) && !existing.groupIds.has(group.id)) {
                                                changed = true;
                                                groupIdsAdded.add(group.id);
                                            } else if (
                                                !item.groupIds.has(group.id) &&
                                                existing.groupIds.has(group.id)
                                            ) {
                                                changed = true;
                                                groupIdsDeleted.add(group.id);
                                            }
                                        }
                                        if (changed) {
                                            updatedKeys.set(key, {
                                                added: groupIdsAdded,
                                                deleted: groupIdsDeleted,
                                            });
                                        }
                                    }
                                }
                            });

                            let createDeleteAttendeesResult: FetchResult<
                                CreateDeleteAttendeesMutation,
                                Record<string, any>,
                                Record<string, any>
                            >;
                            try {
                                const keysToInsert = Array.from(newKeys.values());
                                createDeleteAttendeesResult = await createDeleteAttendeesMutation({
                                    variables: {
                                        deleteAttendeeIds: Array.from(deletedKeys.values()),
                                        insertAttendees: keysToInsert.map((key) => {
                                            const item = allAttendeesMap.get(key);
                                            assert(item);
                                            return {
                                                id: item.id,
                                                conferenceId: conference.id,
                                                displayName: item.displayName,
                                                groupAttendees: {
                                                    data: Array.from(item.groupIds.values()).map((groupId) => ({
                                                        groupId,
                                                    })),
                                                },
                                            };
                                        }),
                                        insertInvitations: keysToInsert.map((key) => {
                                            const item = allAttendeesMap.get(key);
                                            assert(item);
                                            return {
                                                attendeeId: item.id,
                                                invitedEmailAddress: item.invitedEmailAddress,
                                            };
                                        }),
                                    },
                                });
                            } catch (e) {
                                createDeleteAttendeesResult = {
                                    errors: [e],
                                };
                            }
                            if (createDeleteAttendeesResult.errors) {
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
                                result: FetchResult<UpdateAttendeeMutation, Record<string, any>, Record<string, any>>;
                            }[];
                            try {
                                updatedResults = await Promise.all(
                                    Array.from(updatedKeys.entries()).map(async ([key, { added, deleted }]) => {
                                        const item = allAttendeesMap.get(key);
                                        assert(item);
                                        let result: FetchResult<
                                            UpdateAttendeeMutation,
                                            Record<string, any>,
                                            Record<string, any>
                                        >;
                                        try {
                                            result = await updateAttendeeMutation({
                                                variables: {
                                                    attendeeId: item.id,
                                                    attendeeName: item.displayName,
                                                    deleteGroupIds: Array.from(deleted.values()),
                                                    insertGroups: Array.from(added.values()).map((groupId) => {
                                                        return {
                                                            attendeeId: item.id,
                                                            groupId,
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

                            await refetchAllAttendees();

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
                        getRowTitle: (v) => v.displayName,
                    },
                    otherFields: fields,
                }}
                customButtons={[
                    {
                        text: "Import",
                        label: "Import",
                        colorScheme: "green",
                        action: `/conference/${conference.slug}/manage/import/people`,
                        enabledWhenDirty: false,
                        enabledWhenNothingSelected: true,
                        isRunning: false,
                        tooltipWhenDisabled: "",
                        tooltipWhenEnabled: "",
                    },
                    {
                        text: "Send initial invitations",
                        label: "Send initial invitations",
                        colorScheme: "purple",
                        enabledWhenNothingSelected: false,
                        enabledWhenDirty: false,
                        tooltipWhenDisabled: "Save changes to enable sending invitations",
                        tooltipWhenEnabled:
                            "Sends invitations to selected attendees who have not already been sent an invite.",
                        action: async (keys) => {
                            const result = await insertInvitationEmailJobsMutation({
                                variables: {
                                    attendeeIds: Array.from(keys.values()),
                                    conferenceId: conference.id,
                                    sendRepeat: false,
                                },
                            });
                            if (result.errors && result.errors.length > 0) {
                                toast({
                                    title: "Failed to send invitiation emails",
                                    description: result.errors[0].message,
                                    isClosable: true,
                                    status: "error",
                                });
                            } else {
                                toast({
                                    title: "Invitiation emails sent",
                                    duration: 8000,
                                    status: "success",
                                });
                            }

                            await refetchAllAttendees();
                        },
                        isRunning: insertInvitationEmailJobsLoading,
                    },
                    {
                        text: "Send repeat invitations",
                        label: "Send repeat invitations",
                        colorScheme: "purple",
                        enabledWhenNothingSelected: false,
                        enabledWhenDirty: false,
                        tooltipWhenDisabled: "Save changes to enable sending invitations",
                        tooltipWhenEnabled: "Sends repeat invitations to all selected attendees.",
                        action: async (keys) => {
                            const result = await insertInvitationEmailJobsMutation({
                                variables: {
                                    attendeeIds: Array.from(keys.values()),
                                    conferenceId: conference.id,
                                    sendRepeat: true,
                                },
                            });
                            if (result.errors && result.errors.length > 0) {
                                toast({
                                    title: "Failed to send invitiation emails",
                                    description: result.errors[0].message,
                                    isClosable: true,
                                    status: "error",
                                });
                            } else {
                                toast({
                                    title: "Invitiation emails sent",
                                    duration: 8000,
                                    status: "success",
                                });
                            }

                            await refetchAllAttendees();
                        },
                        isRunning: insertInvitationEmailJobsLoading,
                    },
                ]}
            />
        </RequireAtLeastOnePermissionWrapper>
    );
}
