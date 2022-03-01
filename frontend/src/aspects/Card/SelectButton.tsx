import type { IconButtonProps } from "@chakra-ui/react";
import { IconButton } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../Chakra/FAIcon";
import useSelectorColors from "./useSelectorColors";

export default function SelectButton({
    isSelected,
    isDisabled = false,
    onToggle,
    ...props
}: {
    isSelected: boolean;
    isDisabled?: boolean;
    onToggle?: () => void;
} & Omit<IconButtonProps, "aria-label">): JSX.Element {
    const { greyColor, outlineColor, strongColor } = useSelectorColors();

    return (
        <IconButton
            aria-label={isSelected ? "Deselect" : "Select"}
            icon={<FAIcon iconStyle="s" icon="check" />}
            colorScheme="blue"
            isDisabled={isDisabled}
            variant={isSelected ? "solid" : "outline"}
            onClick={(ev) => {
                ev.stopPropagation();
                onToggle?.();
            }}
            size="xs"
            color={isSelected ? "white" : "transparent"}
            border="2px solid"
            borderColor={isSelected ? strongColor : greyColor}
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
        />
    );
}
