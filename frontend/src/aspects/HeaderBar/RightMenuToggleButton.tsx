import { Box, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import HeaderBarButton from "./HeaderBarButton";

export default function RightMenuToggleButton({
    isOpen,
    setIsOpen,
}: {
    isOpen: boolean;
    setIsOpen: (value: boolean | ((old: boolean) => boolean)) => void;
}): JSX.Element {
    const buttonFocusBgColor = useColorModeValue(
        "MainMenuHeaderBar.buttonFocusBackgroundColor-light",
        "MainMenuHeaderBar.buttonFocusBackgroundColor-dark"
    );

    return (
        <HeaderBarButton
            label="Chat"
            iconStyle="s"
            icon="comment"
            onClick={() => {
                setIsOpen((old) => !old);
            }}
            bgColor={isOpen ? buttonFocusBgColor : undefined}
            mb={0}
        >
            {isOpen ? (
                <Box pos="absolute" bottom={0} left={0} w="100%">
                    <svg height="7" width="100%" viewBox="0 0 10 7">
                        <polygon points="5,0 0,8 10,8" fill="white" />
                    </svg>
                </Box>
            ) : undefined}
        </HeaderBarButton>
    );
}
