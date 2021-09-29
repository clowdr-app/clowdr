import { Button, ButtonProps, useColorModeValue } from "@chakra-ui/react";
import type { EmojiData } from "emoji-mart";
import React from "react";
import FAIcon from "../../Icons/FAIcon";
import { useChatConfiguration } from "../Configuration";
import { useEmojiPicker } from "../EmojiPickerProvider";

export function InsertEmojiButton({
    onSelect,
    ...props
}: Omit<ButtonProps, "onClick" | "onSelect"> & { onSelect?: (emoji: EmojiData) => void }): JSX.Element {
    const colour = useColorModeValue("ChatAddEmojiButton.color-light", "ChatAddEmojiButton.color-dark");
    const focusColour = useColorModeValue("ChatAddEmojiButton.focusColor-light", "ChatAddEmojiButton.focusColor-dark");
    const activeColour = useColorModeValue(
        "ChatAddEmojiButton.activeColor-light",
        "ChatAddEmojiButton.activeColor-dark"
    );

    const config = useChatConfiguration();
    const emojiMart = useEmojiPicker();

    return (
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
                emojiMart.open(onSelect);
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
    );
}
