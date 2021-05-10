import { gql } from "@apollo/client";
import {
    Button,
    ButtonGroup,
    chakra,
    Divider,
    FormControl,
    FormHelperText,
    FormLabel,
    Heading,
    HStack,
    ListItem,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Spinner,
    Text,
    UnorderedList,
    VStack,
} from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo, useState } from "react";
import {
    Content_ElementType_Enum,
    ManageContent_ItemFragment,
    SEoUm_ElementFragment,
    SEoUm_UploadableFragment,
    useSEoUm_InfosQuery,
} from "../../../../../../generated/graphql";
import MultiSelect from "../../../../../Chakra/MultiSelect";

gql`
    fragment SEoUM_Element on content_Element {
        id
        name
        typeName
        itemId
        item {
            id
            title
        }
    }

    fragment SEoUM_Uploadable on content_UploadableElement {
        id
        name
        typeName
        hasBeenUploaded
        uploaders {
            id
        }
        element {
            id
        }
        itemId
        itemTitle
    }

    query SEoUM_Infos($itemIds: [uuid!]!) {
        content_Element(where: { itemId: { _in: $itemIds }, uploadableId: { _is_null: true } }) {
            ...SEoUM_Element
        }
        content_UploadableElement(where: { itemId: { _in: $itemIds } }) {
            ...SEoUM_Uploadable
        }
    }
`;

export function SelectElementsOrUploadablesModal({
    isOpen,
    onClose,
    items,
    onSelect,
}: {
    isOpen: boolean;
    onClose: () => void;
    items: readonly ManageContent_ItemFragment[];
    onSelect: (
        elementIds: string[],
        uploadableIds: {
            uploadableId: string;
            elementId?: string;
        }[]
    ) => void;
}): JSX.Element {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="6xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Select elements and uploadables</ModalHeader>
                <ModalCloseButton />
                {isOpen ? <ModalInner items={items} onClose={onClose} onSelect={onSelect} /> : undefined}
            </ModalContent>
        </Modal>
    );
}

function ModalInner({
    onClose,
    items,
    onSelect,
}: {
    onClose: () => void;
    items: readonly ManageContent_ItemFragment[];
    onSelect: (
        elementIds: string[],
        uploadableIds: {
            uploadableId: string;
            elementId?: string;
        }[]
    ) => void;
}): JSX.Element {
    const itemIds = useMemo(() => items.map((x) => x.id), [items]);
    const infos = useSEoUm_InfosQuery({
        variables: {
            itemIds,
        },
    });

    const contentTypeOptions: { label: string; value: Content_ElementType_Enum }[] = useMemo(
        () =>
            Object.keys(Content_ElementType_Enum).map((key) => {
                const v = (Content_ElementType_Enum as any)[key] as string;
                return {
                    label: v
                        .split("_")
                        .map((x) => x[0] + x.substr(1).toLowerCase())
                        .reduce((acc, x) => `${acc} ${x}`),
                    value: v as Content_ElementType_Enum,
                };
            }),
        []
    );

    const [typeFilter, setTypeFilter] = useState<readonly { label: string; value: string }[]>([]);
    const typeSelect = useMemo(() => {
        return (
            <FormControl>
                <FormLabel>Filter by type</FormLabel>
                <MultiSelect options={contentTypeOptions} value={typeFilter} onChange={(vs) => setTypeFilter(vs)} />
                <FormHelperText>Leave blank to include all types.</FormHelperText>
            </FormControl>
        );
    }, [contentTypeOptions, typeFilter]);

    const nameOptions = useMemo(
        () =>
            R.uniq(
                infos.data
                    ? [
                          ...infos.data.content_Element.map((x) => x.name),
                          ...infos.data.content_UploadableElement.map((x) => x.name),
                      ]
                    : []
            ).map((x) => ({ label: x, value: x })),
        [infos.data]
    );

    const [nameFilter, setNameFilter] = useState<readonly { label: string; value: string }[]>([]);
    const nameSelect = useMemo(() => {
        return (
            <FormControl>
                <FormLabel>Filter by name</FormLabel>
                <MultiSelect options={nameOptions} value={nameFilter} onChange={(vs) => setNameFilter(vs)} />
                <FormHelperText>Leave blank to include all names.</FormHelperText>
            </FormControl>
        );
    }, [nameOptions, nameFilter]);

    const [includeUploadablesFilter, setIncludeUploadablesFilter] = useState<string>("BOTH");
    const includeUploadables = useMemo(() => {
        return (
            <FormControl>
                <FormLabel>Include elements or uploadables?</FormLabel>
                <Select
                    value={includeUploadablesFilter}
                    onChange={(ev) => {
                        setIncludeUploadablesFilter(ev.target.value);
                    }}
                >
                    <option value="BOTH">Both elements and uploadables</option>
                    <option value="ELEMENTS">Elements only</option>
                    <option value="UPLOADABLES">Uploadables only</option>
                </Select>
            </FormControl>
        );
    }, [includeUploadablesFilter]);

    const [includeUploadedFilter, setIncludeUploadedFilter] = useState<string>("BOTH");
    const includeUploaded = useMemo(() => {
        return (
            <FormControl>
                <FormLabel>Include submitted?</FormLabel>
                <Select
                    value={includeUploadedFilter}
                    onChange={(ev) => {
                        setIncludeUploadedFilter(ev.target.value);
                    }}
                    isDisabled={includeUploadablesFilter === "ELEMENTS"}
                >
                    <option value="BOTH">Uploadables with or without submission</option>
                    <option value="WITH">Only uploadables with a submission</option>
                    <option value="WITHOUT">Only uploadables without a submission</option>
                </Select>
                <FormHelperText>Include uploadables that have received a submission.</FormHelperText>
            </FormControl>
        );
    }, [includeUploadedFilter, includeUploadablesFilter]);

    const [includeUploadersFilter, setIncludeUploadersFilter] = useState<string>("BOTH");
    const includeUploaders = useMemo(() => {
        return (
            <FormControl>
                <FormLabel>Only with uploaders?</FormLabel>
                <Select
                    value={includeUploadersFilter}
                    onChange={(ev) => {
                        setIncludeUploadersFilter(ev.target.value);
                    }}
                    isDisabled={includeUploadablesFilter === "ELEMENTS"}
                >
                    <option value="BOTH">Uploadables with or without uploaders</option>
                    <option value="WITH">Only uploadables with at least one uploader</option>
                    <option value="WITHOUT">Only uploadables without any uploaders</option>
                </Select>
                <FormHelperText>Include uploadables that have at least one uploader.</FormHelperText>
            </FormControl>
        );
    }, [includeUploadersFilter, includeUploadablesFilter]);

    const filteredElements = useMemo(
        () =>
            infos.data && includeUploadablesFilter !== "UPLOADABLES"
                ? R.filter(
                      R.allPass([
                          (x) => typeFilter.length === 0 || typeFilter.some((y) => y.value === x.typeName),
                          (x) => nameFilter.length === 0 || nameFilter.some((y) => y.value === x.name),
                      ]),
                      infos.data.content_Element
                  )
                : [],
        [infos.data, includeUploadablesFilter, typeFilter, nameFilter]
    );

    const filteredUploadables = useMemo(
        () =>
            infos.data && includeUploadablesFilter !== "ELEMENTS"
                ? R.filter(
                      R.allPass([
                          (x) => typeFilter.length === 0 || typeFilter.some((y) => y.value === x.typeName),
                          (x) => nameFilter.length === 0 || nameFilter.some((y) => y.value === x.name),
                          (x) =>
                              includeUploadedFilter === "BOTH" ||
                              (includeUploadedFilter === "WITH" && x.hasBeenUploaded) ||
                              (includeUploadedFilter === "WITHOUT" && !x.hasBeenUploaded),
                          (x) =>
                              includeUploadersFilter === "BOTH" ||
                              (includeUploadersFilter === "WITH" && x.uploaders.length) ||
                              (includeUploadersFilter === "WITHOUT" && !x.uploaders.length),
                      ]),
                      infos.data.content_UploadableElement
                  )
                : [],
        [infos.data, includeUploadablesFilter, typeFilter, nameFilter, includeUploadedFilter, includeUploadersFilter]
    );

    const displayResult: (SEoUm_ElementFragment | SEoUm_UploadableFragment)[][] = useMemo(() => {
        return R.sortBy(
            (x) => ("itemTitle" in x[0] ? x[0].itemTitle ?? "" : "item" in x[0] ? x[0].item.title : ""),
            Object.values(
                R.groupBy((x) => x.itemId, [...filteredElements, ...filteredUploadables] as (
                    | SEoUm_ElementFragment
                    | SEoUm_UploadableFragment
                )[])
            )
        );
    }, [filteredElements, filteredUploadables]);

    return (
        <>
            <ModalBody>
                {infos.loading && !infos.data ? <Spinner label="Loading elements" /> : undefined}
                {infos.data ? (
                    <HStack flexWrap="wrap" alignItems="stretch" justifyContent="space-between">
                        <VStack spacing={4} flex="1 1 48%" minW={400} mb={10}>
                            <Heading as="h3" fontSize="md">
                                Filter options
                            </Heading>
                            {typeSelect}
                            {nameSelect}
                            {includeUploadables}
                            {includeUploaded}
                            {includeUploaders}
                        </VStack>
                        <Divider m={0} h="unset" orientation="vertical" />
                        <VStack spacing={4} flex="1 1 48%">
                            <Heading as="h3" fontSize="md">
                                Filtered elements &amp; uploadables
                            </Heading>
                            <Text>
                                {displayResult.length} items ({filteredElements.length + filteredUploadables.length}{" "}
                                elements &amp; uploadables)
                            </Text>
                            <UnorderedList listStyleType="none" maxH="70vh" overflow="auto">
                                {displayResult.map((elements) => (
                                    <ListItem key={elements[0].itemId} mb={2}>
                                        <chakra.span noOfLines={1}>
                                            {"itemTitle" in elements[0]
                                                ? elements[0].itemTitle
                                                : "item" in elements[0]
                                                ? elements[0].item.title
                                                : ""}
                                        </chakra.span>
                                        <UnorderedList listStylePosition="inside">
                                            {elements.map((element) => (
                                                <ListItem key={element.id}>
                                                    {element.name}
                                                    {"itemTitle" in element
                                                        ? ` (${
                                                              element.hasBeenUploaded ? "Submitted u" : "U"
                                                          }ploadable; ${element.uploaders.length} uploaders)`
                                                        : ""}
                                                </ListItem>
                                            ))}
                                        </UnorderedList>
                                    </ListItem>
                                ))}
                            </UnorderedList>
                        </VStack>
                    </HStack>
                ) : undefined}
            </ModalBody>

            <ModalFooter>
                <ButtonGroup>
                    <Button size="sm" mr={3} onClick={onClose}>
                        Close
                    </Button>
                    <Button
                        colorScheme="blue"
                        size="sm"
                        mr={3}
                        onClick={() => {
                            onSelect(
                                filteredElements.map((x) => x.id),
                                filteredUploadables.map((x) => ({
                                    uploadableId: x.id,
                                    elementId: x.element?.id,
                                }))
                            );
                        }}
                    >
                        Select
                    </Button>
                </ButtonGroup>
            </ModalFooter>
        </>
    );
}
