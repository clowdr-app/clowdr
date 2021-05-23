import { Button, ButtonProps, Menu, MenuButton, MenuList, Portal, Tooltip, useBreakpointValue } from "@chakra-ui/react";
import React from "react";
import { defaultOutline_AsBoxShadow } from "../../Chakra/ChakraCustomProvider";
import { FAIcon } from "../../Icons/FAIcon";

export default function MoreOptionsMenuButton({
    label,
    iconStyle,
    icon,
    side,
    children,
    ...props
}: ButtonProps & {
    label: string;
    iconStyle: "b" | "s" | "r";
    icon: string;
    side: "left" | "right";
    children: React.ReactNodeArray;
}): JSX.Element {
    const size = useBreakpointValue({
        base: "md",
        lg: "lg",
    });
    const expandedFontSize = useBreakpointValue({
        base: "xl",
        lg: "2xl",
    });
    const barWidth = useBreakpointValue({
        base: "3.5em",
        lg: "4em",
    });
    return (
        <Menu placement={side === "left" ? "right" : "left"} colorScheme={props.colorScheme}>
            <Tooltip label={label}>
                <MenuButton
                    as={Button}
                    aria-label={label}
                    size={size}
                    minW={barWidth}
                    _hover={{
                        fontSize: expandedFontSize,
                        borderLeftRadius: side === "right" ? 2 : undefined,
                        borderRightRadius: side === "left" ? 2 : undefined,
                    }}
                    _focus={{
                        fontSize: expandedFontSize,
                        borderLeftRadius: side === "right" ? 2 : undefined,
                        borderRightRadius: side === "left" ? 2 : undefined,
                        boxShadow: defaultOutline_AsBoxShadow,
                        m: "2px",
                        mr: side === "right" ? 0 : undefined,
                        ml: side === "left" ? 0 : undefined,
                    }}
                    _active={{
                        fontSize: expandedFontSize,
                        borderLeftRadius: side === "right" ? 2 : undefined,
                        borderRightRadius: side === "left" ? 2 : undefined,
                        boxShadow: defaultOutline_AsBoxShadow,
                        m: "2px",
                        mr: side === "right" ? 0 : undefined,
                        ml: side === "left" ? 0 : undefined,
                    }}
                    {...props}
                >
                    <FAIcon iconStyle={iconStyle} icon={icon} />
                </MenuButton>
            </Tooltip>
            <Portal>
                <MenuList zIndex={2} maxH="100vh" overflow="auto">
                    {children}
                </MenuList>
            </Portal>
        </Menu>
    );
}
