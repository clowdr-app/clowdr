import { Button, ButtonProps, chakra, Menu, MenuButton, MenuList, Portal, useBreakpointValue } from "@chakra-ui/react";
import React from "react";
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
    return (
        <Menu placement={side === "left" ? "right" : "left"} colorScheme={props.colorScheme}>
            <MenuButton
                as={Button}
                aria-label={label}
                size={size}
                p={0}
                minW="100%"
                textAlign="left"
                justifyContent="flex-start"
                {...props}
            >
                <FAIcon iconStyle={iconStyle} icon={icon} ml={3} mr={2} />
                <chakra.span fontSize="sm" ml={1} mr={2}>
                    {label}
                </chakra.span>
            </MenuButton>
            <Portal>
                <MenuList zIndex={2} maxH="100vh" overflow="auto">
                    {children}
                </MenuList>
            </Portal>
        </Menu>
    );
}
