import {
    Button,
    ButtonGroup,
    Checkbox,
    FormControl,
    FormHelperText,
    FormLabel,
    HStack,
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
    VStack,
} from "@chakra-ui/react";
import type { LayoutDataBlob } from "@clowdr-app/shared-types/build/content/layoutData";
import React, { useCallback, useState } from "react";
import { gql } from "urql";
import { useUpdateLayoutMutation } from "../../../../../../generated/graphql";

gql`
    mutation UpdateLayout($elementIds: [uuid!]!, $layoutData: jsonb!) {
        update_content_Element(where: { id: { _in: $elementIds } }, _append: { layoutData: $layoutData }) {
            affected_rows
        }
    }
`;

export function UpdateLayoutModal({
    isOpen,
    onClose,
    elementsByItem,
}: {
    isOpen: boolean;
    onClose: () => void;
    elementsByItem: {
        itemId: string;
        elementIds: string[];
    }[];
}): JSX.Element {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Update layout</ModalHeader>
                <ModalCloseButton />
                {isOpen ? <ModalInner elementsByItem={elementsByItem} onClose={onClose} /> : undefined}
            </ModalContent>
        </Modal>
    );
}

function ModalInner({
    onClose,
    elementsByItem,
}: {
    onClose: () => void;
    elementsByItem: {
        itemId: string;
        elementIds: string[];
    }[];
}): JSX.Element {
    const [hidden, setHidden] = useState<boolean | null>(null);
    const [wide, setWide] = useState<boolean | null>(null);
    const [priority, setPriority] = useState<string | null>(null);

    const [updateResponse, doUpdate] = useUpdateLayoutMutation();

    const update = useCallback(async () => {
        try {
            const layoutData: Partial<LayoutDataBlob> = {};
            if (hidden !== null) {
                layoutData.hidden = hidden;
            }
            if (wide !== null) {
                layoutData.wide = wide;
            }
            if (priority !== null && priority.trim() !== "") {
                layoutData.priority = parseInt(priority, 10);
            }
            await doUpdate({
                elementIds: elementsByItem.flatMap((x) => x.elementIds),
                layoutData,
            });

            onClose();
        } catch (e) {
            console.error("Failed to element layouts", e);
        }
    }, [hidden, wide, priority, doUpdate, elementsByItem, onClose]);

    return (
        <>
            <ModalBody>
                <VStack spacing={4}>
                    <FormControl>
                        <FormLabel>Hidden?</FormLabel>
                        <HStack spacing={2}>
                            <Checkbox
                                isChecked={hidden ?? false}
                                isIndeterminate={hidden === null}
                                onChange={(ev) => {
                                    setHidden(ev.target.checked);
                                }}
                            />
                            <Button
                                onClick={() => {
                                    setHidden(null);
                                }}
                                size="xs"
                                isDisabled={hidden === null}
                            >
                                Reset
                            </Button>
                        </HStack>
                        <FormHelperText>
                            To leave this field unchanged for all elements, leave the checkbox indeterminate.
                        </FormHelperText>
                    </FormControl>
                    <FormControl>
                        <FormLabel>Layout: Wide?</FormLabel>
                        <HStack spacing={2}>
                            <Checkbox
                                isChecked={wide ?? false}
                                isIndeterminate={wide === null}
                                onChange={(ev) => {
                                    setWide(ev.target.checked);
                                }}
                            />
                            <Button
                                onClick={() => {
                                    setWide(null);
                                }}
                                size="xs"
                                mx={2}
                                isDisabled={wide === null}
                            >
                                Reset
                            </Button>
                        </HStack>
                        <FormHelperText>
                            To leave this field unchanged for all elements, leave the checkbox indeterminate.
                        </FormHelperText>
                    </FormControl>
                    <FormControl>
                        <FormLabel>Layout: Priority</FormLabel>
                        <NumberInput
                            min={0}
                            value={priority ?? ""}
                            onChange={(v) => {
                                setPriority(v);
                            }}
                        >
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper />
                                <NumberDecrementStepper />
                            </NumberInputStepper>
                        </NumberInput>
                        <FormHelperText>
                            To leave this field unchanged for all elements, leave the input blank.
                        </FormHelperText>
                    </FormControl>
                </VStack>
            </ModalBody>
            <ModalFooter>
                <ButtonGroup spacing={2}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        colorScheme="purple"
                        isLoading={updateResponse.fetching}
                        onClick={update}
                        isDisabled={(!priority || priority.trim() === "") && wide === null && hidden === null}
                    >
                        Update
                    </Button>
                </ButtonGroup>
            </ModalFooter>
        </>
    );
}
