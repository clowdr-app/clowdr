import {
    Box,
    Button,
    Center,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
} from "@chakra-ui/react";
import React from "react";
import type { RequiredContentItemDescriptor } from "./Types";

interface Props {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    groupTitle: string;
    isItemDirty: boolean;
    itemDesc: RequiredContentItemDescriptor;
}

export default function UploadersModal({
    isOpen,
    onOpen,
    onClose,
    groupTitle,
    itemDesc,
    isItemDirty,
}: Props): JSX.Element {
    return (
        <>
            <Box>
                <Center flexDir="column">
                    <Button onClick={onOpen} colorScheme="blue">
                        Manage uploaders
                    </Button>
                    <Text as="p">(Uploaders are the people who may upload content to this item.)</Text>
                </Center>
            </Box>
            <Modal isCentered onClose={onClose} isOpen={isOpen} motionPreset="scale" size="full">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader paddingBottom={0}>Manage Uploaders</ModalHeader>
                    <ModalHeader paddingBottom={0} paddingTop={"0.3rem"} fontSize="100%" fontStyle="italic">
                        {itemDesc.name}
                    </ModalHeader>
                    <ModalHeader paddingTop={"0.3rem"} fontSize="100%" fontStyle="italic" fontWeight="normal">
                        &ldquo;{groupTitle}&bdquo;
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Box>
                            <Text>TODO: Manage the names/emails of who has access (remember to mark as dirty)</Text>
                            <Text>TODO: Send upload reminder emails (only if not dirty)</Text>
                            <Text>
                                TODO: Custom button on the main page CRUD table to send all uploaders a reminder email
                            </Text>
                            {isItemDirty ? "Dirty" : "Not dirty"}
                        </Box>
                    </ModalBody>
                    <ModalFooter>
                        <Button colorScheme="blue" mr={3} onClick={onClose}>
                            Done
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
