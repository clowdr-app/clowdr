import { InfoIcon } from "@chakra-ui/icons";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    chakra,
    Code,
    ListItem,
    OrderedList,
    Text,
    useColorModeValue,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import type {
    ManageContent_ElementFragment,
    ManageContent_ItemSecondaryFragment,
} from "../../../../../../generated/graphql";
import { FAIcon } from "../../../../../Icons/FAIcon";
import { EditItemPeoplePanel } from "../Item/EditItemPeople";
import { EditElement } from "./EditElement";

export function EditElements({
    itemId,
    elements,
    originatingData,
    refetchElements,
    defaultOpenSecurityForId,
    isSponsor,
    openSendSubmissionRequests,
}: {
    itemId: string;
    refetchElements: () => void;
    defaultOpenSecurityForId?: string;
    isSponsor: boolean;
    openSendSubmissionRequests: (itemId: string, uploaderIds: string[]) => void;
} & Partial<ManageContent_ItemSecondaryFragment> & {
        elements: readonly ManageContent_ElementFragment[];
    }): JSX.Element {
    const sortedElements = useMemo(() => {
        const sortedElements: ManageContent_ElementFragment[] = [...elements];

        sortedElements.sort((a, b) => {
            const layoutA = a.layoutData;
            const layoutB = b.layoutData;

            if (layoutA && layoutB) {
                if (!("priority" in layoutA) && !("priority" in layoutB)) {
                    return a.name.localeCompare(b.name);
                }
                if (!("priority" in layoutA)) {
                    return 1;
                }
                if (!("priority" in layoutB)) {
                    return -1;
                }
                const priorityOrder = layoutA.priority - layoutB.priority;

                return priorityOrder === 0 ? a.name.localeCompare(b.name) : priorityOrder;
            } else if (layoutA) {
                return -1;
            } else if (layoutB) {
                return 1;
            } else {
                return a.name.localeCompare(b.name);
            }
        });

        return sortedElements;
    }, [elements]);

    const bgColor = useColorModeValue("gray.100", "gray.800");

    return (
        <Accordion allowToggle allowMultiple w="100%">
            <AccordionItem w="100%">
                {({ isExpanded }) => (
                    <>
                        <AccordionButton bgColor={bgColor}>
                            People
                            <AccordionIcon ml="auto" />
                        </AccordionButton>
                        <AccordionPanel pb={4}>
                            {isExpanded ? <EditItemPeoplePanel itemId={itemId} /> : <></>}
                        </AccordionPanel>
                    </>
                )}
            </AccordionItem>
            {originatingData ? (
                <AccordionItem w="100%">
                    <AccordionButton bgColor={bgColor}>
                        Originating data
                        <AccordionIcon ml="auto" />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        <Text>
                            The following shows the raw data provided to Clowdr&apos;s Content Importer (accumulated
                            across one or more imports).
                        </Text>
                        <Text as="pre" w="100%" overflowWrap="break-word" whiteSpace="pre-wrap" mt={2}>
                            <Code w="100%" p={2}>
                                Source Ids: {JSON.stringify(originatingData.sourceId.split("¬"), null, 2)}
                            </Code>
                        </Text>
                        <Text as="pre" w="100%" overflowWrap="break-word" whiteSpace="pre-wrap" mt={2}>
                            <Code w="100%" p={2}>
                                {JSON.stringify(originatingData.data, null, 2)}
                            </Code>
                        </Text>
                    </AccordionPanel>
                </AccordionItem>
            ) : undefined}
            {isSponsor ? (
                <AccordionItem w="100%">
                    <AccordionButton bgColor={bgColor}>
                        <Box flex="1" textAlign="left">
                            <InfoIcon mr={2} verticalAlign="middle" mb={1} />
                            <chakra.span>How to add a sponsor&apos;s logo</chakra.span>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pb={4}>
                        <OrderedList>
                            <ListItem>Add content of type &ldquo;Image file&rdquo;</ListItem>
                            <ListItem>Enable the &ldquo;Logo&rdquo; option</ListItem>
                            <ListItem>
                                For correct display, please also &ldquo;Hide
                                <FAIcon iconStyle="s" icon="eye-slash" fontSize="xs" mb={1} ml={1} />
                                &rdquo; the element
                            </ListItem>
                            <ListItem>Upload the logo file</ListItem>
                        </OrderedList>
                    </AccordionPanel>
                </AccordionItem>
            ) : undefined}
            {sortedElements.map((item, idx) => (
                <EditElement
                    key={item.id}
                    element={item}
                    idx={idx}
                    previousElement={sortedElements[idx - 1]}
                    nextElement={sortedElements[idx + 1]}
                    refetchElements={refetchElements}
                    defaultOpenSecurity={item.id === defaultOpenSecurityForId}
                    openSendSubmissionRequests={(uploaderIds) => openSendSubmissionRequests(itemId, uploaderIds)}
                />
            ))}
        </Accordion>
    );
}
