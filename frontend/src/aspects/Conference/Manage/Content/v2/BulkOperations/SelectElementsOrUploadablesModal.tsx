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
    Input,
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
    restrictToTypes,
}: {
    isOpen: boolean;
    onClose: () => void;
    items: readonly ManageContent_ItemFragment[];
    onSelect: (
        elementsByItem: {
            itemId: string;
            elementIds: string[];
            uploadables: {
                uploadableId: string;
                elementId?: string;
            }[];
        }[]
    ) => void;
    restrictToTypes: Content_ElementType_Enum[] | null;
}): JSX.Element {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="6xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Select elements and uploadables</ModalHeader>
                <ModalCloseButton />
                {isOpen ? (
                    <ModalInner items={items} onClose={onClose} onSelect={onSelect} restrictToTypes={restrictToTypes} />
                ) : undefined}
            </ModalContent>
        </Modal>
    );
}

function ModalInner({
    onClose,
    items,
    onSelect,
    restrictToTypes,
}: {
    onClose: () => void;
    items: readonly ManageContent_ItemFragment[];
    onSelect: (
        elementsByItem: {
            itemId: string;
            elementIds: string[];
            uploadables: {
                uploadableId: string;
                elementId?: string;
            }[];
        }[]
    ) => void;
    restrictToTypes: Content_ElementType_Enum[] | null;
}): JSX.Element {
    const itemIds = useMemo(() => items.map((x) => x.id), [items]);
    const infos = useSEoUm_InfosQuery({
        variables: {
            itemIds,
        },
    });

    const contentTypeOptions: { label: string; value: Content_ElementType_Enum }[] = useMemo(
        () =>
            Object.keys(Content_ElementType_Enum).reduce((acc, key) => {
                const v = (Content_ElementType_Enum as any)[key] as Content_ElementType_Enum;
                if (restrictToTypes === null || restrictToTypes.includes(v)) {
                    acc.push({
                        label: v
                            .split("_")
                            .map((x) => x[0] + x.substr(1).toLowerCase())
                            .reduce((acc, x) => `${acc} ${x}`),
                        value: v as Content_ElementType_Enum,
                    });
                }
                return acc;
            }, [] as { label: string; value: Content_ElementType_Enum }[]),
        [restrictToTypes]
    );

    const [typeFilter, setTypeFilter] = useState<readonly { label: string; value: string }[]>([]);
    const typeSelect = useMemo(() => {
        return (
            <FormControl>
                <FormLabel>Filter by element type</FormLabel>
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

    const [titleFilter, setTitleFilter] = useState<string>("");
    const titleInput = useMemo(() => {
        return (
            <FormControl>
                <FormLabel>Filter by item title</FormLabel>
                <Input value={titleFilter} onChange={(ev) => setTitleFilter(ev.target.value)} />
                <FormHelperText>Leave blank to include all titles.</FormHelperText>
            </FormControl>
        );
    }, [titleFilter]);

    const [nameFilter, setNameFilter] = useState<readonly { label: string; value: string }[]>([]);
    const nameSelect = useMemo(() => {
        return (
            <FormControl>
                <FormLabel>Filter by element name</FormLabel>
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

    const filteredElements = useMemo(() => {
        const titleFilterLC = titleFilter.toLowerCase();
        return infos.data?.content_Element && includeUploadablesFilter !== "UPLOADABLES"
            ? R.filter(
                  R.allPass([
                      (x) => restrictToTypes === null || restrictToTypes.some((y) => y === x.typeName),
                      (x) => typeFilter.length === 0 || typeFilter.some((y) => y.value === x.typeName),
                      (x) => nameFilter.length === 0 || nameFilter.some((y) => y.value === x.name),
                      (x: SEoUm_ElementFragment) =>
                          titleFilterLC.length === 0 || !!x.item?.title.toLowerCase().includes(titleFilterLC),
                  ]),
                  infos.data.content_Element
              )
            : [];
    }, [infos.data?.content_Element, includeUploadablesFilter, typeFilter, nameFilter, restrictToTypes, titleFilter]);

    const filteredUploadables = useMemo(() => {
        const titleFilterLC = titleFilter.toLowerCase();
        return infos.data?.content_UploadableElement && includeUploadablesFilter !== "ELEMENTS"
            ? R.filter(
                  R.allPass([
                      (x) => restrictToTypes === null || restrictToTypes.some((y) => y === x.typeName),
                      (x) => typeFilter.length === 0 || typeFilter.some((y) => y.value === x.typeName),
                      (x) => nameFilter.length === 0 || nameFilter.some((y) => y.value === x.name),
                      (x: SEoUm_UploadableFragment) =>
                          titleFilterLC.length === 0 || !!x.itemTitle?.toLowerCase().includes(titleFilterLC),
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
            : [];
    }, [
        infos.data?.content_UploadableElement,
        includeUploadablesFilter,
        typeFilter,
        nameFilter,
        includeUploadedFilter,
        includeUploadersFilter,
        restrictToTypes,
        titleFilter,
    ]);

    const displayResult: {
        itemId: string;
        elements: (SEoUm_ElementFragment | SEoUm_UploadableFragment)[];
    }[] = useMemo(() => {
        const intermediary = R.groupBy((x) => x.itemId, [...filteredElements, ...filteredUploadables] as (
            | SEoUm_ElementFragment
            | SEoUm_UploadableFragment
        )[]);

        return R.sortBy(
            (x) =>
                "itemTitle" in x.elements[0]
                    ? x.elements[0].itemTitle ?? ""
                    : "item" in x.elements[0]
                    ? x.elements[0].item.title
                    : "",
            Object.entries(intermediary).map(([itemId, elements]) => ({ itemId, elements }))
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
                            {titleInput}
                            {nameSelect}
                            {typeSelect}
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
                                {displayResult.map(({ elements }) => (
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
                                displayResult.map(
                                    (x: {
                                        itemId: string;
                                        elements: (SEoUm_ElementFragment | SEoUm_UploadableFragment)[];
                                    }) => ({
                                        itemId: x.itemId,
                                        elementIds: x.elements.filter((y) => "item" in y).map((y) => y.id),
                                        uploadables: x.elements
                                            .filter((y) => "itemTitle" in y)
                                            .map((y) => ({
                                                uploadableId: y.id,
                                                elementId: "itemTitle" in y ? y.element?.id : undefined,
                                            })),
                                    })
                                )
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
