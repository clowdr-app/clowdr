import {
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
} from "@chakra-ui/react";
import React from "react";
import type { ManageContent_ItemFragment } from "../../../../../../generated/graphql";

export function AddRemoveTagsModal({
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
                <ModalHeader>Add or remove tags</ModalHeader>
                <ModalCloseButton />
                {isOpen ? <ModalInner items={items} onClose={onClose} /> : undefined}
            </ModalContent>
        </Modal>
    );
}

function ModalInner({ onClose }: { onClose: () => void; items: readonly ManageContent_ItemFragment[] }): JSX.Element {
    return (
        <>
            <ModalBody>Coming soon</ModalBody>
            {/* TODO */}
            <ModalFooter>
                <Button size="sm" mr={3} onClick={onClose}>
                    Close
                </Button>
            </ModalFooter>
        </>
    );
}
