import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Button,
    ButtonGroup,
    FormControl,
    FormLabel,
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
    Text,
} from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import { gql } from "urql";
import { useUpdateUploadsRemainingMutation } from "../../../../../../generated/graphql";

gql`
    mutation UpdateUploadsRemaining($elementIds: [uuid!]!, $count: Int!) {
        update_content_Element(where: { id: { _in: $elementIds } }, _set: { uploadsRemaining: $count }) {
            affected_rows
        }
    }
`;

export function UpdateUploadsRemainingModal({
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
                <ModalHeader>Update uploads remaining</ModalHeader>
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
    const elementIds = useMemo(() => elementsByItem.flatMap((x) => x.elementIds), [elementsByItem]);
    const [newValue, setNewValue] = useState<number>(3);

    const [updateResponse, doUpdate] = useUpdateUploadsRemainingMutation();

    const update = useCallback(async () => {
        try {
            await doUpdate({
                variables: {
                    elementIds,
                    count: newValue,
                },
            });

            onClose();
        } catch (e) {
            console.error("Failed to update uploads remaining", e);
        }
    }, [doUpdate, elementIds, newValue, onClose]);

    return (
        <>
            <ModalBody>
                <Text>This will update the number of uploads remaining on selected elements.</Text>
                <FormControl mt={4}>
                    <FormLabel>New uploads remaining</FormLabel>
                    <NumberInput
                        value={newValue}
                        onChange={(_valueAsStr, value) => {
                            if (!Number.isNaN(value)) {
                                setNewValue(value);
                            }
                        }}
                        min={0}
                        max={3}
                    >
                        <NumberInputField />
                        <NumberInputStepper>
                            <NumberIncrementStepper />
                            <NumberDecrementStepper />
                        </NumberInputStepper>
                    </NumberInput>
                </FormControl>
                {updateResponse.error ? (
                    <Alert status="error" mt={4}>
                        <AlertTitle>
                            <AlertIcon />
                            Error updating uploads remaining
                        </AlertTitle>
                        <AlertDescription>{updateResponse.error.message}</AlertDescription>
                    </Alert>
                ) : undefined}
            </ModalBody>
            <ModalFooter>
                <ButtonGroup spacing={2}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button colorScheme="purple" isLoading={updateResponse.fetching} onClick={update}>
                        Update
                    </Button>
                </ButtonGroup>
            </ModalFooter>
        </>
    );
}
