import {
    Popover,
    PopoverArrow,
    PopoverBody,
    PopoverContent,
    PopoverTrigger,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import React from "react";
import useIsNarrowView from "../../../../../Hooks/useIsNarrowView";
import type { IconProps } from "./ControlBarButton";
import { ControlBarButton } from "./ControlBarButton";

export function ControlBarButtonGroup({
    label,
    icon,
    children,
    noCollapse = false,
    isVisible = true,
}: React.PropsWithChildren<{
    label: string;
    icon?: string | IconProps;
    isVisible?: boolean;
    noCollapse?: boolean;
}>): JSX.Element {
    const narrowView = useIsNarrowView();
    const { isOpen, onClose, onToggle } = useDisclosure();

    return !isVisible ? (
        <></>
    ) : narrowView && !noCollapse ? (
        <Popover isOpen={isOpen} onClose={onClose} placement="top">
            <PopoverTrigger>
                <ControlBarButton
                    label={label}
                    isActive={isOpen}
                    icon={icon ? icon : { active: "chevron-down", inactive: "chevron-up" }}
                    onClick={onToggle}
                />
            </PopoverTrigger>
            <PopoverContent onClick={onClose} w="calc(2.5rem + 6px)">
                <PopoverArrow />
                <PopoverBody>
                    <VStack>{children}</VStack>
                </PopoverBody>
            </PopoverContent>
        </Popover>
    ) : (
        <>{children}</>
    );
}
