import {
    Button,
    ButtonProps,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Portal,
    useColorModeValue,
    useDisclosure,
} from "@chakra-ui/react";
import type { EmojiData } from "emoji-mart";
import "emoji-mart/css/emoji-mart.css";
import React from "react";
import { OutPortal } from "react-reverse-portal";
import { useEmojiMart } from "../../Emoji/EmojiMartContext";
import FAIcon from "../../Icons/FAIcon";
import { useChatConfiguration } from "../Configuration";

export function InsertEmojiButton({
    onSelect,
    ...props
}: Omit<ButtonProps, "onClick" | "onSelect"> & { onSelect?: (emoji: EmojiData) => void }): JSX.Element {
    const colour = useColorModeValue("blue.600", "blue.200");
    const focusColour = "yellow.500";
    const activeColour = "yellow.500";

    const config = useChatConfiguration();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const emojiMart = useEmojiMart();

    return (
        <Popover isOpen={isOpen} isLazy onClose={onClose} autoFocus={false} placement="top-end">
            <PopoverTrigger>
                <Button
                    aria-label="Open emoji picker"
                    color={colour}
                    p={config.spacing}
                    m="3px"
                    w="auto"
                    h="auto"
                    background="none"
                    fontSize={config.fontSizeRange.value}
                    {...props}
                    onClick={() => {
                        emojiMart.setOnSelect({
                            f: (data) => {
                                onClose();
                                onSelect?.(data);
                            },
                        });
                        onOpen();
                    }}
                >
                    <FAIcon
                        _focus={{
                            color: focusColour,
                        }}
                        _hover={{
                            color: focusColour,
                        }}
                        _active={{
                            color: activeColour,
                        }}
                        iconStyle="s"
                        icon="grin"
                        transition="all 0.5s ease-in"
                    />
                </Button>
            </PopoverTrigger>
            <Portal>
                <PopoverContent>
                    <OutPortal node={emojiMart.portalNode} />
                </PopoverContent>
            </Portal>
        </Popover>
    );
}
