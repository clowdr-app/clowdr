import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
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
    rooms,
    chatId,
    originatingData,
}: { itemId: string } & ManageContent_ItemSecondaryFragment & {
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
            {sortedElements.map((item, idx) => (
                <EditElement
                    key={item.id}
                    element={item}
                    idx={idx}
                    previousElement={sortedElements[idx - 1]}
                    nextElement={sortedElements[idx + 1]}
                />
            ))}
        </Accordion>
    );
}
