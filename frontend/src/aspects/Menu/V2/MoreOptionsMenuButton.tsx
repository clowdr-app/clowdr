import { Button, ButtonProps, Menu, MenuButton, MenuList, Portal, useBreakpointValue } from "@chakra-ui/react";
import React from "react";
import { defaultOutline_AsBoxShadow } from "../../Chakra/Outline";
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
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const size = useBreakpointValue({
        base: "md",
        lg: "lg",
    });
    const expandedFontSize = useBreakpointValue({
        base: "lg",
        lg: "xl",
    });
    return (
        <Menu placement={side === "left" ? "right" : "left"} colorScheme={props.colorScheme}>
            <MenuButton
                as={Button}
                aria-label={label}
                size={size}
                color="white"
                p={0}
                minW="100%"
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
                }}
                _active={{
                    fontSize: expandedFontSize,
                    borderLeftRadius: side === "right" ? 2 : undefined,
                    borderRightRadius: side === "left" ? 2 : undefined,
                    boxShadow: defaultOutline_AsBoxShadow,
                }}
                {...props}
            >
                <FAIcon iconStyle={iconStyle} icon={icon} />
            </MenuButton>
            <Portal>
                <MenuList zIndex={2} maxH="100vh" overflow="auto">
                    {children}
                </MenuList>
            </Portal>
        </Menu>
    );
}
