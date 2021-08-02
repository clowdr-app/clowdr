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
    useSEoUm_InfosQuery,
} from "../../../../../../generated/graphql";
import MultiSelect from "../../../../../Chakra/MultiSelect";

gql`
    fragment SEoUM_Element on content_Element {
        id
        name
        typeName
        itemId
        data
        item {
            id
            title
        }
        uploaders {
            id
        }
    }

    query SEoUM_Infos($itemIds: [uuid!]!) {
        content_Element(where: { itemId: { _in: $itemIds } }) {
            ...SEoUM_Element
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
            R.uniq(infos.data ? infos.data.content_Element.map((x) => x.name) : []).map((x) => ({
                label: x,
                value: x,
            })),
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
                >
                    <option value="BOTH">Uploadables with or without submission</option>
                    <option value="WITH">Only uploadables with a submission</option>
                    <option value="WITHOUT">Only uploadables without a submission</option>
                </Select>
                <FormHelperText>Include uploadables that have received a submission.</FormHelperText>
            </FormControl>
        );
    }, [includeUploadedFilter]);

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
                >
                    <option value="BOTH">Uploadables with or without uploaders</option>
                    <option value="WITH">Only uploadables with at least one uploader</option>
                    <option value="WITHOUT">Only uploadables without any uploaders</option>
                </Select>
                <FormHelperText>Include uploadables that have at least one uploader.</FormHelperText>
            </FormControl>
        );
    }, [includeUploadersFilter]);

    const filteredElements = useMemo(() => {
        const titleFilterLC = titleFilter.toLowerCase();
        return infos.data?.content_Element
            ? R.filter(
                  R.allPass([
                      (x) => restrictToTypes === null || restrictToTypes.some((y) => y === x.typeName),
                      (x) => typeFilter.length === 0 || typeFilter.some((y) => y.value === x.typeName),
                      (x) => nameFilter.length === 0 || nameFilter.some((y) => y.value === x.name),
                      (x: SEoUm_ElementFragment) =>
                          titleFilterLC.length === 0 || !!x.item?.title.toLowerCase().includes(titleFilterLC),
                      (x) =>
                          includeUploadedFilter === "BOTH" ||
                          (includeUploadedFilter === "WITH" && x.data?.length) ||
                          (includeUploadedFilter === "WITHOUT" && !x.data?.length),
                      (x) =>
                          includeUploadersFilter === "BOTH" ||
                          (includeUploadersFilter === "WITH" && x.uploaders.length) ||
                          (includeUploadersFilter === "WITHOUT" && !x.uploaders.length),
                  ]),
                  infos.data.content_Element
              )
            : [];
    }, [
        includeUploadedFilter,
        includeUploadersFilter,
        infos.data?.content_Element,
        nameFilter,
        restrictToTypes,
        titleFilter,
        typeFilter,
    ]);

    const displayResult: {
        itemId: string;
        elements: SEoUm_ElementFragment[];
    }[] = useMemo(() => {
        const intermediary = R.groupBy((x) => x.itemId, filteredElements);

        return R.sortBy(
            (x) => x.elements[0].item.title,
            Object.entries(intermediary).map(([itemId, elements]) => ({ itemId, elements }))
        );
    }, [filteredElements]);

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
                            {includeUploaded}
                            {includeUploaders}
                        </VStack>
                        <Divider m={0} h="unset" orientation="vertical" />
                        <VStack spacing={4} flex="1 1 48%">
                            <Heading as="h3" fontSize="md">
                                Filtered elements &amp; uploadables
                            </Heading>
                            <Text>
                                {displayResult.length} items ({filteredElements.length} elements)
                            </Text>
                            <UnorderedList listStyleType="none" maxH="70vh" overflow="auto">
                                {displayResult.map(({ elements }) => (
                                    <ListItem key={elements[0].itemId} mb={2}>
                                        <chakra.span noOfLines={1}>{elements[0].item.title}</chakra.span>
                                        <UnorderedList listStylePosition="inside">
                                            {elements.map((element) => (
                                                <ListItem key={element.id}>
                                                    {element.name}
                                                    {` (${element.data?.length ? "Submitted" : "Not submitted"}; ${
                                                        element.uploaders.length
                                                    } uploaders)`}
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
                                displayResult.map((x: { itemId: string; elements: SEoUm_ElementFragment[] }) => ({
                                    itemId: x.itemId,
                                    elementIds: x.elements.map((y) => y.id),
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
