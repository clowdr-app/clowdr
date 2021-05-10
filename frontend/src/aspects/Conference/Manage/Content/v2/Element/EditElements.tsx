import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Code,
    Text,
    useColorModeValue,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import type {
    ManageContent_ElementFragment,
    ManageContent_ItemSecondaryFragment,
    ManageContent_UploadableElementFragment,
} from "../../../../../../generated/graphql";
import { EditItemPeoplePanel } from "../Item/EditItemPeople";
import { EditElement } from "./EditElement";

export function EditElements({
    itemId,
    elements,
    uploadableElements,
    chatId,
    originatingData,
    refetchElements,
}: { itemId: string; refetchElements: () => void } & ManageContent_ItemSecondaryFragment & {
        elements: readonly ManageContent_ElementFragment[];
        uploadableElements: readonly ManageContent_UploadableElementFragment[];
    }): JSX.Element {
    const sortedElements = useMemo(() => {
        const sortedElements: (ManageContent_ElementFragment | ManageContent_UploadableElementFragment)[] = [
            ...elements,
            ...uploadableElements,
        ];

        sortedElements.sort((a, b) => {
            if ("layoutData" in a && "layoutData" in b) {
                if (
                    (!a.layoutData || !("priority" in a.layoutData)) &&
                    (!b.layoutData || !("priority" in b.layoutData))
                ) {
                    return a.name.localeCompare(b.name);
                }
                if (!a.layoutData || !("priority" in a.layoutData)) {
                    return 1;
                }
                if (!b.layoutData || !("priority" in b.layoutData)) {
                    return -1;
                }
                const priorityOrder = a.layoutData.priority - b.layoutData.priority;

                return priorityOrder === 0 ? a.name.localeCompare(b.name) : priorityOrder;
            } else if ("layoutData" in a) {
                return -1;
            } else if ("layoutData" in b) {
                return 1;
            } else {
                return a.name.localeCompare(b.name);
            }
        });

        return sortedElements;
    }, [elements, uploadableElements]);

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
                <AccordionItem>
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
            {sortedElements.map((item, idx) => (
                <EditElement
                    key={item.id}
                    element={item}
                    idx={idx}
                    previousElement={sortedElements[idx - 1]}
                    nextElement={sortedElements[idx + 1]}
                    refetchElements={refetchElements}
                />
            ))}
        </Accordion>
    );
}
