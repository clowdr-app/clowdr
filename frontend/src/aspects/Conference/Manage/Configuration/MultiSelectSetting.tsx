import React, { useMemo } from "react";
import type { Conference_ConfigurationKey_Enum } from "../../../../generated/graphql";
import MultiSelect from "../../../Chakra/MultiSelect";

export default function MultiSelectSetting({
    settingName,
    value,
    onChange,
    isDisabled,
    isUpdating,
    options,
}: {
    settingName: Conference_ConfigurationKey_Enum;
    value: string[];
    onChange: (value: string[]) => void;
    isDisabled?: boolean;
    isUpdating?: boolean;
    options: readonly { label: string; value: string }[];
}): JSX.Element {
    const value_ = useMemo(() => options.filter((x) => value.includes(x.value)), [options, value]);

    return (
        <MultiSelect
            name={settingName}
            options={options}
            value={value_}
            isMulti
            isDisabled={isDisabled}
            isUpdating={isUpdating}
            onChange={(newValue) => {
                onChange(newValue.map((x) => x.value));
            }}
            closeMenuOnSelect={true}
            blurInputOnSelect={true}
        />
    );
}
