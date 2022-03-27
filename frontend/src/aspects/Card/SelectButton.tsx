import type { IconButtonProps } from "@chakra-ui/react";
import { IconButton } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../Chakra/FAIcon";
import useSelectorColors from "./useSelectorColors";

export default function SelectButton({
    isSelected,
    isIndeterminate = false,
    isDisabled = false,
    onToggle,
    ...props
}: {
    isSelected: boolean;
    isIndeterminate?: boolean;
    isDisabled?: boolean;
    onToggle?: () => void;
} & Omit<IconButtonProps, "aria-label">): JSX.Element {
    const { greyColor, outlineColor, strongColor } = useSelectorColors();

    return (
        <IconButton
            aria-label={isSelected ? "Deselect" : "Select"}
            icon={isIndeterminate ? <FAIcon iconStyle="s" icon="minus" /> : <FAIcon iconStyle="s" icon="check" />}
            colorScheme="blue"
            isDisabled={isDisabled}
            variant={isSelected || isIndeterminate ? "solid" : "outline"}
            onClick={(ev) => {
                ev.stopPropagation();
                onToggle?.();
            }}
            size="xs"
            color={isSelected || isIndeterminate ? "white" : "transparent"}
            border="2px solid"
            borderColor={isSelected || isIndeterminate ? strongColor : greyColor}
            _groupHover={{
                borderColor: outlineColor,
                color: outlineColor,
            }}
            _groupActive={{
                borderColor: outlineColor,
                color: outlineColor,
            }}
            _groupFocus={{
                borderColor: outlineColor,
                color: outlineColor,
            }}
            transition="none"
            {...props}
            bgColor={isSelected || isIndeterminate ? strongColor : props.bgColor}
        />
    );
}
