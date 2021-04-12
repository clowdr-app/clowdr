import { chakra } from "@chakra-ui/react";
import { useMeetingManager, useVideoInputs } from "@clowdr-app/amazon-chime-sdk-component-library-react";
import React from "react";
import { DeviceInput } from "./DeviceInput";

function CameraSelectionInner({
    notFoundMsg = "No camera devices found",
    label = "Camera source",
    className,
}: {
    notFoundMsg?: string;
    label?: string;
    className?: string;
}): JSX.Element {
    const meetingManager = useMeetingManager();
    const { devices, selectedDevice } = useVideoInputs();

    async function selectVideoInput(deviceId: string) {
        meetingManager.selectVideoInputDevice(deviceId);
    }

    return (
        <DeviceInput
            label={label}
            onChange={selectVideoInput}
            devices={devices}
            selectedDeviceId={selectedDevice}
            notFoundMsg={notFoundMsg}
            className={className}
        />
    );
}

export const CameraSelection = chakra(CameraSelectionInner);
