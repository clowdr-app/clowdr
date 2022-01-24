import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    useDisclosure,
} from "@chakra-ui/react";
import { DevicePermissionStatus, useDevicePermissionStatus } from "amazon-chime-sdk-component-library-react";
import * as R from "ramda";
import React, { useEffect } from "react";
import { FormattedMessage, useIntl } from "react-intl";

export function PermissionsExplanationModal(): JSX.Element {
    const devicePermissionStatus = useDevicePermissionStatus();

    const deniedDisclosure = useDisclosure();

    useEffect(() => {
        if (devicePermissionStatus === DevicePermissionStatus.DENIED) {
            deniedDisclosure.onOpen();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [devicePermissionStatus]);

    return (
        <>
            <Modal isOpen={devicePermissionStatus === DevicePermissionStatus.IN_PROGRESS} onClose={R.always(undefined)}>
                <ModalOverlay />
                <ModalContent marginTop="auto">
                    <ModalHeader>
                        <FormattedMessage 
                            id="Conference.Attend.Room.VideoChat.PermissionsExplanationModal.DetectingDevices"
                            defaultMessage="Detecting cameras and microphones"
                        />
                    </ModalHeader>
                    <ModalBody>
                        <FormattedMessage 
                            id="Conference.Attend.Room.VideoChat.PermissionsExplanationModal.ConnectionDescription"
                            defaultMessage="To connect to the video room, we need to detect what cameras and microphones are connected to
                            your computer. Your browser may ask you for permission to share this information."
                        />
                       
                    </ModalBody>
                </ModalContent>
            </Modal>
            <Modal isOpen={deniedDisclosure.isOpen} onClose={deniedDisclosure.onClose}>
                <ModalOverlay />
                <ModalContent marginTop="auto">
                    <ModalHeader>
                        <FormattedMessage 
                            id="Conference.Attend.Room.VideoChat.PermissionsExplanationModal.PermissionsDenied"
                            defaultMessage="Permissions were denied"
                        />
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <FormattedMessage 
                            id="Conference.Attend.Room.VideoChat.PermissionsExplanationModal.PermissionsDeniedDesc"
                            defaultMessage="Permissions to choose camera and microphone settings were denied."
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>
        </>
    );
}
