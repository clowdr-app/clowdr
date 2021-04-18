import { chakra } from "@chakra-ui/react";
import { useAudioInputs, useSelectAudioInputDevice } from "amazon-chime-sdk-component-library-react";
import React from "react";
import { DeviceInput } from "./DeviceInput";

function MicrophoneSelectionInner({
    notFoundMsg = "No microphone devices found",
    label = "Microphone source",
    className,
}: {
    notFoundMsg?: string;
    label?: string;
    className?: string;
}): JSX.Element {
    const selectAudioInput = useSelectAudioInputDevice();
    const { devices, selectedDevice } = useAudioInputs();

    return (
        <DeviceInput
            label={label}
            onChange={selectAudioInput}
            devices={devices}
            selectedDeviceId={selectedDevice}
            notFoundMsg={notFoundMsg}
            className={className}
        />
    );
}

export const MicrophoneSelection = chakra(MicrophoneSelectionInner);
