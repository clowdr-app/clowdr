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
import React, { useEffect, useState } from "react";

interface Props {
    isOpen: boolean;
    onOpen: () => void;
    onClose: (madeSelection: boolean, cameraId?: string | null, microphoneId?: string | null) => void;
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
    const [mediaDevices, setMediaDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string | null>(cameraId);
    const [selectedMicrophone, setSelectedMicrophone] = useState<string | null>(microphoneId);

    useEffect(() => {
        async function effect() {
            const devices = await navigator.mediaDevices.enumerateDevices();
            setMediaDevices(devices);
        }
        if (isOpen) {
            effect();
        }
    }, [isOpen]);

    function doClose() {
        onClose(true, selectedCamera, selectedMicrophone);
    }

    function doCancel() {
        onClose(false);
        setSelectedCamera(cameraId);
        setSelectedMicrophone(microphoneId);
    }

    return (
        <>
            <Modal scrollBehavior="inside" onClose={doCancel} isOpen={isOpen} motionPreset="scale">
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
                                    onChange={(e) => (e.target.value === "" ? null : setSelectedCamera(e.target.value))}
                                >
                                    {mediaDevices
                                        .filter((device) => device.kind === "videoinput")
                                        .map((device) => (
                                            <option key={device.deviceId} value={device.deviceId}>
                                                {device.label}
                                            </option>
                                        ))}
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
                                        e.target.value === "" ? null : setSelectedMicrophone(e.target.value)
                                    }
                                >
                                    {mediaDevices
                                        .filter((device) => device.kind === "audioinput")
                                        .map((device) => (
                                            <option key={device.deviceId} value={device.deviceId}>
                                                {device.label}
                                            </option>
                                        ))}
                                </Select>
                            </>
                        ) : undefined}
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={doClose} colorScheme="green" mt={5}>
                            Save
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
