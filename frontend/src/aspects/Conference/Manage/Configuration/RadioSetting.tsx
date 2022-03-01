import type { UseRadioProps } from "@chakra-ui/react";
import { Box, chakra, HStack, useRadio, useRadioGroup } from "@chakra-ui/react";
import React from "react";
import type { Conference_ConfigurationKey_Enum } from "../../../../generated/graphql";
import FAIcon from "../../../Chakra/FAIcon";

export default function RadioSetting({
    settingName,
    options,
    value,
    onChange,
}: {
    settingName: Conference_ConfigurationKey_Enum;
    options: { label: string; value: string }[];
    value: string;
    onChange: (value: string) => void;
}): JSX.Element {
    const { getRootProps, getRadioProps } = useRadioGroup({
        name: settingName,
        value,
        onChange,
    });

    const group: any = getRootProps();

    return (
        <HStack {...group} flexWrap="wrap" gridRowGap={2}>
            {options.map((option) => {
                const radio = getRadioProps({ value: option.value });
                return (
                    <RadioCard key={option.value} {...radio}>
                        {option.label}
                    </RadioCard>
                );
            })}
        </HStack>
    );
}

function RadioCard(props: React.PropsWithChildren<UseRadioProps>) {
    const {
        state: { isChecked },
        getInputProps,
        getCheckboxProps,
    } = useRadio(props);

    const input = getInputProps();
    const checkbox: any = getCheckboxProps();

    return (
        <Box as="label">
            <input {...input} />
            <Box
                {...checkbox}
                cursor="pointer"
                borderWidth="1px"
                borderRadius="md"
                boxShadow="md"
                _checked={{
                    bg: "PrimaryActionButton.600",
                    color: "PrimaryActionButton.textColor",
                    borderColor: "PrimaryActionButton.600",
                }}
                _focus={{
                    boxShadow: "outline",
                }}
                px={5}
                py={3}
            >
                <HStack>
                    {isChecked ? <FAIcon iconStyle="s" icon="check-circle" /> : undefined}
                    <chakra.span whiteSpace="nowrap">{props.children}</chakra.span>
                </HStack>
            </Box>
        </Box>
    );
}
