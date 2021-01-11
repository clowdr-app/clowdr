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
    onClose: () => void;
    onChangeCamera: (cameraId: string) => void;
    onChangeMicrophone: (microphoneId: string) => void;
    cameraId: string | null;
    microphoneId: string | null;
}

export default function DeviceChooserModal({
    isOpen,
    onClose,
    onChangeCamera,
    onChangeMicrophone,
    cameraId,
    microphoneId,
}: Props): JSX.Element {
    const [mediaDevices, setMediaDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string | null>();
    const [selectedMicrophone, setSelectedMicrophone] = useState<string | null>();

    useEffect(() => {
        async function effect() {
            const devices = await navigator.mediaDevices.enumerateDevices();
            setMediaDevices(devices);
        }
        if (isOpen) {
            effect();
        }
    }, [isOpen]);

    return (
        <>
            <Modal scrollBehavior="inside" onClose={onClose} isOpen={isOpen} motionPreset="scale">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        <Heading as="h3" size="lg">
                            Microphone and Camera
                        </Heading>
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <Heading as="h4" size="sm" textAlign="left" my={4}>
                            Camera
                        </Heading>
                        <Select
                            placeholder="Choose camera"
                            value={selectedCamera ?? cameraId ?? undefined}
                            onChange={(e) => setSelectedCamera(e.target.value)}
                        >
                            {mediaDevices
                                .filter((device) => device.kind === "videoinput")
                                .map((device) => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label}
                                    </option>
                                ))}
                        </Select>
                        <Heading as="h4" size="sm" textAlign="left" my={4}>
                            Microphone
                        </Heading>
                        <Select
                            placeholder="Choose microphone"
                            value={selectedMicrophone ?? microphoneId ?? undefined}
                            onChange={(e) => setSelectedMicrophone(e.target.value)}
                        >
                            {mediaDevices
                                .filter((device) => device.kind === "audioinput")
                                .map((device) => (
                                    <option key={device.deviceId} value={device.deviceId}>
                                        {device.label}
                                    </option>
                                ))}
                        </Select>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            onClick={() => {
                                if (selectedCamera && selectedCamera !== cameraId) {
                                    onChangeCamera(selectedCamera);
                                }
                                if (selectedMicrophone && selectedMicrophone !== microphoneId) {
                                    onChangeMicrophone(selectedMicrophone);
                                }
                                onClose();
                                setSelectedCamera(null);
                                setSelectedMicrophone(null);
                            }}
                            colorScheme="green"
                            mt={5}
                        >
                            Save
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
