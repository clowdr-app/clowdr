import { gql } from "@apollo/client";
import {
    Alert,
    AlertDescription,
    AlertTitle,
    Button,
    ButtonGroup,
    Checkbox,
    FormControl,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    Select,
    useToast,
    VStack,
} from "@chakra-ui/react";
import { ElementBaseTypes } from "@clowdr-app/shared-types/build/content";
import type { LayoutDataBlob } from "@clowdr-app/shared-types/build/content/layoutData";
import React, { useEffect, useMemo, useState } from "react";
import type {
    Content_Element_Insert_Input,
    ManageContent_ItemFragment} from "../../../../../../generated/graphql";
import {
    Content_ElementType_Enum,
    useBulkEdit_AddElementsMutation,
} from "../../../../../../generated/graphql";
import { ElementBaseTemplates } from "../Element/Kinds/Templates";

gql`
    mutation BulkEdit_AddElements($objects: [content_Element_insert_input!]!) {
        insert_content_Element(objects: $objects) {
            affected_rows
        }
    }
`;

export function AddElementsModal({
    isOpen,
    onClose,
    items,
}: {
    isOpen: boolean;
    onClose: () => void;
    items: readonly ManageContent_ItemFragment[];
}): JSX.Element {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Add elements</ModalHeader>
                <ModalCloseButton />
                {isOpen ? <ModalInner items={items} onClose={onClose} /> : undefined}
            </ModalContent>
        </Modal>
    );
}

function ModalInner({
    onClose,
    items,
}: {
    onClose: () => void;
    items: readonly ManageContent_ItemFragment[];
}): JSX.Element {
    const contentTypeOptions: { label: string; value: Content_ElementType_Enum }[] = useMemo(
        () =>
            Object.keys(Content_ElementType_Enum)
                .filter((key) => {
                    if (typeof (Content_ElementType_Enum as any)[key] === "string") {
                        const t = (Content_ElementType_Enum as any)[key] as Content_ElementType_Enum;
                        const baseT = ElementBaseTemplates[ElementBaseTypes[t]];
                        return baseT.supported && baseT.allowCreate.includes(t);
                    }
                    return false;
                })
                .map((key) => {
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

    const [elementType, setElementType] = useState<Content_ElementType_Enum | "">("");
    const [name, setName] = useState<string>("");
    const [uploadsRemaining, setUploadsRemaining] = useState<number>(3);
    const [hidden, setHidden] = useState<boolean>(false);
    const [wide, setWide] = useState<boolean>(true);
    const [priority, setPriority] = useState<number>(100);

    const [insert, insertResponse] = useBulkEdit_AddElementsMutation();

    const toast = useToast();
    useEffect(() => {
        if (
            !insertResponse.loading &&
            insertResponse.data?.insert_content_Element &&
            insertResponse.data.insert_content_Element.affected_rows > 0 &&
            !insertResponse.error
        ) {
            toast({
                status: "success",
                title: `${insertResponse.data.insert_content_Element.affected_rows} elements inserted`,
                duration: 10000,
                isClosable: true,
                position: "top",
            });
            onClose();
        }
    }, [toast, onClose, insertResponse.loading, insertResponse.data?.insert_content_Element, insertResponse.error]);

    return (
        <>
            <ModalBody>
                <VStack spacing={4}>
                    <FormControl>
                        <FormLabel>Element type</FormLabel>
                        <Select
                            value={elementType}
                            onChange={(ev) => {
                                setElementType(ev.target.value as Content_ElementType_Enum | "");
                            }}
                        >
                            <option value="">Please select a type</option>
                            {contentTypeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl>
                        <FormLabel>Element name</FormLabel>
                        <Input
                            value={name}
                            onChange={(ev) => {
                                setName(ev.target.value);
                            }}
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel>Uploads remaining</FormLabel>
                        <NumberInput
                            max={3}
                            min={0}
                            value={uploadsRemaining}
                            onChange={(_v, v) => {
                                setUploadsRemaining(v);
                            }}
                        >
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                    </FormControl>
                    <FormControl>
                        <FormLabel>Hidden?</FormLabel>
                        <Checkbox
                            isChecked={hidden}
                            onChange={(ev) => {
                                setHidden(ev.target.checked);
                            }}
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel>Layout: Wide?</FormLabel>
                        <Checkbox
                            isChecked={wide}
                            onChange={(ev) => {
                                setWide(ev.target.checked);
                            }}
                        />
                    </FormControl>
                    <FormControl>
                        <FormLabel>Layout: Priority</FormLabel>
                        <NumberInput
                            min={0}
                            value={priority}
                            onChange={(_v, v) => {
                                setPriority(v);
                            }}
                        >
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                    </FormControl>
                    {insertResponse.error ? (
                        <Alert status="error">
                            <AlertTitle>Error inserting elements</AlertTitle>
                            <AlertDescription>{insertResponse.error.message}</AlertDescription>
                        </Alert>
                    ) : undefined}
                </VStack>
            </ModalBody>
            <ModalFooter>
                <ButtonGroup>
                    <Button size="sm" mr={3} onClick={onClose}>
                        Close
                    </Button>
                    <Button
                        size="sm"
                        mr={3}
                        onClick={async () => {
                            if (elementType !== "") {
                                const objects: Content_Element_Insert_Input[] = items.map((item) => {
                                    const layoutData: LayoutDataBlob = {
                                        contentType: elementType as any,
                                        wide,
                                        hidden,
                                        priority,
                                    };
                                    return {
                                        conferenceId: item.conferenceId,
                                        data: [],
                                        isHidden: hidden,
                                        itemId: item.id,
                                        layoutData,
                                        name,
                                        typeName: elementType,
                                        uploadsRemaining,
                                    };
                                });

                                insert({
                                    variables: {
                                        objects,
                                    },
                                });
                            }
                        }}
                        colorScheme="purple"
                        isDisabled={elementType === "" || name.trim() === ""}
                        isLoading={insertResponse.loading}
                    >
                        Add elements
                    </Button>
                </ButtonGroup>
            </ModalFooter>
        </>
    );
}
