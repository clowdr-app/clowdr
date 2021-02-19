import { Modal, ModalBody, ModalContent, ModalOverlay, Portal, useDisclosure } from "@chakra-ui/react";
import type { EmojiData } from "emoji-mart";
import React, { useCallback, useMemo } from "react";
import { OutPortal } from "react-reverse-portal";
import { useEmojiMart } from "../../Emoji/EmojiMartContext";

interface EmojiPickerContext {
    open: (onSelect: (data: EmojiData) => void) => void;
}

const EmojiPickerContext = React.createContext<EmojiPickerContext | undefined>(undefined);

export function useEmojiPickerContext(): EmojiPickerContext {
    const ctx = React.useContext(EmojiPickerContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export default function EmojiPickerProvider({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const emojiMart = useEmojiMart();
    const open = useCallback(
        (f: (data: EmojiData) => void) => {
            emojiMart.setOnSelect({
                f: (data) => {
                    onClose();
                    f(data);
                },
            });
            onOpen();
        },
        [emojiMart, onClose, onOpen]
    );
    const ctx = useMemo(() => ({ open }), [open]);

    return (
        <EmojiPickerContext.Provider value={ctx}>
            {children}
            <Portal>
                <Modal
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore -- Manually set this to a value that will stop Chakra animating it
                    motionPreset="none"
                    blockScrollOnMount={true}
                    isCentered
                    isOpen={isOpen}
                    onClose={onClose}
                    scrollBehavior="inside"
                    size="sm"
                >
                    <ModalOverlay animate="none" />
                    <ModalContent aria-label="Pick an emoji" w="auto" maxW="auto" maxWidth="auto">
                        <ModalBody p={0}>
                            <OutPortal node={emojiMart.portalNode} />
                        </ModalBody>
                    </ModalContent>
                </Modal>
            </Portal>
        </EmojiPickerContext.Provider>
    );
}
