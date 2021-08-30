// Copyright 2020-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { chakra, FormControl, FormLabel, Select } from "@chakra-ui/react";
import type { DeviceType, SelectedDeviceId } from "amazon-chime-sdk-component-library-react/lib/types";
import React, { ChangeEvent } from "react";

interface Props {
    label: string;
    notFoundMsg: string;
    devices: DeviceType[];
    selectedDeviceId: SelectedDeviceId;
    onChange: (deviceId: string) => void;
    className?: string;
}

function DeviceInputInner({ onChange, label, devices, selectedDeviceId, notFoundMsg, className }: Props): JSX.Element {
    const outputOptions = devices.map((device) => ({
        value: device.deviceId,
        label: device.label,
    }));

    const options = outputOptions.length
        ? outputOptions
        : [
              {
                  value: "not-available",
                  label: notFoundMsg,
              },
          ];

    async function selectDevice(e: ChangeEvent<HTMLSelectElement>) {
        const deviceId = e.target.value;

        if (deviceId === "not-available") {
            return;
        }
        onChange(deviceId);
    }

    return (
        <FormControl className={className}>
            <FormLabel>{label}</FormLabel>
            <Select onChange={selectDevice} value={selectedDeviceId ?? undefined}>
                {options.map((option) => (
                    <option value={option.value} key={option.value}>
                        {option.label}
                    </option>
                ))}
            </Select>
        </FormControl>
    );
}

export const DeviceInput = chakra(DeviceInputInner);
