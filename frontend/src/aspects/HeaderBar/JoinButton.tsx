import { useColorModeValue } from "@chakra-ui/react";
import React from "react";
import { LinkButton } from "../Chakra/LinkButton";
import { defaultOutline_AsBoxShadow } from "../Chakra/Outline";

export default function JoinButton(): JSX.Element {
    const titleHoverBgColor = useColorModeValue(
        "MainMenuHeaderBar.titleHoverBackgroundColor-light",
        "MainMenuHeaderBar.titleHoverBackgroundColor-dark"
    );
    const titleFocusBgColor = useColorModeValue(
        "MainMenuHeaderBar.titleFocusBackgroundColor-light",
        "MainMenuHeaderBar.titleFocusBackgroundColor-dark"
    );

    return (
        <LinkButton
            to="/join"
            fontSize="sm"
            variant="ghost"
            linkProps={{
                m: "3px",
                p: 0,
                borderRadius: 0,
                h: "calc(100% - 3px)",
                _hover: {
                    bgColor: titleHoverBgColor,
                },
                _focus: {
                    bgColor: titleFocusBgColor,
                    boxShadow: defaultOutline_AsBoxShadow,
                },
                _active: {
                    bgColor: titleFocusBgColor,
                    boxShadow: defaultOutline_AsBoxShadow,
                },
            }}
            m={0}
            p={3}
            h="auto"
            minH="0"
            _hover={{}}
            _focus={{}}
            _active={{}}
        >
            Use invite
        </LinkButton>
    );
}
