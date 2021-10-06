import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Spinner } from "@chakra-ui/react";
import React, { useContext } from "react";
import {
    devicesToFriendlyName,
    PermissionInstructions,
} from "../Conference/Attend/Room/VideoChat/PermissionInstructions";
import { PermissionInstructionsContext } from "../Conference/Attend/Room/VideoChat/PermissionInstructionsContext";

export function PermissionInstructionsModal(): JSX.Element {
    const { permissionsModal, devices, title } = useContext(PermissionInstructionsContext);

    return (
        <Modal isOpen={permissionsModal.isOpen} onClose={permissionsModal.onClose} size="xl">
            <ModalOverlay />
            <ModalContent pb={2}>
                {devices
                    ? <ModalHeader>{title}</ModalHeader> ?? (
                          <ModalHeader>
                              There seems to be an issue with your {devicesToFriendlyName(devices, "or")}
                          </ModalHeader>
                      )
                    : undefined}
                <ModalCloseButton />
                <ModalBody>{devices ? <PermissionInstructions {...devices} /> : <Spinner />}</ModalBody>
            </ModalContent>
        </Modal>
    );
}
