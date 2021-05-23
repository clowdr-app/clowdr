import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    ModalProps,
} from "@chakra-ui/react";
import React, { useRef } from "react";
import LiveProgramRooms from "./LiveProgramRooms";

export default function LiveProgramRoomsModal(props: Omit<ModalProps, "children">): JSX.Element {
    const closeRef = useRef<HTMLButtonElement | null>(null);
    return (
        <Modal initialFocusRef={closeRef} size="6xl" isCentered scrollBehavior="inside" {...props}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Live rooms</ModalHeader>
                <ModalCloseButton ref={closeRef} />
                <ModalBody>
                    <LiveProgramRooms />
                </ModalBody>
                <ModalFooter></ModalFooter>
            </ModalContent>
        </Modal>
    );
}
