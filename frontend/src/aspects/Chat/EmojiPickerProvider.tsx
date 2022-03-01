import { Center, useDisclosure } from "@chakra-ui/react";
import type { EmojiData } from "emoji-mart";
import { Picker } from "emoji-mart";
import "emoji-mart/css/emoji-mart.css";
import React, { useCallback, useMemo, useRef } from "react";

interface EmojiPickerContext {
    open: (onSelect?: (data: EmojiData) => void) => void;
    close: () => void;
}

const EmojiPickerContext = React.createContext<EmojiPickerContext | undefined>(undefined);

export function useEmojiPicker(): EmojiPickerContext {
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
    const ref = useRef<HTMLDivElement | null>(null);
    const { isOpen, onOpen, onClose } = useDisclosure();
    const onSelectCb = useRef<((data: EmojiData) => void) | null>(null);
    const open = useCallback(
        (f?: (data: EmojiData) => void) => {
            onSelectCb.current = f ?? null;
            onOpen();
        },
        [onOpen]
    );
    const onSelect = useCallback(
        (data) => {
            onClose();
            if (data) {
                onSelectCb.current?.(data);
            }
        },
        [onClose]
    );
    const ctx = useMemo(() => ({ open, close: onClose }), [open, onClose]);

    return (
        <EmojiPickerContext.Provider value={ctx}>
            {children}
            {isOpen ? (
                <Center
                    ref={ref}
                    pos="absolute"
                    top={0}
                    w="100%"
                    h="100%"
                    zIndex={1000000}
                    backgroundColor="rgba(0,0,0,0.6)"
                    onClick={(ev) => {
                        const tg = ev.target as Node;
                        if (!ref.current?.contains(tg) || ref.current.isEqualNode(tg)) {
                            onClose();
                        }
                    }}
                    onKeyUp={(ev) => {
                        if (ev.key === "Escape") {
                            onClose();
                        }
                    }}
                >
                    <Picker set="twitter" showPreview={false} autoFocus={true} onSelect={onSelect} />
                </Center>
            ) : undefined}
        </EmojiPickerContext.Provider>
    );
}
