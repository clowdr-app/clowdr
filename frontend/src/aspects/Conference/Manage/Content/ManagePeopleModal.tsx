import {
    Box,
    Button,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
} from "@chakra-ui/react";
import assert from "assert";
import React, { useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import type { ContentPersonInfoFragment } from "../../../../generated/graphql";
import { TextColumnFilter } from "../../../CRUDTable2/CRUDComponents";
import CRUDTable, {
    CellProps,
    ColumnHeaderProps,
    ColumnSpecification,
    RowSpecification,
    SortDirection,
} from "../../../CRUDTable2/CRUDTable2";
import { maybeCompare } from "../../../Utils/maybeSort";
import type { ContentPersonDescriptor } from "./Types";

// TODO: Handle duplicate email addresses (edit/create)
// TODO: Handle duplicate name+affiliation (edit/create)

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
    // const conference = useConference();

    // TODO: Attendee options
    // const options = useMemo(() => {
    //     return [...contentPeople]
    //         .sort((x, y) => x.name.localeCompare(y.name))
    //         .map((person) => (
    //             <option key={person.id} value={person.id}>
    //                 {person.name}
    //             </option>
    //         ));
    // }, [contentPeople]);

    const row: RowSpecification<ContentPersonInfoFragment> = useMemo(
        () => ({
            getKey: (record) => record.id,
            canSelect: (_record) => true,
            pages: {
                defaultToLast: false,
            },
        }),
        []
    );

    const columns: ColumnSpecification<ContentPersonInfoFragment>[] = useMemo(
        () => [
            {
                id: "name",
                defaultSortDirection: SortDirection.Asc,
                header: function NameHeader(props: ColumnHeaderProps<ContentPersonInfoFragment>) {
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
                filterFn: (rows: Array<ContentPersonInfoFragment>, filterValue: string) => {
                    return rows.filter((row) => row.name.toLowerCase().includes(filterValue.toLowerCase()));
                },
                filterEl: TextColumnFilter,
                sort: (x: string | undefined, y: string | undefined) =>
                    maybeCompare(x, y, (a, b) => a.localeCompare(b)),
                cell: function ContentPersonCell(
                    props: CellProps<Partial<ContentPersonInfoFragment>, string | undefined>
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
                header: function AffiliationHeader(props: ColumnHeaderProps<ContentPersonInfoFragment>) {
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
                filterFn: (rows: Array<ContentPersonInfoFragment>, filterValue: string) => {
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
                    props: CellProps<Partial<ContentPersonInfoFragment>, string | undefined>
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
                header: function AffiliationHeader(props: ColumnHeaderProps<ContentPersonInfoFragment>) {
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
                filterFn: (rows: Array<ContentPersonInfoFragment>, filterValue: string) => {
                    return rows.filter((row) =>
                        row.email ? row.email.toLowerCase().includes(filterValue.toLowerCase()) : filterValue === ""
                    );
                },
                filterEl: TextColumnFilter,
                sort: (x: string | undefined, y: string | undefined) =>
                    maybeCompare(x, y, (a, b) => a.localeCompare(b)),
                cell: function ContentPersonCell(
                    props: CellProps<Partial<ContentPersonInfoFragment>, string | undefined>
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
            // {
            //     id: "Attendee",
            //     header: function AttendeeHeader(props: ColumnHeaderProps<ContentPersonInfoFragment>) {
            //         return props.isInCreate ? (
            //             <FormLabel>Attendee</FormLabel>
            //         ) : (
            //             <Button size="xs" onClick={props.onClick}>
            //                 Attendee{props.sortDir !== null ? ` ${props.sortDir}` : undefined}
            //             </Button>
            //         );
            //     },
            //     get: (data) => contentPeople.find((x) => x.id === data.personId),
            //     set: (record, value: ContentPersonInfoFragment | undefined) => {
            //         record.personId = value?.id;
            //     },
            //     sort: (x: ContentPersonInfoFragment | undefined, y: ContentPersonInfoFragment | undefined) =>
            //         x && y
            //             ? x.name.localeCompare(y.name) ||
            //               maybeCompare(x.affiliation, y.affiliation, (a, b) => a.localeCompare(b))
            //             : x
            //             ? 1
            //             : y
            //             ? -1
            //             : 0,
            //     cell: function ContentPersonCell({
            //         isInCreate,
            //         value,
            //         onChange,
            //         onBlur,
            //     }: CellProps<Partial<EventPersonInfoFragment>, ContentPersonInfoFragment | undefined>) {
            //         if (isInCreate) {
            //             return (
            //                 <HStack>
            //                     <Select
            //                         value={value?.id ?? ""}
            //                         onChange={(ev) => onChange?.(contentPeople.find((x) => x.id === ev.target.value))}
            //                         onBlur={onBlur}
            //                     >
            //                         <option value="">Select a person</option>
            //                         {options}
            //                     </Select>
            //                 </HStack>
            //             );
            //         } else {
            //             return (
            //                 <>
            //                     {value
            //                         ? `${value.name} ${value.affiliation ? `(${value.affiliation})` : ""}`
            //                         : "Person not found"}
            //                 </>
            //             );
            //         }
            //     },
            // },
        ],
        []
    );

    const data = useMemo(() => [...persons.values()], [persons]);

    return (
        <>
            <Modal scrollBehavior="inside" onClose={onClose} isOpen={isOpen} motionPreset="scale" size="full">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader paddingBottom={0}>Manage People</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
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
                                    }),
                                    makeWhole: (d) =>
                                        d.name && d.affiliation ? (d as ContentPersonInfoFragment) : undefined,
                                    start: (record) => {
                                        assert(record.name);
                                        assert(record.affiliation);
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
