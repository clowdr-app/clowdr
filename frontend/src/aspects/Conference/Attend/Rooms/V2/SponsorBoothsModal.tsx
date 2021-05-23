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
import SponsorBooths from "./SponsorBooths";

export default function SponsorBoothsModal(props: Omit<ModalProps, "children">): JSX.Element {
    const closeRef = useRef<HTMLButtonElement | null>(null);
    return (
        <Modal initialFocusRef={closeRef} size="6xl" isCentered scrollBehavior="inside" {...props}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Sponsors</ModalHeader>
                <ModalCloseButton ref={closeRef} />
                <ModalBody>
                    <SponsorBooths />
                </ModalBody>
                <ModalFooter></ModalFooter>
            </ModalContent>
        </Modal>
    );
}
