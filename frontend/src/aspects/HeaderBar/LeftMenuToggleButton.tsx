import { Box, Button, useColorModeValue, useToken } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../Chakra/FAIcon";
import { defaultOutline_AsBoxShadow } from "../Chakra/Outline";
import useIsNarrowView from "../Hooks/useIsNarrowView";
import { useNavigationState } from "../Menu/NavigationState";

export default function LeftMenuToggleButton({ toggle }: { toggle: () => void }): JSX.Element {
    const leftMenu_BgColor = useColorModeValue("LeftMenu.500", "LeftMenu.200");
    const leftMenu_BgColorVal = useToken("colors", leftMenu_BgColor);

    const narrowView = useIsNarrowView();
    const navState = useNavigationState();

    return (
        <Button
            onClick={toggle}
            variant="ghost"
            p={0}
            fontSize="2xl"
            w="3rem"
            minW={0}
            h="100%"
            borderTopRadius="2xl"
            borderBottomRadius="none"
            _hover={{
                bgColor: leftMenu_BgColor,
            }}
            _focus={{
                bgColor: leftMenu_BgColor,
                shadow: defaultOutline_AsBoxShadow,
            }}
            _active={{
                bgColor: leftMenu_BgColor,
                shadow: defaultOutline_AsBoxShadow,
            }}
            isDisabled={narrowView && navState.disabled}
        >
            <FAIcon iconStyle="s" icon="bars" />
            {!narrowView ? (
                <Box pos="absolute" bottom={0} left={0} w="100%">
                    <svg height="9" width="100%" viewBox="0 0 16 9">
                        <polygon points="8,0 0,10 16,10" fill={leftMenu_BgColorVal} />
                    </svg>
                </Box>
            ) : undefined}
        </Button>
    );
}
