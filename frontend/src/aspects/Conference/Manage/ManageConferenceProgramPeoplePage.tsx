import { gql, Reference } from "@apollo/client";
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
    Button,
    FormLabel,
    Heading,
    Input,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Select,
    useColorModeValue,
    useToast,
} from "@chakra-ui/react";
import React, { LegacyRef, useCallback, useMemo, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    ManageContentPeople_AttendeeFragment,
    ManageContentPeople_ContentPersonFragment,
    ManageContentPeople_ContentPersonFragmentDoc,
    Permission_Enum,
    useManageContentPeople_DeleteContentPersonsMutation,
    useManageContentPeople_InsertContentPersonMutation,
    useManageContentPeople_SelectAllAttendeesQuery,
    useManageContentPeople_SelectAllPeopleQuery,
    useManageContentPeople_UpdateContentPersonMutation,
} from "../../../generated/graphql";
import { TextColumnFilter } from "../../CRUDTable2/CRUDComponents";
import CRUDTable, {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    Delete,
    Insert,
    RowSpecification,
    SortDirection,
    Update,
} from "../../CRUDTable2/CRUDTable2";
import PageNotFound from "../../Errors/PageNotFound";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { maybeCompare } from "../../Utils/maybeSort";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";

// TODO: Handle duplicate email addresses (edit/create)
// TODO: Handle duplicate name+affiliation (edit/create)

gql`
    fragment ManageContentPeople_Attendee on Attendee {
        id
        displayName
        invitation {
            id
            invitedEmailAddress
        }
        profile {
            attendeeId
            affiliation
        }
    }

    fragment ManageContentPeople_ContentPerson on ContentPerson {
        id
        conferenceId
        name
        affiliation
        email
        originatingDataId
        attendeeId
    }

    query ManageContentPeople_SelectAllPeople($conferenceId: uuid!) {
        ContentPerson(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ManageContentPeople_ContentPerson
        }
    }

    query ManageContentPeople_SelectAllAttendees($conferenceId: uuid!) {
        Attendee(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ManageContentPeople_Attendee
        }
    }

    mutation ManageContentPeople_InsertContentPerson($person: ContentPerson_insert_input!) {
        insert_ContentPerson_one(object: $person) {
            ...ManageContentPeople_ContentPerson
        }
    }

    mutation ManageContentPeople_DeleteContentPersons($ids: [uuid!] = []) {
        delete_ContentPerson(where: { id: { _in: $ids } }) {
            returning {
                id
            }
        }
    }

    mutation ManageContentPeople_UpdateContentPerson(
        $id: uuid!
        $name: String!
        $affiliation: String
        $email: String
        $attendeeId: uuid
    ) {
        update_ContentPerson_by_pk(
            pk_columns: { id: $id }
            _set: { name: $name, affiliation: $affiliation, email: $email, attendeeId: $attendeeId }
        ) {
            ...ManageContentPeople_ContentPerson
        }
    }
`;

export default function ManageConferenceProgramPeoplePage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage program people at ${conference.shortName}`);

    const { data: attendeesData } = useManageContentPeople_SelectAllAttendeesQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    const attendees = useMemo(() => (attendeesData ? [...attendeesData.Attendee] : []), [attendeesData]);
    const attendeeOptions = useMemo(() => {
        return attendees
            .sort((x, y) => x.displayName.localeCompare(y.displayName))
            .map((person) => (
                <option key={person.id} value={person.id}>
                    {person.displayName}
                    {person.profile?.affiliation ? ` (${person.profile.affiliation})` : ""}
                    {person.invitation?.invitedEmailAddress ? ` <${person.invitation.invitedEmailAddress}>` : ""}
                </option>
            ));
    }, [attendees]);
    const forceReloadRef = useRef<() => void>(() => {
        /* EMPTY */
    });

    const row: RowSpecification<ManageContentPeople_ContentPersonFragment> = useMemo(
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

    const columns: ColumnSpecification<ManageContentPeople_ContentPersonFragment>[] = useMemo(
        () => [
            {
                id: "name",
                defaultSortDirection: SortDirection.Asc,
                header: function NameHeader(props: ColumnHeaderProps<ManageContentPeople_ContentPersonFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Name</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Name{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.name,
                set: (record, value: string | undefined) => {
                    record.name = value;
                },
                filterFn: (rows: Array<ManageContentPeople_ContentPersonFragment>, filterValue: string) => {
                    return rows.filter((row) => row.name.toLowerCase().includes(filterValue.toLowerCase()));
                },
                filterEl: TextColumnFilter,
                sort: (x: string | undefined, y: string | undefined) =>
                    maybeCompare(x, y, (a, b) => a.localeCompare(b)),
                cell: function ContentPersonCell(
                    props: CellProps<Partial<ManageContentPeople_ContentPersonFragment>, string | undefined>
                ) {
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
                id: "affiliation",
                defaultSortDirection: SortDirection.Asc,
                header: function AffiliationHeader(
                    props: ColumnHeaderProps<ManageContentPeople_ContentPersonFragment>
                ) {
                    return props.isInCreate ? (
                        <FormLabel>Affiliation</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Affiliation{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.affiliation,
                set: (record, value: string | undefined) => {
                    record.affiliation = value;
                },
                filterFn: (rows: Array<ManageContentPeople_ContentPersonFragment>, filterValue: string) => {
                    return rows.filter((row) =>
                        row.affiliation
                            ? row.affiliation.toLowerCase().includes(filterValue.toLowerCase())
                            : filterValue === ""
                    );
                },
                filterEl: TextColumnFilter,
                sort: (x: string | undefined, y: string | undefined) =>
                    maybeCompare(x, y, (a, b) => a.localeCompare(b)),
                cell: function ContentPersonCell(
                    props: CellProps<Partial<ManageContentPeople_ContentPersonFragment>, string | undefined>
                ) {
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
                id: "email",
                header: function AffiliationHeader(
                    props: ColumnHeaderProps<ManageContentPeople_ContentPersonFragment>
                ) {
                    return props.isInCreate ? (
                        <FormLabel>Email</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Email{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => data.email,
                set: (record, value: string | undefined) => {
                    record.email = value;
                },
                filterFn: (rows: Array<ManageContentPeople_ContentPersonFragment>, filterValue: string) => {
                    return rows.filter((row) =>
                        row.email ? row.email.toLowerCase().includes(filterValue.toLowerCase()) : filterValue === ""
                    );
                },
                filterEl: TextColumnFilter,
                sort: (x: string | undefined, y: string | undefined) =>
                    maybeCompare(x, y, (a, b) => a.localeCompare(b)),
                cell: function ContentPersonCell(
                    props: CellProps<Partial<ManageContentPeople_ContentPersonFragment>, string | undefined>
                ) {
                    return (
                        <Input
                            type="email"
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
                id: "Registrant",
                header: function RegistrantHeader(props: ColumnHeaderProps<ManageContentPeople_ContentPersonFragment>) {
                    return props.isInCreate ? (
                        <FormLabel>Registrant</FormLabel>
                    ) : (
                        <Button size="xs" onClick={props.onClick}>
                            Registrant{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
                        </Button>
                    );
                },
                get: (data) => attendees.find((x) => x.id === data.attendeeId),
                set: (record, value: ManageContentPeople_AttendeeFragment | undefined) => {
                    record.attendeeId = value?.id;
                },
                sort: (
                    x: ManageContentPeople_AttendeeFragment | undefined,
                    y: ManageContentPeople_AttendeeFragment | undefined
                ) =>
                    x && y
                        ? x.displayName.localeCompare(y.displayName) ||
                          maybeCompare(x.profile?.affiliation, y.profile?.affiliation, (a, b) => a.localeCompare(b))
                        : x
                        ? 1
                        : y
                        ? -1
                        : 0,
                cell: function ContentPersonCell({
                    value,
                    onChange,
                    onBlur,
                    ref,
                }: CellProps<
                    Partial<ManageContentPeople_ContentPersonFragment>,
                    ManageContentPeople_AttendeeFragment | undefined
                >) {
                    return (
                        <Select
                            value={value?.id ?? ""}
                            onChange={(ev) => onChange?.(attendees.find((x) => x.id === ev.target.value))}
                            onBlur={onBlur}
                            ref={ref as LegacyRef<HTMLSelectElement>}
                        >
                            <option value="">Select a registrant</option>
                            {attendeeOptions}
                        </Select>
                    );
                },
            },
        ],
        [attendeeOptions, attendees]
    );

    const {
        loading: loadingAllContentPersons,
        error: errorAllContentPersons,
        data: allContentPersons,
        refetch,
    } = useManageContentPeople_SelectAllPeopleQuery({
        fetchPolicy: "network-only",
        variables: {
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(errorAllContentPersons, false);
    const data = useMemo(() => [...(allContentPersons?.ContentPerson ?? [])], [allContentPersons?.ContentPerson]);

    const [insertContentPerson, insertContentPersonResponse] = useManageContentPeople_InsertContentPersonMutation();
    const [deleteContentPersons, deleteContentPersonsResponse] = useManageContentPeople_DeleteContentPersonsMutation();
    const [updateContentPerson, updateContentPersonResponse] = useManageContentPeople_UpdateContentPersonMutation();

    const insert: Insert<ManageContentPeople_ContentPersonFragment> = useMemo(
        () => ({
            ongoing: insertContentPersonResponse.loading,
            generateDefaults: () => {
                const contentpersonId = uuidv4();
                return {
                    id: contentpersonId,
                    conferenceId: conference.id,
                };
            },
            makeWhole: (d) => (d.name?.length ? (d as ManageContentPeople_ContentPersonFragment) : undefined),
            start: (record) => {
                insertContentPerson({
                    variables: {
                        person: {
                            id: record.id,
                            conferenceId: conference.id,
                            affiliation: record.affiliation,
                            attendeeId: record.attendeeId,
                            email: record.email,
                            name: record.name,
                        },
                    },
                    update: (cache, { data: _data }) => {
                        if (_data?.insert_ContentPerson_one) {
                            const data = _data.insert_ContentPerson_one;
                            cache.writeFragment({
                                data,
                                fragment: ManageContentPeople_ContentPersonFragmentDoc,
                                fragmentName: "ManageContentPeople_ContentPerson",
                            });
                        }
                    },
                });
            },
        }),
        [conference.id, insertContentPerson, insertContentPersonResponse.loading]
    );

    const startUpdate = useCallback(
        async (record: ManageContentPeople_ContentPersonFragment) => {
            return updateContentPerson({
                variables: {
                    id: record.id,
                    name: record.name,
                    affiliation: record.affiliation !== "" ? record.affiliation ?? null : null,
                    attendeeId: record.attendeeId ?? null,
                    email: record.email !== "" ? record.email ?? null : null,
                },
                optimisticResponse: {
                    update_ContentPerson_by_pk: record,
                },
                update: (cache, { data: _data }) => {
                    if (_data?.update_ContentPerson_by_pk) {
                        const data = _data.update_ContentPerson_by_pk;
                        cache.writeFragment({
                            data,
                            fragment: ManageContentPeople_ContentPersonFragmentDoc,
                            fragmentName: "ManageContentPeople_ContentPerson",
                        });
                    }
                },
            });
        },
        [updateContentPerson]
    );

    const update: Update<ManageContentPeople_ContentPersonFragment> = useMemo(
        () => ({
            ongoing: updateContentPersonResponse.loading,
            start: startUpdate,
        }),
        [updateContentPersonResponse.loading, startUpdate]
    );

    const deleteP: Delete<ManageContentPeople_ContentPersonFragment> = useMemo(
        () => ({
            ongoing: deleteContentPersonsResponse.loading,
            start: (keys) => {
                deleteContentPersons({
                    variables: {
                        ids: keys,
                    },
                    update: (cache, { data: _data }) => {
                        if (_data?.delete_ContentPerson) {
                            const data = _data.delete_ContentPerson;
                            const deletedIds = data.returning.map((x) => x.id);
                            cache.modify({
                                fields: {
                                    ContentPerson(existingRefs: Reference[] = [], { readField }) {
                                        deletedIds.forEach((x) => {
                                            cache.evict({
                                                id: x.id,
                                                fieldName: "ManageContentPeople_ContentPerson",
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
        [deleteContentPersons, deleteContentPersonsResponse.loading]
    );

    const toast = useToast();
    const autoLink = useCallback(
        async (mode: "email" | "name_affiliation" | "name_only") => {
            const allUnmatched = data.filter((x) => !x.attendeeId);
            let matchCount = 0;
            await Promise.all(
                allUnmatched.map(async (unmatched) => {
                    let attendee: ManageContentPeople_AttendeeFragment | undefined;

                    switch (mode) {
                        case "email":
                            if (unmatched.email) {
                                attendee = attendees.find((x) => x.invitation?.invitedEmailAddress === unmatched.email);
                            }
                            break;
                        case "name_affiliation":
                            if (unmatched.name && unmatched.affiliation) {
                                const name = unmatched.name.toLowerCase().trim();
                                const affil = unmatched.affiliation.toLowerCase().trim();
                                attendee = attendees.find(
                                    (x) =>
                                        x.displayName.toLowerCase().trim() === name &&
                                        x.profile?.affiliation &&
                                        x.profile.affiliation.toLowerCase().trim() === affil
                                );
                            }
                            break;
                        case "name_only":
                            if (unmatched.name) {
                                const name = unmatched.name.toLowerCase().trim();
                                attendee = attendees.find((x) => x.displayName.toLowerCase().trim() === name);
                            }
                            break;
                    }

                    if (attendee) {
                        matchCount++;
                        await startUpdate({
                            ...unmatched,
                            attendeeId: attendee.id,
                        });
                    }
                })
            );

            const unmatchCount = allUnmatched.length - matchCount;
            toast({
                title: `Matched ${matchCount} people to registrants.`,
                description: `${unmatchCount} remain unmatched.`,
                duration: 4000,
                isClosable: true,
                position: "top",
                status: matchCount > 0 ? "success" : "info",
            });

            await refetch();

            setTimeout(() => {
                forceReloadRef.current();
            }, 100);
        },
        [refetch, data, toast, attendees, startUpdate]
    );

    const green = useColorModeValue("green.100", "green.700");
    const greenAlt = useColorModeValue("green.200", "green.600");
    const buttons = useMemo(
        () => [
            {
                render: function AutoLinkMenu() {
                    return (
                        <Menu>
                            <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                                Auto-link to registrants
                            </MenuButton>
                            <MenuList>
                                <MenuItem
                                    onClick={() => autoLink("email")}
                                    bgColor={green}
                                    _hover={{
                                        bgColor: greenAlt,
                                    }}
                                    _focus={{
                                        bgColor: greenAlt,
                                    }}
                                >
                                    By email (recommended)
                                </MenuItem>
                                <MenuItem onClick={() => autoLink("name_affiliation")}>
                                    By name and affiliation (usually ok)
                                </MenuItem>
                                <MenuItem onClick={() => autoLink("name_only")}>
                                    By name only (not recommended)
                                </MenuItem>
                            </MenuList>
                        </Menu>
                    );
                },
            },
        ],
        [autoLink, green, greenAlt]
    );

    const pageSizes = useMemo(() => [10, 20, 35, 50], []);

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
                Program People
            </Heading>
            {loadingAllContentPersons && !allContentPersons?.ContentPerson ? (
                <></>
            ) : errorAllContentPersons ? (
                <>An error occurred loading in data - please see further information in notifications.</>
            ) : (
                <></>
            )}
            <CRUDTable
                data={!loadingAllContentPersons && (allContentPersons?.ContentPerson ? data : null)}
                tableUniqueName="ManageConferenceProgramPeople"
                row={row}
                columns={columns}
                pageSizes={pageSizes}
                insert={insert}
                update={update}
                delete={deleteP}
                buttons={buttons}
                forceReload={forceReloadRef}
            />
        </RequireAtLeastOnePermissionWrapper>
    );
}
