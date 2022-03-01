import type { ButtonProps } from "@chakra-ui/react";
import { Button, chakra, Image, Menu, MenuButton, MenuList, Portal } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../Chakra/FAIcon";

export default function MoreOptionsMenuButton({
    label,
    iconStyle,
    icon,
    side,
    children,
    showLabel,
    imageSrc,
    ...props
}: ButtonProps & {
    label: string;
    iconStyle: "b" | "s" | "r";
    icon: string;
    side: "left" | "right";
    children: React.ReactNode | React.ReactNodeArray;
    showLabel: boolean;
    imageSrc?: string;
}): JSX.Element {
    return (
        <Menu placement={side === "left" ? "right" : "left"} colorScheme={props.colorScheme}>
            <MenuButton
                as={Button}
                aria-label={label}
                p={2}
                pl={3}
                minW="100%"
                textAlign="left"
                justifyContent="flex-start"
                fontSize="lg"
                {...props}
            >
                {imageSrc ? (
                    <Image
                        display="inline-block"
                        title="Your profile photo"
                        src={imageSrc}
                        w={6}
                        mr={2}
                        borderRadius="100%"
                    />
                ) : (
                    <FAIcon iconStyle={iconStyle} icon={icon} w={6} mr={3} textAlign="center" />
                )}
                <chakra.span fontSize="sm">{label}</chakra.span>
            </MenuButton>
            <Portal>
                <MenuList zIndex={2} maxH="100vh" overflow="auto">
                    {children}
                </MenuList>
            </Portal>
        </Menu>
    );
}
