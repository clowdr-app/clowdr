import { gql } from "@apollo/client";
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
    Box,
    Button,
    FormLabel,
    Input,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    useColorModeValue,
    useToast,
    VStack,
} from "@chakra-ui/react";
import assert from "assert";
import React, { useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import {
    ManageContentPeople_AttendeeFragment,
    useManageContentPeople_SelectAllAttendeesQuery,
} from "../../../../generated/graphql";
import { TextColumnFilter } from "../../../CRUDTable2/CRUDComponents";
import CRUDTable, {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    RowSpecification,
    SortDirection,
} from "../../../CRUDTable2/CRUDTable2";
import { maybeCompare } from "../../../Utils/maybeSort";
import { useConference } from "../../useConference";
import type { ContentPersonDescriptor } from "./Types";

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

    query ManageContentPeople_SelectAllAttendees($conferenceId: uuid!) {
        Attendee(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ManageContentPeople_Attendee
        }
    }
`;

interface Props {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    persons: Map<string, ContentPersonDescriptor>;
    insertPerson: (person: ContentPersonDescriptor) => void;
    updatePerson: (person: ContentPersonDescriptor) => void;
    deletePerson: (personId: string) => void;
}

export default function ManagePersonsModal({
    isOpen,
    onClose,
    persons,
    insertPerson,
    updatePerson,
    deletePerson,
}: Props): JSX.Element {
    const conference = useConference();

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

    const row: RowSpecification<ContentPersonDescriptor> = useMemo(
        () => ({
            getKey: (record) => record.id,
            canSelect: (_record) => true,
            pages: {
                defaultToLast: false,
            },
        }),
        []
    );

    const columns: ColumnSpecification<ContentPersonDescriptor>[] = useMemo(
        () => [
            {
                id: "name",
                defaultSortDirection: SortDirection.Asc,
                header: function NameHeader(props: ColumnHeaderProps<ContentPersonDescriptor>) {
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
                filterFn: (rows: Array<ContentPersonDescriptor>, filterValue: string) => {
                    return rows.filter((row) => row.name.toLowerCase().includes(filterValue.toLowerCase()));
                },
                filterEl: TextColumnFilter,
                sort: (x: string | undefined, y: string | undefined) =>
                    maybeCompare(x, y, (a, b) => a.localeCompare(b)),
                cell: function ContentPersonCell(
                    props: CellProps<Partial<ContentPersonDescriptor>, string | undefined>
                ) {
                    return (
                        <Input
                            type="text"
                            value={props.value ?? ""}
                            onChange={(ev) => props.onChange?.(ev.target.value)}
                            onBlur={props.onBlur}
                            border="1px solid"
                            borderColor="rgba(255, 255, 255, 0.16)"
                        />
                    );
                },
            },
            {
                id: "affiliation",
                defaultSortDirection: SortDirection.Asc,
                header: function AffiliationHeader(props: ColumnHeaderProps<ContentPersonDescriptor>) {
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
                filterFn: (rows: Array<ContentPersonDescriptor>, filterValue: string) => {
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
                    props: CellProps<Partial<ContentPersonDescriptor>, string | undefined>
                ) {
                    return (
                        <Input
                            type="text"
                            value={props.value ?? ""}
                            onChange={(ev) => props.onChange?.(ev.target.value)}
                            onBlur={props.onBlur}
                            border="1px solid"
                            borderColor="rgba(255, 255, 255, 0.16)"
                        />
                    );
                },
            },
            {
                id: "email",
                header: function AffiliationHeader(props: ColumnHeaderProps<ContentPersonDescriptor>) {
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
                filterFn: (rows: Array<ContentPersonDescriptor>, filterValue: string) => {
                    return rows.filter((row) =>
                        row.email ? row.email.toLowerCase().includes(filterValue.toLowerCase()) : filterValue === ""
                    );
                },
                filterEl: TextColumnFilter,
                sort: (x: string | undefined, y: string | undefined) =>
                    maybeCompare(x, y, (a, b) => a.localeCompare(b)),
                cell: function ContentPersonCell(
                    props: CellProps<Partial<ContentPersonDescriptor>, string | undefined>
                ) {
                    return (
                        <Input
                            type="email"
                            value={props.value ?? ""}
                            onChange={(ev) => props.onChange?.(ev.target.value)}
                            onBlur={props.onBlur}
                            border="1px solid"
                            borderColor="rgba(255, 255, 255, 0.16)"
                        />
                    );
                },
            },
            {
                id: "Registrant",
                header: function RegistrantHeader(props: ColumnHeaderProps<ContentPersonDescriptor>) {
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
                }: CellProps<Partial<ContentPersonDescriptor>, ManageContentPeople_AttendeeFragment | undefined>) {
                    return (
                        <Select
                            value={value?.id ?? ""}
                            onChange={(ev) => onChange?.(attendees.find((x) => x.id === ev.target.value))}
                            onBlur={onBlur}
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

    const data = useMemo(() => [...persons.values()], [persons]);

    const toast = useToast();
    const autoLink = useCallback(
        (mode: "email" | "name_affiliation" | "name_only") => {
            const allUnmatched = data.filter((x) => !x.attendeeId);
            let matchCount = 0;
            for (const unmatched of allUnmatched) {
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
                    updatePerson({
                        ...unmatched,
                        attendeeId: attendee.id,
                    });
                }
            }
            const unmatchCount = allUnmatched.length - matchCount;
            toast({
                title: `Matched ${matchCount} people to registrants. Remember to save changes.`,
                description: `${unmatchCount} remain unmatched.`,
                duration: 4000,
                isClosable: true,
                position: "top",
                status: matchCount > 0 ? "success" : "info",
            });
            if (matchCount > 0) {
                onClose();
            }
        },
        [attendees, data, onClose, toast, updatePerson]
    );

    const green = useColorModeValue("green.100", "green.700");
    const greenAlt = useColorModeValue("green.200", "green.600");

    return (
        <>
            <Modal scrollBehavior="inside" onClose={onClose} isOpen={isOpen} motionPreset="scale" size="full">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader paddingBottom={0}>Manage People</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody py={4}>
                        <VStack justifyContent="flex-start" alignItems="flex-start" spacing={2}>
                            <Menu>
                                <MenuButton as={Button} rightIcon={<ChevronDownIcon />}>
                                    Auto-link registrants
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
                            <Box>
                                <CRUDTable
                                    data={data}
                                    tableUniqueName="ManageConferenceContent_ManagePeopleModal"
                                    row={row}
                                    columns={columns}
                                    insert={{
                                        ongoing: false,
                                        generateDefaults: () => ({
                                            id: uuidv4(),
                                            isNew: true,
                                        }),
                                        makeWhole: (d) => (d.name ? (d as ContentPersonDescriptor) : undefined),
                                        start: (record) => {
                                            assert(record.name);
                                            record.affiliation =
                                                record.affiliation === "" ? undefined : record.affiliation;
                                            insertPerson(record);
                                        },
                                    }}
                                    update={{
                                        ongoing: false,
                                        start: (record) => {
                                            updatePerson(record);
                                        },
                                    }}
                                    delete={{
                                        ongoing: false,
                                        start: (keys) => {
                                            keys.forEach((key) => deletePerson(key));
                                        },
                                    }}
                                />
                            </Box>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" mr={3} onClick={onClose}>
                            Done
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
