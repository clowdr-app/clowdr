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
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import React, { useEffect, useMemo, useState } from "react";
import { makeContext } from "../../../../../../aspects/GQL/make-context";
import type {
    ManageContent_ItemFragment,
    SelectElements_ElementFragment,
    SelectElements_ItemFragment,
} from "../../../../../../generated/graphql";
import { Content_ElementType_Enum, useSEoUm_InfosQuery } from "../../../../../../generated/graphql";
import MultiSelect from "../../../../../Chakra/MultiSelect";

gql`
    fragment SelectElements_Item on content_Item {
        id
        title
        elements {
            ...SelectElements_Element
        }
    }

    fragment SelectElements_Element on content_Element {
        id
        name
        typeName
        itemId
        data
    }

    query SEoUM_Infos($itemIds: [uuid!]!) {
        content_Item(where: { id: { _in: $itemIds } }) {
            ...SelectElements_Item
        }
    }
`;

export function SelectElementsModal({
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
                <ModalHeader>Select items or elements</ModalHeader>
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
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: items[0]?.subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
            }),
        [items]
    );
    const [infos] = useSEoUm_InfosQuery({
        variables: {
            itemIds,
        },
        requestPolicy: "network-only",
        context,
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

    const nameOptions = useMemo(() => {
        const elementNames = new Set<string>();
        if (infos.data) {
            for (const item of infos.data.content_Item) {
                for (const element of item.elements) {
                    elementNames.add(element.name);
                }
            }
        }
        const result: {
            label: string;
            value: string;
        }[] = [];
        for (const name of elementNames) {
            result.push({
                label: name,
                value: name,
            });
        }
        return result;
    }, [infos.data]);

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
                    <option value="BOTH">Elements with or without submission</option>
                    <option value="WITH">Only elements with a submission</option>
                    <option value="WITHOUT">Only elements without a submission</option>
                </Select>
                <FormHelperText>Include elements that have received a submission.</FormHelperText>
            </FormControl>
        );
    }, [includeUploadedFilter]);

    const elementTests = useMemo<Array<(element: SelectElements_ElementFragment) => boolean>>(() => {
        return [
            (x) => restrictToTypes === null || restrictToTypes.some((y) => y === x.typeName),
            (x) => typeFilter.length === 0 || typeFilter.some((y) => y.value === x.typeName),
            (x) => nameFilter.length === 0 || nameFilter.some((y) => y.value === x.name),
            (x) =>
                includeUploadedFilter === "BOTH" ||
                (includeUploadedFilter === "WITH" && x.data?.length) ||
                (includeUploadedFilter === "WITHOUT" && !x.data?.length),
        ];
    }, [includeUploadedFilter, nameFilter, restrictToTypes, typeFilter]);

    const [filteredItems, setFilteredItems] = useState<SelectElements_ItemFragment[]>([]);

    useEffect(() => {
        let tId: number | undefined;
        if (infos.data?.content_Item) {
            const items = infos.data.content_Item;
            tId = setTimeout(
                (() => {
                    setFilteredItems(
                        items.reduce<SelectElements_ItemFragment[]>((result, item) => {
                            if (item.title.toLowerCase().includes(titleFilter.toLowerCase())) {
                                const resultElements: SelectElements_ElementFragment[] = [];
                                for (const element of item.elements) {
                                    if (elementTests.every((pred) => pred(element))) {
                                        resultElements.push(element);
                                    }
                                }

                                if (resultElements.length > 0) {
                                    result.push({
                                        ...item,
                                        elements: resultElements,
                                    });
                                }
                            }

                            return result;
                        }, [])
                    );
                }) as TimerHandler,
                500
            );
        }

        return () => {
            if (tId !== undefined) {
                clearTimeout(tId);
            }
        };
    }, [elementTests, infos.data?.content_Item, titleFilter]);

    const { listItems, elementsCount } = useMemo(
        () => ({
            listItems: filteredItems.map((item) => (
                <ListItem key={item.id} mb={2}>
                    <chakra.span noOfLines={1}>{item.title}</chakra.span>
                    <UnorderedList listStylePosition="inside">
                        {item.elements.map((element) => (
                            <ListItem key={element.id}>
                                {element.name}
                                {` (${element.data?.length ? "Submitted" : "Not submitted"})`}
                            </ListItem>
                        ))}
                    </UnorderedList>
                </ListItem>
            )),
            elementsCount: filteredItems.reduce((count, item) => count + item.elements.length, 0),
        }),
        [filteredItems]
    );
    return (
        <>
            <ModalBody>
                {infos.fetching && !infos.data ? <Spinner label="Loading elements" /> : undefined}
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
                        </VStack>
                        <Divider m={0} h="unset" orientation="vertical" />
                        <VStack spacing={4} flex="1 1 48%">
                            <Heading as="h3" fontSize="md">
                                Filtered elements
                            </Heading>
                            <Text>
                                {filteredItems.length} items ({elementsCount} elements)
                            </Text>
                            <UnorderedList listStyleType="none" maxH="70vh" overflow="auto">
                                {listItems}
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
                        colorScheme="pink"
                        size="sm"
                        mr={3}
                        onClick={() => {
                            onSelect(
                                filteredItems.map((item) => ({
                                    itemId: item.id,
                                    elementIds: item.elements.map((y) => y.id),
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
