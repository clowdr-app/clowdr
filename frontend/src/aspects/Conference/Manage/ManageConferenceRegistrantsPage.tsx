import { gql, Reference } from "@apollo/client";
import {
    Box,
    Button,
    Center,
    FormLabel,
    Heading,
    Input,
    Spinner,
    Text,
    Tooltip,
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import assert from "assert";
import React, { LegacyRef, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    AttendeePartsFragment,
    AttendeePartsFragmentDoc,
    InvitationPartsFragmentDoc,
    Permission_Enum,
    useDeleteAttendeesMutation,
    useInsertAttendeeMutation,
    useInsertAttendeeWithoutInviteMutation,
    useInsertInvitationEmailJobsMutation,
    useManageConferencePeoplePage_InsertCustomEmailJobMutation,
    useSelectAllAttendeesQuery,
    useSelectAllGroupsQuery,
    useUpdateAttendeeMutation,
} from "../../../generated/graphql";
import { LinkButton } from "../../Chakra/LinkButton";
import MultiSelect from "../../Chakra/MultiSelect";
import { CheckBoxColumnFilter, MultiSelectColumnFilter, TextColumnFilter } from "../../CRUDTable2/CRUDComponents";
import CRUDTable, {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    DeepWriteable,
    Delete,
    ExtraButton,
    Insert,
    RowSpecification,
    SortDirection,
    Update,
} from "../../CRUDTable2/CRUDTable2";
import PageNotFound from "../../Errors/PageNotFound";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { FAIcon } from "../../Icons/FAIcon";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import { SendEmailModal } from "./Registrants/SendEmailModal";

gql`
    fragment InvitationParts on Invitation {
        attendeeId
        id
        inviteCode
        invitedEmailAddress
        linkToUserId
        createdAt
        updatedAt
        hash
    }

    fragment AttendeeParts on Attendee {
        conferenceId
        id
        groupAttendees {
            attendeeId
            id
            groupId
        }
        invitation {
            ...InvitationParts
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

    mutation InsertAttendee($attendee: Attendee_insert_input!, $invitation: Invitation_insert_input!) {
        insert_Attendee_one(object: $attendee) {
            ...AttendeeParts
        }
        insert_Invitation_one(object: $invitation) {
            ...InvitationParts
        }
    }

    mutation InsertAttendeeWithoutInvite($attendee: Attendee_insert_input!) {
        insert_Attendee_one(object: $attendee) {
            ...AttendeeParts
        }
    }

    mutation DeleteAttendees($deleteAttendeeIds: [uuid!] = []) {
        delete_Attendee(where: { id: { _in: $deleteAttendeeIds } }) {
            returning {
                id
            }
        }
    }

    mutation UpdateAttendee(
        $attendeeId: uuid!
        $attendeeName: String!
        $upsertGroups: [GroupAttendee_insert_input!]!
        $remainingGroupIds: [uuid!]
    ) {
        update_Attendee_by_pk(pk_columns: { id: $attendeeId }, _set: { displayName: $attendeeName }) {
            ...AttendeeParts
        }
        insert_GroupAttendee(
            objects: $upsertGroups
            on_conflict: { constraint: GroupAttendee_groupId_attendeeId_key, update_columns: [] }
        ) {
            returning {
                id
                attendeeId
                groupId
            }
        }
        delete_GroupAttendee(where: { attendeeId: { _eq: $attendeeId }, groupId: { _nin: $remainingGroupIds } }) {
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

    mutation ManageConferencePeoplePage_InsertCustomEmailJob(
        $htmlBody: String!
        $subject: String!
        $conferenceId: uuid!
        $attendeeIds: jsonb!
    ) {
        insert_job_queues_CustomEmailJob(
            objects: { htmlBody: $htmlBody, subject: $subject, conferenceId: $conferenceId, attendeeIds: $attendeeIds }
        ) {
            affected_rows
        }
    }
`;

// type GroupOption = SelectOption;

// const AttendeesCRUDTable = (props: Readonly<CRUDTableProps<AttendeeDescriptor, "id">>) => CRUDTable(props);

// TODO: Email validation
// TODO: Export

type AttendeeDescriptor = AttendeePartsFragment & {
    id?: string;
    groupAttendees?: ReadonlyArray<
        AttendeePartsFragment["groupAttendees"][0] & {
            id?: string;
        }
    >;
};

export default function ManageConferenceRegistrantsPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage registrants at ${conference.shortName}`);

    const { loading: loadingAllGroups, error: errorAllGroups, data: allGroups } = useSelectAllGroupsQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorAllGroups, false);

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
    useQueryErrorToast(errorAllAttendees, false);
    const data = useMemo(() => [...(allAttendees?.Attendee ?? [])], [allAttendees?.Attendee]);

    const [insertAttendee, insertAttendeeResponse] = useInsertAttendeeMutation();
    const [insertAttendeeWithoutInvite, insertAttendeeWithoutInviteResponse] = useInsertAttendeeWithoutInviteMutation();
    const [deleteAttendees, deleteAttendeesResponse] = useDeleteAttendeesMutation();
    const [updateAttendee, updateAttendeeResponse] = useUpdateAttendeeMutation();

    const row: RowSpecification<AttendeeDescriptor> = useMemo(
        () => ({
            getKey: (record) => record.id,
            canSelect: (_record) => true,
            pages: {
                defaultToLast: false,
            },
            invalid: (record) =>
                !record.displayName
                    ? {
                          columnId: "name",
                          reason: "Display name required",
                      }
                    : false,
        }),
        []
    );

    const columns: ColumnSpecification<AttendeeDescriptor>[] = useMemo(() => {
        const groupOptions: { value: string; label: string }[] =
            allGroups?.Group.map((group) => ({
                value: group.id,
                label: group.name,
            })) ?? [];

        const result: ColumnSpecification<AttendeeDescriptor>[] = [
            {
                id: "name",
                defaultSortDirection: SortDirection.Asc,
                header: function NameHeader(props: ColumnHeaderProps<AttendeeDescriptor>) {
                    return props.isInCreate ? (
                        <FormLabel>Name</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Name{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.displayName,
                set: (record, value: string) => {
                    record.displayName = value;
                },
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows: Array<AttendeeDescriptor>, filterValue: string) => {
                    return rows.filter((row) => row.displayName.toLowerCase().includes(filterValue.toLowerCase()));
                },
                filterEl: TextColumnFilter,
                cell: function NameCell(props: CellProps<Partial<AttendeeDescriptor>>) {
                    return (
                        <Input
                            type="text"
                            value={props.value ?? ""}
                            onChange={(ev) => props.onChange?.(ev.target.value)}
                            onBlur={props.onBlur}
                            border="1px solid"
                            borderColor="rgba(255, 255, 255, 0.16)"
                            ref={props.ref as LegacyRef<HTMLInputElement>}
                        />
                    );
                },
            },
            {
                id: "inviteSent",
                header: function NameHeader(props: ColumnHeaderProps<AttendeeDescriptor>) {
                    if (props.isInCreate) {
                        return undefined;
                    } else {
                        return (
                            <Button size="xs" onClick={props.onClick}>
                                Invite sent?{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                            </Button>
                        );
                    }
                },
                get: (data) => data.inviteSent,
                sort: (x: boolean, y: boolean) => (x && y ? 0 : x ? -1 : y ? 1 : 0),
                filterFn: (rows: Array<AttendeeDescriptor>, filterValue: boolean) => {
                    return rows.filter((row) => row.inviteSent === filterValue);
                },
                filterEl: CheckBoxColumnFilter,
                cell: function InviteSentCell(props: CellProps<Partial<AttendeeDescriptor>, boolean>) {
                    if (props.isInCreate) {
                        return undefined;
                    } else {
                        return (
                            <Center>
                                <FAIcon iconStyle="s" icon={props.value ? "check" : "times"} />
                            </Center>
                        );
                    }
                },
            },
            {
                id: "inviteAccepted",
                header: function NameHeader(props: ColumnHeaderProps<AttendeeDescriptor>) {
                    if (props.isInCreate) {
                        return undefined;
                    } else {
                        return (
                            <Button size="xs" onClick={props.onClick}>
                                Invite accepted?{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                            </Button>
                        );
                    }
                },
                get: (data) => !!data.userId,
                sort: (x: boolean, y: boolean) => (x && y ? 0 : x ? -1 : y ? 1 : 0),
                filterFn: (rows: Array<AttendeeDescriptor>, filterValue: boolean) => {
                    return rows.filter((row) => row.inviteSent === filterValue);
                },
                filterEl: CheckBoxColumnFilter,
                cell: function InviteSentCell(props: CellProps<Partial<AttendeeDescriptor>, boolean>) {
                    if (props.isInCreate) {
                        return undefined;
                    } else {
                        return (
                            <Center>
                                <FAIcon iconStyle="s" icon={props.value ? "check" : "times"} />
                            </Center>
                        );
                    }
                },
            },
            {
                id: "invitedEmailAddress",
                header: function NameHeader(props: ColumnHeaderProps<AttendeeDescriptor>) {
                    return props.isInCreate ? (
                        <FormLabel>Invitation address</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Invitation address{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.invitation?.invitedEmailAddress ?? "",
                set: (record, value: string) => {
                    if (!record.invitation) {
                        assert(record.id);
                        record.invitation = {
                            attendeeId: record.id as DeepWriteable<any>,
                            createdAt: (new Date().toISOString() as any) as DeepWriteable<any>,
                            updatedAt: (new Date().toISOString() as any) as DeepWriteable<any>,
                            invitedEmailAddress: value,
                            inviteCode: ("" as any) as DeepWriteable<any>,
                            id: ("" as any) as DeepWriteable<any>,
                        };
                    } else {
                        record.invitation.invitedEmailAddress = value;
                    }
                },
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows: Array<AttendeeDescriptor>, filterValue: string) => {
                    return rows.filter((row) => row.displayName.toLowerCase().includes(filterValue.toLowerCase()));
                },
                filterEl: TextColumnFilter,
                cell: function InvitedEmailAddressCell(props: CellProps<Partial<AttendeeDescriptor>>) {
                    if (props.isInCreate) {
                        return (
                            <Input
                                type="text"
                                value={props.value ?? ""}
                                onChange={(ev) => props.onChange?.(ev.target.value)}
                                onBlur={props.onBlur}
                                border="1px solid"
                                borderColor="rgba(255, 255, 255, 0.16)"
                                ref={props.ref as LegacyRef<HTMLInputElement>}
                            />
                        );
                    } else {
                        return <Text px={2}>{props.value}</Text>;
                    }
                },
            },
            {
                id: "inviteCode",
                header: function NameHeader(props) {
                    if (props.isInCreate) {
                        return undefined;
                    } else {
                        return (
                            <Text size="xs" p={1} textAlign="center" textTransform="none" fontWeight="normal">
                                Invite code
                            </Text>
                        );
                    }
                },
                get: (data) => data.invitation?.inviteCode ?? "",
                filterFn: (rows: Array<AttendeeDescriptor>, filterValue: string) => {
                    return rows.filter((row) => row.displayName.toLowerCase().includes(filterValue.toLowerCase()));
                },
                filterEl: TextColumnFilter,
                cell: function InviteCodeCell(props: CellProps<Partial<AttendeeDescriptor>>) {
                    if (props.isInCreate) {
                        return undefined;
                    } else {
                        return (
                            <Text fontFamily="monospace" px={2}>
                                {props.value}
                            </Text>
                        );
                    }
                },
            },
            {
                id: "groups",
                header: function ContentHeader(props: ColumnHeaderProps<AttendeeDescriptor>) {
                    return props.isInCreate ? (
                        <FormLabel>Groups</FormLabel>
                    ) : (
                        <Text size="xs" p={1} textAlign="center" textTransform="none" fontWeight="normal">
                            Groups
                        </Text>
                    );
                },
                get: (data) =>
                    data.groupAttendees?.map(
                        (ga) =>
                            groupOptions.find((group) => group.value === ga.groupId) ?? {
                                label: "<Unknown>",
                                value: ga.groupId,
                            }
                    ) ?? [],
                set: (record, value: { label: string; value: string }[]) => {
                    record.groupAttendees = value.map((x) => ({
                        attendeeId: (record.id as any) as DeepWriteable<any>,
                        groupId: (x.value as any) as DeepWriteable<any>,
                        id: (undefined as any) as DeepWriteable<any>,
                    }));
                },
                filterFn: (
                    rows: Array<AttendeeDescriptor>,
                    filterValue: ReadonlyArray<{ label: string; value: string }>
                ) => {
                    return filterValue.length === 0
                        ? rows
                        : rows.filter((row) => {
                              return row.groupAttendees.some((x) => filterValue.some((y) => y.value === x.groupId));
                          });
                },
                filterEl: MultiSelectColumnFilter(groupOptions),
                cell: function ContentCell(
                    props: CellProps<
                        Partial<AttendeeDescriptor>,
                        ReadonlyArray<{ label: string; value: string }> | undefined
                    >
                ) {
                    return (
                        <MultiSelect
                            name="groups"
                            options={groupOptions}
                            value={props.value ?? []}
                            placeholder="Select one or more groups"
                            onChange={(ev) => props.onChange?.(ev)}
                            onBlur={props.onBlur}
                        />
                    );
                },
            },
        ];
        return result;
    }, [allGroups?.Group]);

    const [
        insertInvitationEmailJobsMutation,
        { loading: insertInvitationEmailJobsLoading },
    ] = useInsertInvitationEmailJobsMutation();
    const [insertCustomEmailJobMutation] = useManageConferencePeoplePage_InsertCustomEmailJobMutation();
    const [sendCustomEmailAttendees, setSendCustomEmailAttendees] = useState<AttendeeDescriptor[]>([]);
    const sendCustomEmailModal = useDisclosure();

    const toast = useToast();

    const insert: Insert<AttendeeDescriptor> = useMemo(
        () => ({
            ongoing: insertAttendeeResponse.loading,
            generateDefaults: () => {
                const attendeeId = uuidv4();
                return {
                    id: attendeeId,
                    conferenceId: conference.id,
                    groupAttendees: [],
                };
            },
            makeWhole: (d) => (d.displayName !== undefined ? (d as AttendeeDescriptor) : undefined),
            start: (record) => {
                if (record.invitation?.invitedEmailAddress) {
                    insertAttendee({
                        variables: {
                            attendee: {
                                id: record.id,
                                conferenceId: conference.id,
                                displayName: record.displayName,
                                groupAttendees: {
                                    data: record.groupAttendees.map((x) => ({ groupId: x.groupId })),
                                },
                            },
                            invitation: {
                                attendeeId: record.id,
                                invitedEmailAddress: record.invitation?.invitedEmailAddress,
                            },
                        },
                        update: (cache, { data: _data }) => {
                            if (_data?.insert_Attendee_one) {
                                const data = _data.insert_Attendee_one;
                                cache.writeFragment({
                                    data,
                                    fragment: AttendeePartsFragmentDoc,
                                    fragmentName: "AttendeeParts",
                                });
                            }
                            if (_data?.insert_Invitation_one) {
                                const data = _data.insert_Invitation_one;
                                cache.writeFragment({
                                    data,
                                    fragment: InvitationPartsFragmentDoc,
                                    fragmentName: "InvitationParts",
                                });
                            }
                        },
                    });
                } else {
                    insertAttendeeWithoutInvite({
                        variables: {
                            attendee: {
                                id: record.id,
                                conferenceId: conference.id,
                                displayName: record.displayName,
                                groupAttendees: {
                                    data: record.groupAttendees.map((x) => ({ groupId: x.groupId })),
                                },
                            },
                        },
                        update: (cache, { data: _data }) => {
                            if (_data?.insert_Attendee_one) {
                                const data = _data.insert_Attendee_one;
                                cache.writeFragment({
                                    data,
                                    fragment: AttendeePartsFragmentDoc,
                                    fragmentName: "AttendeeParts",
                                });
                            }
                        },
                    });
                }
            },
        }),
        [conference.id, insertAttendee, insertAttendeeResponse.loading, insertAttendeeWithoutInvite]
    );

    const update: Update<AttendeeDescriptor> = useMemo(
        () => ({
            ongoing: updateAttendeeResponse.loading,
            start: (record) => {
                updateAttendee({
                    variables: {
                        attendeeId: record.id,
                        attendeeName: record.displayName,
                        upsertGroups: record.groupAttendees.map((x) => ({
                            groupId: x.groupId,
                            attendeeId: x.attendeeId,
                        })),
                        remainingGroupIds: record.groupAttendees.map((x) => x.groupId),
                    },
                    optimisticResponse: {
                        update_Attendee_by_pk: record,
                    },
                    update: (cache, { data: _data }) => {
                        if (_data?.update_Attendee_by_pk) {
                            const data = _data.update_Attendee_by_pk;
                            cache.writeFragment({
                                data,
                                fragment: AttendeePartsFragmentDoc,
                                fragmentName: "AttendeeParts",
                            });
                        }
                    },
                });
            },
        }),
        [updateAttendee, updateAttendeeResponse.loading]
    );

    const deleteP: Delete<AttendeeDescriptor> = useMemo(
        () => ({
            ongoing: deleteAttendeesResponse.loading,
            start: (keys) => {
                deleteAttendees({
                    variables: {
                        deleteAttendeeIds: keys,
                    },
                    update: (cache, { data: _data }) => {
                        if (_data?.delete_Attendee) {
                            const data = _data.delete_Attendee;
                            const deletedIds = data.returning.map((x) => x.id);
                            cache.modify({
                                fields: {
                                    Attendee(existingRefs: Reference[] = [], { readField }) {
                                        deletedIds.forEach((x) => {
                                            cache.evict({
                                                id: x.id,
                                                fieldName: "AttendeeParts",
                                                broadcast: true,
                                            });
                                        });
                                        return existingRefs.filter((ref) => !deletedIds.includes(readField("id", ref)));
                                    },
                                },
                            });
                        }
                    },
                });
            },
        }),
        [deleteAttendees, deleteAttendeesResponse.loading]
    );

    const buttons: ExtraButton<AttendeeDescriptor>[] = useMemo(
        () => [
            {
                render: function ImportButton(_selectedData) {
                    return (
                        <LinkButton colorScheme="green" to={`/conference/${conference.slug}/manage/import/people`}>
                            Import
                        </LinkButton>
                    );
                },
            },
            {
                render: function SendInitialInvitesButton(selectedData) {
                    return (
                        <Tooltip
                            label={
                                "Sends invitations to selected attendees who have not already been sent an invite and are members of at least one enabled group."
                            }
                        >
                            <Box>
                                <Button
                                    colorScheme="purple"
                                    isDisabled={selectedData.length === 0}
                                    isLoading={insertInvitationEmailJobsLoading}
                                    onClick={async () => {
                                        const result = await insertInvitationEmailJobsMutation({
                                            variables: {
                                                attendeeIds: selectedData.map((x) => x.id),
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
                                    }}
                                >
                                    Send initial invitations
                                </Button>
                            </Box>
                        </Tooltip>
                    );
                },
            },
            {
                render: function SendRepeatInvitesButton(selectedData) {
                    return (
                        <Tooltip
                            label={
                                "Sends repeat invitations to selected attendees who are members of at least one enabled group."
                            }
                        >
                            <Box>
                                <Button
                                    colorScheme="purple"
                                    isDisabled={selectedData.length === 0}
                                    isLoading={insertInvitationEmailJobsLoading}
                                    onClick={async () => {
                                        const result = await insertInvitationEmailJobsMutation({
                                            variables: {
                                                attendeeIds: selectedData.map((x) => x.id),
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
                                    }}
                                >
                                    Send repeat invitations
                                </Button>
                            </Box>
                        </Tooltip>
                    );
                },
            },
            {
                render: function SendCustomEmailButton(selectedData) {
                    return (
                        <Tooltip label={"Sends a custom email to all selected attendees."}>
                            <Box>
                                <Button
                                    colorScheme="purple"
                                    isDisabled={selectedData.length === 0}
                                    isLoading={insertInvitationEmailJobsLoading}
                                    onClick={async () => {
                                        if (!allAttendees?.Attendee) {
                                            return;
                                        }
                                        const attendees = Array.from(allAttendees.Attendee).filter((entry) =>
                                            selectedData.some((x) => x.id === entry.id)
                                        );
                                        setSendCustomEmailAttendees(attendees);
                                        sendCustomEmailModal.onOpen();
                                    }}
                                >
                                    Send custom email
                                </Button>
                            </Box>
                        </Tooltip>
                    );
                },
            },
        ],
        [
            allAttendees?.Attendee,
            conference.id,
            conference.slug,
            insertInvitationEmailJobsLoading,
            insertInvitationEmailJobsMutation,
            refetchAllAttendees,
            sendCustomEmailModal,
            toast,
        ]
    );

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
                Registrants
            </Heading>
            {(loadingAllGroups && !allGroups) || (loadingAllAttendees && !allAttendees?.Attendee) ? (
                <Spinner />
            ) : errorAllAttendees || errorAllGroups ? (
                <>An error occurred loading in data - please see further information in notifications.</>
            ) : (
                <></>
            )}
            <CRUDTable<AttendeeDescriptor>
                columns={columns}
                row={row}
                data={
                    !loadingAllGroups &&
                    !loadingAllAttendees &&
                    (allGroups?.Group && allAttendees?.Attendee ? data : null)
                }
                tableUniqueName="ManageConferenceRegistrants"
                alert={
                    insertAttendeeResponse.error ||
                    insertAttendeeWithoutInviteResponse.error ||
                    updateAttendeeResponse.error ||
                    deleteAttendeesResponse.error
                        ? {
                              status: "error",
                              title: "Error saving changes",
                              description:
                                  insertAttendeeResponse.error?.message ??
                                  insertAttendeeWithoutInviteResponse.error?.message ??
                                  updateAttendeeResponse.error?.message ??
                                  deleteAttendeesResponse.error?.message ??
                                  "Unknown error",
                          }
                        : undefined
                }
                insert={insert}
                update={update}
                delete={deleteP}
                buttons={buttons}
            />
            <SendEmailModal
                isOpen={sendCustomEmailModal.isOpen}
                onClose={sendCustomEmailModal.onClose}
                attendees={sendCustomEmailAttendees}
                send={async (attendeeIds: string[], htmlBody: string, subject: string) => {
                    const result = await insertCustomEmailJobMutation({
                        variables: {
                            attendeeIds,
                            conferenceId: conference.id,
                            htmlBody,
                            subject,
                        },
                    });
                    if (result?.errors && result.errors.length > 0) {
                        console.error("Failed to insert CustomEmailJob", result.errors);
                        throw new Error("Error submitting query");
                    }
                }}
            />
        </RequireAtLeastOnePermissionWrapper>
    );
}
