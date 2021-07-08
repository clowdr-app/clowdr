import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    useDisclosure,
} from "@chakra-ui/react";
import type { FocusableElement } from "@chakra-ui/utils";
import React, { useMemo, useRef } from "react";
import LiveProgramRooms from "./LiveProgramRooms";

interface LiveProgramRoomsModalContext {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    finalFocusRef: React.RefObject<FocusableElement>;
}

const LiveProgramRoomsModalContext = React.createContext<LiveProgramRoomsModalContext | undefined>(undefined);

export function useLiveProgramRoomsModal(): LiveProgramRoomsModalContext {
    const ctx = React.useContext(LiveProgramRoomsModalContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function LiveProgramRoomsModalProvider({ children }: React.PropsWithChildren<any>): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const liveprogramroomsButtonRef = useRef<FocusableElement>(null);

    const ctx: LiveProgramRoomsModalContext = useMemo(
        () => ({
            finalFocusRef: liveprogramroomsButtonRef,
            isOpen,
            onOpen,
            onClose,
        }),
        [onOpen, isOpen, onClose]
    );

    return (
        <LiveProgramRoomsModalContext.Provider value={ctx}>
            {children}
            <LiveProgramRoomsModal isOpen={isOpen} onClose={onClose} finalFocusRef={liveprogramroomsButtonRef} />
        </LiveProgramRoomsModalContext.Provider>
    );
}

export default function LiveProgramRoomsModal({
    isOpen,
    onClose,
    finalFocusRef,
}: {
    isOpen: boolean;
    onClose: () => void;
    finalFocusRef: React.RefObject<FocusableElement>;
}): JSX.Element {
    const closeRef = useRef<HTMLButtonElement | null>(null);
    return (
        <Modal
            initialFocusRef={closeRef}
            finalFocusRef={finalFocusRef}
            size="6xl"
            isCentered
            autoFocus={false}
            returnFocusOnClose={false}
            trapFocus={true}
            scrollBehavior="inside"
            isOpen={isOpen}
            onClose={onClose}
        >
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Live or starting within 10 mins</ModalHeader>
                <ModalCloseButton ref={closeRef} />
                <ModalBody>
                    <LiveProgramRooms />
                </ModalBody>
                <ModalFooter></ModalFooter>
            </ModalContent>
        </Modal>
    );
}
