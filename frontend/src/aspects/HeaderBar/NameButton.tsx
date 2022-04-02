import { useColorModeValue } from "@chakra-ui/react";
import React from "react";
import { LinkButton } from "../Chakra/LinkButton";
import { defaultOutline_AsBoxShadow } from "../Chakra/Outline";
import { useMaybeConference } from "../Conference/useConference";
import { useAuthParameters } from "../GQL/AuthParameters";
import useIsNarrowView from "../Hooks/useIsNarrowView";

export default function NameButton(): JSX.Element {
    const maybeConference = useMaybeConference();
    const { conferencePath } = useAuthParameters();
    const narrowView = useIsNarrowView();

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
            to={conferencePath ?? "/"}
            fontSize={narrowView ? "md" : "xl"}
            variant="ghost"
            linkProps={{
                justifyContent: "flex-start",
                alignItems: "center",
                display: "flex",
                m: "3px",
                mr: "auto",
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
            p={narrowView ? 1 : 3}
            h="auto"
            minH="0"
            _hover={{}}
            _focus={{}}
            _active={{}}
            whiteSpace="normal"
        >
            {maybeConference?.shortName ?? "Midspace"}
        </LinkButton>
    );
}
