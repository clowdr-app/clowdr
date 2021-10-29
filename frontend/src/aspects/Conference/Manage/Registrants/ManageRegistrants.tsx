import { ChevronDownIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    Center,
    Flex,
    FormLabel,
    Heading,
    Input,
    Menu,
    MenuButton,
    MenuGroup,
    MenuItem,
    MenuItemOption,
    MenuList,
    Text,
    Tooltip,
    useClipboard,
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import { assert } from "@midspace/assert";
import { gql } from "@urql/core";
import Papa from "papaparse";
import type { LegacyRef } from "react";
import React, { useMemo, useState } from "react";
import { useClient } from "urql";
import { v4 as uuidv4 } from "uuid";
import type {
    ManageRegistrants_SelectProfilesQuery,
    ManageRegistrants_SelectProfilesQueryVariables,
    RegistrantPartsFragment,
} from "../../../../generated/graphql";
import {
    ManageRegistrants_SelectProfilesDocument,
    useDeleteRegistrantsMutation,
    useInsertInvitationEmailJobsMutation,
    useInsertRegistrantMutation,
    useInsertRegistrantWithoutInviteMutation,
    useManagePeople_InsertCustomEmailJobMutation,
    useSelectAllGroupsQuery,
    useSelectAllRegistrantsQuery,
    useUpdateRegistrantMutation,
} from "../../../../generated/graphql";
import type { BadgeData } from "../../../Badges/ProfileBadge";
import { LinkButton } from "../../../Chakra/LinkButton";
import MultiSelect from "../../../Chakra/MultiSelect";
import { CheckBoxColumnFilter, MultiSelectColumnFilter, TextColumnFilter } from "../../../CRUDTable2/CRUDComponents";
import type {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    DeepWriteable,
    Delete,
    ExtraButton,
    Insert,
    RowSpecification,
    Update,
} from "../../../CRUDTable2/CRUDTable2";
import CRUDTable, { SortDirection } from "../../../CRUDTable2/CRUDTable2";
import PageNotFound from "../../../Errors/PageNotFound";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import { useShieldedHeaders } from "../../../GQL/useShieldedHeaders";
import { FAIcon } from "../../../Icons/FAIcon";
import { useTitle } from "../../../Utils/useTitle";
import RequireRole from "../../RequireRole";
import { useConference } from "../../useConference";
import { SendEmailModal } from "./SendEmailModal";

gql`
    fragment InvitationParts on registrant_Invitation {
        registrantId
        id
        inviteCode
        invitedEmailAddress
        linkToUserId
        createdAt
        updatedAt
        hash
    }

    fragment RegistrantParts on registrant_Registrant {
        conferenceId
        id
        conferenceRole
        invitation {
            ...InvitationParts
        }
        groupRegistrants {
            registrantId
            id
            groupId
        }
        userId
        updatedAt
        createdAt
        displayName
        inviteSent
    }

    fragment ManageRegistrants_Profile on registrant_Profile {
        registrantId
        badges
        affiliation
        country
        timezoneUTCOffset
        bio
        website
        github
        twitter
        affiliationURL
        pronouns
        photoURL_50x50
        photoURL_350x350
        hasBeenEdited
    }

    query SelectAllRegistrants($conferenceId: uuid!) {
        registrant_Registrant(where: { conferenceId: { _eq: $conferenceId } }) {
            ...RegistrantParts
        }
    }

    query ManageRegistrants_SelectProfiles($registrantIds: [uuid!]!) {
        registrant_Profile(where: { registrantId: { _in: $registrantIds } }) {
            ...ManageRegistrants_Profile
        }
    }

    mutation InsertRegistrant(
        $registrant: registrant_Registrant_insert_input!
        $invitation: registrant_Invitation_insert_input!
    ) {
        insert_registrant_Registrant_one(object: $registrant) {
            ...RegistrantParts
        }
        insert_registrant_Invitation_one(object: $invitation) {
            ...InvitationParts
        }
    }

    mutation InsertRegistrantWithoutInvite($registrant: registrant_Registrant_insert_input!) {
        insert_registrant_Registrant_one(object: $registrant) {
            ...RegistrantParts
        }
    }

    mutation DeleteRegistrants($deleteRegistrantIds: [uuid!] = []) {
        delete_registrant_Registrant(where: { id: { _in: $deleteRegistrantIds } }) {
            returning {
                id
            }
        }
    }

    mutation UpdateRegistrant(
        $registrantId: uuid!
        $registrantName: String!
        $upsertGroups: [registrant_GroupRegistrant_insert_input!]!
        $remainingGroupIds: [uuid!]
    ) {
        update_registrant_Registrant_by_pk(pk_columns: { id: $registrantId }, _set: { displayName: $registrantName }) {
            ...RegistrantParts
        }
        insert_registrant_GroupRegistrant(
            objects: $upsertGroups
            on_conflict: { constraint: GroupRegistrant_groupId_registrantId_key, update_columns: [] }
        ) {
            returning {
                id
                registrantId
                groupId
            }
        }
        delete_registrant_GroupRegistrant(
            where: { registrantId: { _eq: $registrantId }, groupId: { _nin: $remainingGroupIds } }
        ) {
            returning {
                id
            }
        }
    }

    mutation InsertInvitationEmailJobs($registrantIds: jsonb!, $conferenceId: uuid!, $sendRepeat: Boolean!) {
        insert_job_queues_InvitationEmailJob(
            objects: [{ registrantIds: $registrantIds, conferenceId: $conferenceId, sendRepeat: $sendRepeat }]
        ) {
            affected_rows
        }
    }

    mutation ManagePeople_InsertCustomEmailJob(
        $markdownBody: String!
        $subject: String!
        $conferenceId: uuid!
        $registrantIds: jsonb!
    ) {
        insert_job_queues_CustomEmailJob(
            objects: {
                markdownBody: $markdownBody
                subject: $subject
                conferenceId: $conferenceId
                registrantIds: $registrantIds
            }
        ) {
            affected_rows
        }
    }
`;

// TODO: Email validation

type RegistrantDescriptor = RegistrantPartsFragment & {
    id?: string;
    groupRegistrants?: ReadonlyArray<
        RegistrantPartsFragment["groupRegistrants"][0] & {
            id?: string;
        }
    >;
};

export default function ManageRegistrants(): JSX.Element {
    const conference = useConference();
    const { conferencePath } = useAuthParameters();
    const title = useTitle(`Manage registrants at ${conference.shortName}`);

    const context = useShieldedHeaders({
        "X-Auth-Role": "main-conference-organizer",
    });
    const [{ fetching: loadingAllGroups, error: errorAllGroups, data: allGroups }] = useSelectAllGroupsQuery({
        requestPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
        context,
    });
    useQueryErrorToast(errorAllGroups, false);

    const selectAllRegistrantsContext = useShieldedHeaders({
        "X-Auth-Role": "main-conference-organizer",
    });
    const [
        { fetching: loadingAllRegistrants, error: errorAllRegistrants, data: allRegistrants },
        refetchAllRegistrants,
    ] = useSelectAllRegistrantsQuery({
        requestPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
        context: selectAllRegistrantsContext,
    });
    useQueryErrorToast(errorAllRegistrants, false);
    const data = useMemo(
        () => [...(allRegistrants?.registrant_Registrant ?? [])],
        [allRegistrants?.registrant_Registrant]
    );

    const [insertRegistrantResponse, insertRegistrant] = useInsertRegistrantMutation();
    const [insertRegistrantWithoutInviteResponse, insertRegistrantWithoutInvite] =
        useInsertRegistrantWithoutInviteMutation();
    const [deleteRegistrantsResponse, deleteRegistrants] = useDeleteRegistrantsMutation();
    const [updateRegistrantResponse, updateRegistrant] = useUpdateRegistrantMutation();

    const row: RowSpecification<RegistrantDescriptor> = useMemo(
        () => ({
            getKey: (record) => record.id,
            canSelect: (_record) => true,
            pages: {
                defaultToLast: false,
            },
            invalid: (record) =>
                !record.displayName?.length
                    ? {
                          columnId: "name",
                          reason: "Display name required",
                      }
                    : false,
        }),
        []
    );

    const columns: ColumnSpecification<RegistrantDescriptor>[] = useMemo(() => {
        const groupOptions: { value: string; label: string }[] =
            allGroups?.registrant_Group.map((group) => ({
                value: group.id,
                label: group.name,
            })) ?? [];

        const result: ColumnSpecification<RegistrantDescriptor>[] = [
            {
                id: "name",
                defaultSortDirection: SortDirection.Asc,
                header: function NameHeader({ isInCreate, onClick, sortDir }: ColumnHeaderProps<RegistrantDescriptor>) {
                    return isInCreate ? (
                        <FormLabel>Name</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Name{sortDir !== null ? ` ${sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.displayName,
                set: (record, value: string) => {
                    record.displayName = value;
                },
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows: Array<RegistrantDescriptor>, filterValue: string) => {
                    if (filterValue === "") {
                        return rows.filter((row) => (row.displayName ?? "") === "");
                    } else {
                        return rows.filter((row) => row.displayName.toLowerCase().includes(filterValue.toLowerCase()));
                    }
                },
                filterEl: TextColumnFilter,
                cell: function NameCell({ value, onChange, onBlur, ref }: CellProps<Partial<RegistrantDescriptor>>) {
                    const { onCopy, hasCopied } = useClipboard(value ?? "");
                    return (
                        <Flex alignItems="center">
                            <Input
                                type="text"
                                value={value ?? ""}
                                onChange={(ev) => onChange?.(ev.target.value)}
                                onBlur={onBlur}
                                border="1px solid"
                                borderColor="rgba(255, 255, 255, 0.16)"
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
            {
                id: "inviteSent",
                header: function NameHeader({ isInCreate, onClick, sortDir }: ColumnHeaderProps<RegistrantDescriptor>) {
                    if (isInCreate) {
                        return undefined;
                    } else {
                        return (
                            <Button size="xs" onClick={onClick}>
                                Invite sent?{sortDir !== null ? ` ${sortDir}` : undefined}
                            </Button>
                        );
                    }
                },
                get: (data) => data.inviteSent,
                sort: (x: boolean, y: boolean) => (x && y ? 0 : x ? -1 : y ? 1 : 0),
                filterFn: (rows: Array<RegistrantDescriptor>, filterValue: boolean) => {
                    return rows.filter((row) => row.inviteSent === filterValue);
                },
                filterEl: CheckBoxColumnFilter,
                cell: function InviteSentCell({
                    isInCreate,
                    value,
                }: CellProps<Partial<RegistrantDescriptor>, boolean>) {
                    if (isInCreate) {
                        return undefined;
                    } else {
                        return (
                            <Center>
                                <FAIcon iconStyle="s" icon={value ? "check" : "times"} />
                            </Center>
                        );
                    }
                },
            },
            {
                id: "inviteAccepted",
                header: function NameHeader({ isInCreate, onClick, sortDir }: ColumnHeaderProps<RegistrantDescriptor>) {
                    if (isInCreate) {
                        return undefined;
                    } else {
                        return (
                            <Button size="xs" onClick={onClick}>
                                Invite accepted?{sortDir !== null ? ` ${sortDir}` : undefined}
                            </Button>
                        );
                    }
                },
                get: (data) => !!data.userId,
                sort: (x: boolean, y: boolean) => (x && y ? 0 : x ? -1 : y ? 1 : 0),
                filterFn: (rows: Array<RegistrantDescriptor>, filterValue: boolean) => {
                    return rows.filter((row) => !!row.userId === filterValue);
                },
                filterEl: CheckBoxColumnFilter,
                cell: function InviteSentCell({
                    isInCreate,
                    value,
                }: CellProps<Partial<RegistrantDescriptor>, boolean>) {
                    if (isInCreate) {
                        return undefined;
                    } else {
                        return (
                            <Center>
                                <FAIcon iconStyle="s" icon={value ? "check" : "times"} />
                            </Center>
                        );
                    }
                },
            },
            {
                id: "invitedEmailAddress",
                header: function NameHeader({ isInCreate, onClick, sortDir }: ColumnHeaderProps<RegistrantDescriptor>) {
                    return isInCreate ? (
                        <FormLabel>Invitation address</FormLabel>
                    ) : (
                        <Button size="xs" onClick={onClick}>
                            Invitation address{sortDir !== null ? ` ${sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.invitation?.invitedEmailAddress ?? "",
                set: (record, value: string) => {
                    if (!record.invitation) {
                        assert.truthy(record.id);
                        record.invitation = {
                            registrantId: record.id as DeepWriteable<any>,
                            createdAt: new Date().toISOString() as any as DeepWriteable<any>,
                            updatedAt: new Date().toISOString() as any as DeepWriteable<any>,
                            invitedEmailAddress: value,
                            inviteCode: "" as any as DeepWriteable<any>,
                            id: "" as any as DeepWriteable<any>,
                        };
                    } else {
                        record.invitation.invitedEmailAddress = value;
                    }
                },
                sort: (x: string, y: string) => x.localeCompare(y),
                filterFn: (rows: Array<RegistrantDescriptor>, filterValue: string) => {
                    if (filterValue === "") {
                        return rows.filter((row) => (row.invitation?.invitedEmailAddress ?? "") === "");
                    } else {
                        return rows.filter((row) =>
                            row.invitation?.invitedEmailAddress?.toLowerCase().includes(filterValue.toLowerCase())
                        );
                    }
                },
                filterEl: TextColumnFilter,
                cell: function InvitedEmailAddressCell({
                    isInCreate,
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<Partial<RegistrantDescriptor>>) {
                    const { onCopy, hasCopied } = useClipboard(value ?? "");
                    if (isInCreate) {
                        return (
                            <Input
                                type="email"
                                value={value ?? ""}
                                onChange={(ev) => onChange?.(ev.target.value)}
                                onBlur={onBlur}
                                border="1px solid"
                                borderColor="rgba(255, 255, 255, 0.16)"
                                ref={ref as LegacyRef<HTMLInputElement>}
                            />
                        );
                    } else {
                        return (
                            <Flex alignItems="center">
                                <Text px={2}>{value}</Text>
                                {value ? (
                                    <Button onClick={onCopy} size="xs" ml="auto">
                                        <FAIcon iconStyle="s" icon={hasCopied ? "check-circle" : "clipboard"} />
                                    </Button>
                                ) : undefined}
                            </Flex>
                        );
                    }
                },
            },
            {
                id: "inviteCode",
                header: function NameHeader({ isInCreate }: ColumnHeaderProps<RegistrantDescriptor>) {
                    if (isInCreate) {
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
                filterFn: (rows: Array<RegistrantDescriptor>, filterValue: string) => {
                    if (filterValue === "") {
                        return rows.filter((row) => (row.invitation?.inviteCode ?? "") === "");
                    } else {
                        return rows.filter(
                            (row) =>
                                !!row.invitation?.inviteCode &&
                                row.invitation?.inviteCode.toLowerCase().includes(filterValue.toLowerCase())
                        );
                    }
                },
                filterEl: TextColumnFilter,
                cell: function InviteCodeCell({ isInCreate, value }: CellProps<Partial<RegistrantDescriptor>>) {
                    const { onCopy, hasCopied } = useClipboard(value ?? "");
                    if (isInCreate) {
                        return undefined;
                    } else {
                        return (
                            <Flex alignItems="center">
                                <Text fontFamily="monospace" px={2}>
                                    {value}
                                </Text>
                                {value ? (
                                    <Button onClick={onCopy} size="xs" ml="auto">
                                        <FAIcon iconStyle="s" icon={hasCopied ? "check-circle" : "clipboard"} />
                                    </Button>
                                ) : undefined}
                            </Flex>
                        );
                    }
                },
            },
            {
                id: "groups",
                header: function ContentHeader({ isInCreate }: ColumnHeaderProps<RegistrantDescriptor>) {
                    return isInCreate ? (
                        <FormLabel>Groups</FormLabel>
                    ) : (
                        <Text size="xs" p={1} textAlign="center" textTransform="none" fontWeight="normal">
                            Groups
                        </Text>
                    );
                },
                get: (data) =>
                    data.groupRegistrants?.map(
                        (ga) =>
                            groupOptions.find((group) => group.value === ga.groupId) ?? {
                                label: "<Unknown>",
                                value: ga.groupId,
                            }
                    ) ?? [],
                set: (record, value: { label: string; value: string }[]) => {
                    record.groupRegistrants = value.map((x) => ({
                        registrantId: record.id as any as DeepWriteable<any>,
                        groupId: x.value as any as DeepWriteable<any>,
                        id: undefined as any as DeepWriteable<any>,
                    }));
                },
                filterFn: (
                    rows: Array<RegistrantDescriptor>,
                    filterValue: ReadonlyArray<{ label: string; value: string }>
                ) => {
                    return filterValue.length === 0
                        ? rows
                        : rows.filter((row) => {
                              return row.groupRegistrants.some((x) => filterValue.some((y) => y.value === x.groupId));
                          });
                },
                filterEl: MultiSelectColumnFilter(groupOptions),
                cell: function ContentCell({
                    value,
                    onChange,
                    onBlur,
                }: CellProps<
                    Partial<RegistrantDescriptor>,
                    ReadonlyArray<{ label: string; value: string }> | undefined
                >) {
                    return (
                        <MultiSelect
                            name="groups"
                            options={groupOptions}
                            value={value ?? []}
                            placeholder="Select one or more groups"
                            onChange={(ev) => onChange?.(ev)}
                            onBlur={onBlur}
                            styles={{ container: (base) => ({ ...base, maxWidth: 450 }) }}
                        />
                    );
                },
            },
        ];
        return result;
    }, [allGroups?.registrant_Group]);

    const [{ fetching: insertInvitationEmailJobsLoading }, insertInvitationEmailJobsMutation] =
        useInsertInvitationEmailJobsMutation();
    const [, insertCustomEmailJobMutation] = useManagePeople_InsertCustomEmailJobMutation();
    const [sendCustomEmailRegistrants, setSendCustomEmailRegistrants] = useState<RegistrantDescriptor[]>([]);
    const sendCustomEmailModal = useDisclosure();

    const toast = useToast();

    const insert: Insert<RegistrantDescriptor> = useMemo(
        () => ({
            ongoing: insertRegistrantResponse.fetching,
            generateDefaults: () => {
                const registrantId = uuidv4();
                return {
                    id: registrantId,
                    conferenceId: conference.id,
                    groupRegistrants: [],
                };
            },
            makeWhole: (d) => (d.displayName?.length ? (d as RegistrantDescriptor) : undefined),
            start: (record) => {
                if (record.invitation?.invitedEmailAddress) {
                    insertRegistrant(
                        {
                            registrant: {
                                id: record.id,
                                conferenceId: conference.id,
                                displayName: record.displayName,
                                groupRegistrants: {
                                    data: record.groupRegistrants.map((x) => ({ groupId: x.groupId })),
                                },
                            },
                            invitation: {
                                registrantId: record.id,
                                invitedEmailAddress: record.invitation?.invitedEmailAddress,
                            },
                        },
                        {
                            fetchOptions: {
                                headers: {
                                    "X-Auth-Role": "main-conference-organizer",
                                },
                            },
                        }
                    );
                } else {
                    insertRegistrantWithoutInvite(
                        {
                            registrant: {
                                id: record.id,
                                conferenceId: conference.id,
                                displayName: record.displayName,
                                groupRegistrants: {
                                    data: record.groupRegistrants.map((x) => ({ groupId: x.groupId })),
                                },
                            },
                        },
                        {
                            fetchOptions: {
                                headers: {
                                    "X-Auth-Role": "main-conference-organizer",
                                },
                            },
                        }
                    );
                }
            },
        }),
        [conference.id, insertRegistrant, insertRegistrantResponse.fetching, insertRegistrantWithoutInvite]
    );

    const update: Update<RegistrantDescriptor> = useMemo(
        () => ({
            ongoing: updateRegistrantResponse.fetching,
            start: (record) => {
                updateRegistrant(
                    {
                        registrantId: record.id,
                        registrantName: record.displayName,
                        upsertGroups: record.groupRegistrants.map((x) => ({
                            groupId: x.groupId,
                            registrantId: x.registrantId,
                        })),
                        remainingGroupIds: record.groupRegistrants.map((x) => x.groupId),
                    },
                    {
                        fetchOptions: {
                            headers: {
                                "X-Auth-Role": "main-conference-organizer",
                            },
                        },
                    }
                );
            },
        }),
        [updateRegistrant, updateRegistrantResponse.fetching]
    );

    const deleteP: Delete<RegistrantDescriptor> = useMemo(
        () => ({
            ongoing: deleteRegistrantsResponse.fetching,
            start: (keys) => {
                deleteRegistrants(
                    {
                        deleteRegistrantIds: keys,
                    },
                    {
                        fetchOptions: {
                            headers: {
                                "X-Auth-Role": "main-conference-organizer",
                            },
                        },
                    }
                );
            },
        }),
        [deleteRegistrants, deleteRegistrantsResponse.fetching]
    );

    const [exportWithProfileData, setExportWithProfileData] = useState<boolean>(false);
    const client = useClient();
    const buttons: ExtraButton<RegistrantDescriptor>[] = useMemo(
        () => [
            {
                render: function ImportButton(_selectedData) {
                    return (
                        <LinkButton colorScheme="purple" to={`${conferencePath}/manage/import/registrants`}>
                            Import
                        </LinkButton>
                    );
                },
            },
            {
                render: ({ selectedData }: { selectedData: RegistrantDescriptor[] }) => {
                    async function doExport(dataToExport: RegistrantDescriptor[]) {
                        const profiles = exportWithProfileData
                            ? (
                                  await client
                                      .query<
                                          ManageRegistrants_SelectProfilesQuery,
                                          ManageRegistrants_SelectProfilesQueryVariables
                                      >(
                                          ManageRegistrants_SelectProfilesDocument,
                                          {
                                              registrantIds: dataToExport.map((x) => x.id),
                                          },
                                          {
                                              fetchOptions: {
                                                  headers: {
                                                      "X-Auth-Role": "main-conference-organizer",
                                                  },
                                              },
                                          }
                                      )
                                      .toPromise()
                              ).data?.registrant_Profile ?? []
                            : [];

                        const csvText = Papa.unparse(
                            dataToExport.map((registrant) => {
                                const result: any = {
                                    "Conference Id": registrant.conferenceId,
                                    "Registrant Id": registrant.id,
                                    "User Id": registrant.userId,
                                    Name: registrant.displayName,
                                    Email: registrant.invitation?.invitedEmailAddress ?? "",
                                    "Invite code": registrant.invitation?.inviteCode ?? "",
                                    "Invite sent": registrant.inviteSent ? "Yes" : "No",
                                    "Invite accepted": registrant.userId ? "Yes" : "No",
                                    "Group Ids": registrant.groupRegistrants.map((x) => x.groupId),
                                    "Group Names": registrant.groupRegistrants.map(
                                        (x) =>
                                            allGroups?.registrant_Group.find((g) => g.id === x.groupId)?.name ??
                                            "<Hidden>"
                                    ),
                                    "Created At": registrant.createdAt,
                                    "Updated At": registrant.updatedAt,
                                };

                                if (exportWithProfileData) {
                                    const profile = profiles.find((x) => x.registrantId === registrant.id);
                                    result["Profile Data Exportable"] = profile ? "Yes" : "No";
                                    result["Has Been Edited"] = profile ? (profile.hasBeenEdited ? "Yes" : "No") : "";
                                    result.Badges =
                                        profile?.badges?.map((badge: BadgeData) => `${badge.name} [${badge.colour}]`) ??
                                        "";
                                    result.Affiliation = profile?.affiliation ?? "";
                                    result.Country = profile?.country ?? "";
                                    result["Timezone UTC Offset"] = profile?.timezoneUTCOffset ?? "";
                                    result["Bio (Markdown)"] = profile?.bio ?? "";
                                    result.Website = profile?.website ?? "";
                                    result.GitHub = profile?.github ?? "";
                                    result.Twitter = profile?.twitter ?? "";
                                    result["Affiliation URL"] = profile?.affiliationURL ?? "";
                                    result.Pronouns = profile?.pronouns ?? "";
                                    result["Photo URL - 50px by 50px"] = profile?.photoURL_50x50 ?? "";
                                    result["Photo URL - 350px by 350px"] = profile?.photoURL_350x350 ?? "";
                                }

                                return result;
                            }),
                            {
                                columns: [
                                    "Conference Id",
                                    "Registrant Id",
                                    "User Id",
                                    "Name",
                                    "Email",
                                    "Invite code",
                                    "Invite sent",
                                    "Invite accepted",
                                    "Group Ids",
                                    "Group Names",
                                    "Created At",
                                    "Updated At",
                                    "Profile Data Exportable",
                                    "Has Been Edited",
                                    "Badges",
                                    "Affiliation",
                                    "Country",
                                    "Timezone UTC Offset",
                                    "Bio (Markdown)",
                                    "Website",
                                    "GitHub",
                                    "Twitter",
                                    "Affiliation URL",
                                    "Pronouns",
                                    "Photo URL - 50px by 50px",
                                    "Photo URL - 350px by 350px",
                                ],
                            }
                        );

                        const csvData = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
                        let csvURL: string | null = null;
                        const now = new Date();
                        const fileName = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${now
                            .getDate()
                            .toString()
                            .padStart(2, "0")}T${now.getHours().toString().padStart(2, "0")}-${now
                            .getMinutes()
                            .toString()
                            .padStart(2, "0")} - Midspace Registrants.csv`;

                        csvURL = window.URL.createObjectURL(csvData);

                        const tempLink = document.createElement("a");
                        tempLink.href = csvURL ?? "";
                        tempLink.setAttribute("download", fileName);
                        tempLink.click();
                    }

                    const tooltip = (filler: string) => `Exports the name, email and groups of ${filler}.`;
                    if (selectedData.length === 0) {
                        return (
                            <Menu>
                                <Tooltip label={tooltip("all registrants (from a chosen group)")}>
                                    <MenuButton as={Button} colorScheme="purple" rightIcon={<ChevronDownIcon />}>
                                        Export
                                    </MenuButton>
                                </Tooltip>
                                <MenuList>
                                    <MenuItemOption
                                        closeOnSelect={false}
                                        isChecked={exportWithProfileData}
                                        onClick={() => {
                                            setExportWithProfileData(!exportWithProfileData);
                                        }}
                                    >
                                        With profile data
                                    </MenuItemOption>
                                    <MenuItem
                                        onClick={() => {
                                            doExport(data);
                                        }}
                                    >
                                        All
                                    </MenuItem>
                                    {allGroups?.registrant_Group.length ? (
                                        <MenuGroup title="Groups">
                                            {allGroups.registrant_Group.map((group) => (
                                                <MenuItem
                                                    key={group.id}
                                                    onClick={() => {
                                                        doExport(
                                                            data.filter((a) =>
                                                                a.groupRegistrants.some((ga) => ga.groupId === group.id)
                                                            )
                                                        );
                                                    }}
                                                >
                                                    {group.name}
                                                </MenuItem>
                                            ))}
                                        </MenuGroup>
                                    ) : (
                                        <Text px={2}>No groups.</Text>
                                    )}
                                </MenuList>
                            </Menu>
                        );
                    } else {
                        return (
                            <Tooltip label={tooltip("selected registrants")}>
                                <Box>
                                    <Button
                                        colorScheme="purple"
                                        isDisabled={selectedData.length === 0}
                                        onClick={() => doExport(selectedData)}
                                    >
                                        Export
                                    </Button>
                                </Box>
                            </Tooltip>
                        );
                    }
                },
            },
            {
                render: function SendInitialInvitesButton({ selectedData }: { selectedData: RegistrantDescriptor[] }) {
                    const tooltip = (filler: string) =>
                        `Sends invitations to ${filler} who have not already been sent an invite.`;
                    if (selectedData.length === 0) {
                        return (
                            <Menu>
                                <Tooltip label={tooltip("all registrants (from a group)")}>
                                    <MenuButton as={Button} colorScheme="purple" rightIcon={<ChevronDownIcon />}>
                                        Send initial invitations
                                    </MenuButton>
                                </Tooltip>
                                <MenuList>
                                    {allGroups?.registrant_Group.length ? (
                                        <MenuGroup title="Groups">
                                            {allGroups?.registrant_Group.map((group) => (
                                                <MenuItem
                                                    key={group.id}
                                                    onClick={async () => {
                                                        const result = await insertInvitationEmailJobsMutation(
                                                            {
                                                                registrantIds: data
                                                                    .filter((a) =>
                                                                        a.groupRegistrants.some(
                                                                            (ga) => ga.groupId === group.id
                                                                        )
                                                                    )
                                                                    .map((a) => a.id),
                                                                conferenceId: conference.id,
                                                                sendRepeat: false,
                                                            },
                                                            {
                                                                fetchOptions: {
                                                                    headers: {
                                                                        "X-Auth-Role": "organizer",
                                                                    },
                                                                },
                                                            }
                                                        );
                                                        if (result.error) {
                                                            toast({
                                                                title: "Failed to send invitation emails",
                                                                description: result.error.message,
                                                                isClosable: true,
                                                                status: "error",
                                                            });
                                                        } else {
                                                            toast({
                                                                title: "Invitation emails sent",
                                                                duration: 8000,
                                                                status: "success",
                                                            });
                                                        }

                                                        refetchAllRegistrants();
                                                    }}
                                                >
                                                    {group.name}
                                                </MenuItem>
                                            ))}
                                        </MenuGroup>
                                    ) : (
                                        <Text px={2}>No groups.</Text>
                                    )}
                                </MenuList>
                            </Menu>
                        );
                    } else {
                        return (
                            <Tooltip label={tooltip("selected registrants")}>
                                <Box>
                                    <Button
                                        colorScheme="purple"
                                        isDisabled={selectedData.length === 0}
                                        isLoading={insertInvitationEmailJobsLoading}
                                        onClick={async () => {
                                            const result = await insertInvitationEmailJobsMutation(
                                                {
                                                    registrantIds: selectedData.map((x) => x.id),
                                                    conferenceId: conference.id,
                                                    sendRepeat: false,
                                                },
                                                {
                                                    fetchOptions: {
                                                        headers: {
                                                            "X-Auth-Role": "organizer",
                                                        },
                                                    },
                                                }
                                            );
                                            if (result.error) {
                                                toast({
                                                    title: "Failed to send invitation emails",
                                                    description: result.error.message,
                                                    isClosable: true,
                                                    status: "error",
                                                });
                                            } else {
                                                toast({
                                                    title: "Invitation emails sent",
                                                    duration: 8000,
                                                    status: "success",
                                                });
                                            }

                                            refetchAllRegistrants();
                                        }}
                                    >
                                        Send initial invitations
                                    </Button>
                                </Box>
                            </Tooltip>
                        );
                    }
                },
            },
            {
                render: function SendRepeatInvitesButton({ selectedData }: { selectedData: RegistrantDescriptor[] }) {
                    const tooltip = (filler: string) => `Sends repeat invitations to ${filler}.`;
                    if (selectedData.length === 0) {
                        return (
                            <Menu>
                                <Tooltip label={tooltip("all registrants (from a group)")}>
                                    <MenuButton as={Button} colorScheme="purple" rightIcon={<ChevronDownIcon />}>
                                        Send repeat invitations
                                    </MenuButton>
                                </Tooltip>
                                <MenuList>
                                    {allGroups?.registrant_Group.length ? (
                                        <MenuGroup title="Groups">
                                            {allGroups.registrant_Group.map((group) => (
                                                <MenuItem
                                                    key={group.id}
                                                    onClick={async () => {
                                                        const result = await insertInvitationEmailJobsMutation(
                                                            {
                                                                registrantIds: data
                                                                    .filter((a) =>
                                                                        a.groupRegistrants.some(
                                                                            (ga) => ga.groupId === group.id
                                                                        )
                                                                    )
                                                                    .map((a) => a.id),
                                                                conferenceId: conference.id,
                                                                sendRepeat: true,
                                                            },
                                                            {
                                                                fetchOptions: {
                                                                    headers: {
                                                                        "X-Auth-Role": "organizer",
                                                                    },
                                                                },
                                                            }
                                                        );
                                                        if (result.error) {
                                                            toast({
                                                                title: "Failed to send invitation emails",
                                                                description: result.error.message,
                                                                isClosable: true,
                                                                status: "error",
                                                            });
                                                        } else {
                                                            toast({
                                                                title: "Invitation emails sent",
                                                                duration: 8000,
                                                                status: "success",
                                                            });
                                                        }

                                                        refetchAllRegistrants();
                                                    }}
                                                >
                                                    {group.name}
                                                </MenuItem>
                                            ))}
                                        </MenuGroup>
                                    ) : (
                                        <Text px={2}>No groups.</Text>
                                    )}
                                </MenuList>
                            </Menu>
                        );
                    } else {
                        return (
                            <Tooltip label={tooltip("selected registrants")}>
                                <Box>
                                    <Button
                                        colorScheme="purple"
                                        isDisabled={selectedData.length === 0}
                                        isLoading={insertInvitationEmailJobsLoading}
                                        onClick={async () => {
                                            const result = await insertInvitationEmailJobsMutation(
                                                {
                                                    registrantIds: selectedData.map((x) => x.id),
                                                    conferenceId: conference.id,
                                                    sendRepeat: true,
                                                },
                                                {
                                                    fetchOptions: {
                                                        headers: {
                                                            "X-Auth-Role": "organizer",
                                                        },
                                                    },
                                                }
                                            );
                                            if (result.error) {
                                                toast({
                                                    title: "Failed to send invitation emails",
                                                    description: result.error.message,
                                                    isClosable: true,
                                                    status: "error",
                                                });
                                            } else {
                                                toast({
                                                    title: "Invitation emails sent",
                                                    duration: 8000,
                                                    status: "success",
                                                });
                                            }

                                            refetchAllRegistrants();
                                        }}
                                    >
                                        Send repeat invitations
                                    </Button>
                                </Box>
                            </Tooltip>
                        );
                    }
                },
            },
            {
                render: function SendCustomEmailButton({ selectedData }: { selectedData: RegistrantDescriptor[] }) {
                    const tooltip = (filler: string) => `Sends a custom email to ${filler}.`;
                    if (selectedData.length === 0) {
                        return (
                            <Menu>
                                {/*<Tooltip label={tooltip("all registrants (from a group)")}>*/}
                                <MenuButton as={Button} colorScheme="purple" rightIcon={<ChevronDownIcon />}>
                                    Send custom email
                                </MenuButton>
                                {/*</Tooltip>*/}
                                <MenuList>
                                    {allGroups?.registrant_Group.length ? (
                                        <MenuGroup title="Groups">
                                            {allGroups.registrant_Group.map((group) => (
                                                <MenuItem
                                                    key={group.id}
                                                    onClick={() => {
                                                        setSendCustomEmailRegistrants(
                                                            data.filter((a) =>
                                                                a.groupRegistrants.some((ga) => ga.groupId === group.id)
                                                            )
                                                        );
                                                        sendCustomEmailModal.onOpen();
                                                    }}
                                                >
                                                    {group.name}
                                                </MenuItem>
                                            ))}
                                        </MenuGroup>
                                    ) : (
                                        <Text px={2}>No groups.</Text>
                                    )}
                                </MenuList>
                            </Menu>
                        );
                    } else {
                        return (
                            <Tooltip label={tooltip("selected registrants")}>
                                <Box>
                                    <Button
                                        colorScheme="purple"
                                        isDisabled={selectedData.length === 0}
                                        onClick={async () => {
                                            setSendCustomEmailRegistrants(selectedData);
                                            sendCustomEmailModal.onOpen();
                                        }}
                                    >
                                        Send custom email
                                    </Button>
                                </Box>
                            </Tooltip>
                        );
                    }
                },
            },
        ],
        [
            conferencePath,
            exportWithProfileData,
            client,
            allGroups?.registrant_Group,
            data,
            insertInvitationEmailJobsMutation,
            conference.id,
            refetchAllRegistrants,
            toast,
            insertInvitationEmailJobsLoading,
            sendCustomEmailModal,
        ]
    );

    return (
        <RequireRole organizerRole componentIfDenied={<PageNotFound />}>
            {title}
            <Heading mt={4} as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading id="page-heading" as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Registrants
            </Heading>
            {(loadingAllGroups && !allGroups) || (loadingAllRegistrants && !allRegistrants?.registrant_Registrant) ? (
                <></>
            ) : errorAllRegistrants || errorAllGroups ? (
                <>An error occurred loading in data - please see further information in notifications.</>
            ) : (
                <></>
            )}
            <CRUDTable<RegistrantDescriptor>
                columns={columns}
                row={row}
                data={
                    !loadingAllGroups &&
                    !loadingAllRegistrants &&
                    (allGroups?.registrant_Group && allRegistrants?.registrant_Registrant ? data : null)
                }
                tableUniqueName="ManageConferenceRegistrants"
                alert={
                    insertRegistrantResponse.error ||
                    insertRegistrantWithoutInviteResponse.error ||
                    updateRegistrantResponse.error ||
                    deleteRegistrantsResponse.error
                        ? {
                              status: "error",
                              title: "Error saving changes",
                              description:
                                  insertRegistrantResponse.error?.message ??
                                  insertRegistrantWithoutInviteResponse.error?.message ??
                                  updateRegistrantResponse.error?.message ??
                                  deleteRegistrantsResponse.error?.message ??
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
                registrants={sendCustomEmailRegistrants}
                send={async (registrantIds: string[], markdownBody: string, subject: string) => {
                    const result = await insertCustomEmailJobMutation(
                        {
                            registrantIds,
                            conferenceId: conference.id,
                            markdownBody,
                            subject,
                        },
                        {
                            fetchOptions: {
                                headers: {
                                    "X-Auth-Role": "organizer",
                                },
                            },
                        }
                    );
                    if (result?.error) {
                        console.error("Failed to insert CustomEmailJob", result.error);
                        throw new Error("Error submitting query");
                    }
                }}
            />
        </RequireRole>
    );
}
