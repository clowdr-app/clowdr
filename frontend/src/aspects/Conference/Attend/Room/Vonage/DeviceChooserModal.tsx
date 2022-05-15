import {
    Button,
    Heading,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

interface Props {
    isOpen: boolean;
    onClose: (
        actionPerformed:
            | "made-selection"
            | "cancelled"
            | "no-devices-available"
            | "device-permissions-not-granted"
            | "unable-to-list",
        cameraId?: string | null,
        microphoneId?: string | null
    ) => void;
    cameraId: string | null;
    microphoneId: string | null;
    showCamera: boolean;
    showMicrophone: boolean;
}

export default function DeviceChooserModal({
    isOpen,
    onClose,
    cameraId,
    microphoneId,
    showCamera,
    showMicrophone,
}: Props): JSX.Element {
    const [mediaDevices, setMediaDevices] = useState<null | MediaDeviceInfo[]>(null);
    const [selectedCamera, setSelectedCamera] = useState<string | null>(cameraId);
    const [selectedMicrophone, setSelectedMicrophone] = useState<string | null>(microphoneId);
    const [readyToOpen, setReadyToOpen] = useState<boolean>(false);

    useEffect(() => {
        async function effect() {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                if (devices.length === 0) {
                    onClose("no-devices-available");
                } else if (!devices.some((d) => d.label.length > 0)) {
                    onClose("device-permissions-not-granted");
                } else {
                    setMediaDevices(devices);
                    setReadyToOpen(true);
                }
            } catch (e) {
                console.log(e);
                onClose("unable-to-list");
            }
        }
        if (isOpen) {
            setReadyToOpen(false);
            effect();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const doClose = useCallback(() => {
        setReadyToOpen(false);
        onClose("made-selection", selectedCamera, selectedMicrophone);
    }, [onClose, selectedCamera, selectedMicrophone]);

    const doCancel = useCallback(() => {
        setReadyToOpen(false);
        onClose("cancelled");
        setSelectedCamera(cameraId);
        setSelectedMicrophone(microphoneId);
    }, [cameraId, microphoneId, onClose]);

    const availableCams = useMemo(
        () => mediaDevices?.filter((device) => device.kind === "videoinput" && device.label.length > 0),
        [mediaDevices]
    );
    const availableMics = useMemo(
        () => mediaDevices?.filter((device) => device.kind === "audioinput" && device.label.length > 0),
        [mediaDevices]
    );

    return (
        <>
            <Modal scrollBehavior="inside" onClose={doCancel} isOpen={readyToOpen} motionPreset="scale">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <Heading as="h3" size="md">
                            {showMicrophone ? "Microphone" : ""}
                            {showMicrophone && showCamera ? " and " : ""}
                            {showCamera ? "Camera" : ""}
                        </Heading>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {showCamera ? (
                            <>
                                <Heading as="h4" size="sm" textAlign="left" my={4}>
                                    Camera
                                </Heading>
                                <Select
                                    placeholder="Choose camera"
                                    value={selectedCamera ?? undefined}
                                    onChange={(e) =>
                                        e.target.value === ""
                                            ? setSelectedCamera(null)
                                            : setSelectedCamera(e.target.value)
                                    }
                                >
                                    {availableCams?.length ? (
                                        availableCams.map((device) => (
                                            <option key={device.deviceId} value={device.deviceId}>
                                                {device.label}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled value="">
                                            No devices available
                                        </option>
                                    )}
                                </Select>
                            </>
                        ) : undefined}
                        {showMicrophone ? (
                            <>
                                <Heading as="h4" size="sm" textAlign="left" my={4}>
                                    Microphone
                                </Heading>
                                <Select
                                    placeholder="Choose microphone"
                                    value={selectedMicrophone ?? undefined}
                                    onChange={(e) =>
                                        e.target.value === ""
                                            ? setSelectedMicrophone(null)
                                            : setSelectedMicrophone(e.target.value)
                                    }
                                >
                                    {availableMics?.length ? (
                                        availableMics.map((device) => (
                                            <option key={device.deviceId} value={device.deviceId}>
                                                {device.label}
                                            </option>
                                        ))
                                    ) : (
                                        <option disabled value="">
                                            No devices available
                                        </option>
                                    )}
                                </Select>
                            </>
                        ) : undefined}
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={doClose} colorScheme="PrimaryActionButton" mt={5}>
                            Save
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
