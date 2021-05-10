import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/modal";
import React from "react";

export interface PermissionGrant {
    id: string;
    permissionSetId: string;
    groupId: string | null | undefined;
    entityId: string | null | undefined;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    elementIds: string[];
    uploadableIds: {
        uploadableId: string;
        elementId?: string;
    }[];
}

export function EditElementsPermissionGrantsModal({ isOpen, onClose, ...props }: Props): JSX.Element {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="7xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    Edit security
                    <ModalCloseButton />
                </ModalHeader>
                <ModalBody pb={4}>
                    {isOpen ? <EditElementsPermissionGrantsModalInner {...props} /> : undefined}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}

function EditElementsPermissionGrantsModalInner({
    elementIds,
    uploadableIds,
}: Omit<Props, "isOpen" | "onClose">): JSX.Element {
    return <>TODO</>;
}
