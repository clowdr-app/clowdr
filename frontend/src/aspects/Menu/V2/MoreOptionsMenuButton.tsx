import type {
    ButtonProps} from "@chakra-ui/react";
import {
    Button,
    chakra,
    Image,
    Menu,
    MenuButton,
    MenuList,
    Portal,
    useBreakpointValue,
} from "@chakra-ui/react";
import React from "react";
import { FAIcon } from "../../Icons/FAIcon";
import { useIntl } from "react-intl";

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
    const intl = useIntl();
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
                p={2}
                minW="100%"
                textAlign={showLabel ? "left" : "center"}
                justifyContent={showLabel ? "flex-start" : "center"}
                {...props}
            >
                {imageSrc ? (
                    <Image
                        display="inline-block"
                        title={intl.formatMessage({ id: 'menu.v2.moreoptionsmenubutton.yourprofilephoto', defaultMessage: "Your profile photo" })}
                        src={imageSrc}
                        w={showLabel ? 6 : 8}
                        mr={showLabel ? 2 : 0}
                        borderRadius="100%"
                    />
                ) : (
                    <FAIcon iconStyle={iconStyle} icon={icon} w={6} mr={showLabel ? 2 : 0} textAlign="center" />
                )}
                {showLabel ? <chakra.span fontSize="sm">{label}</chakra.span> : undefined}
            </MenuButton>
            <Portal>
                <MenuList zIndex={2} maxH="100vh" overflow="auto">
                    {children}
                </MenuList>
            </Portal>
        </Menu>
    );
}
