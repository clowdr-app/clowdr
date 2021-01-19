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
}

export default function DeviceChooserModal({ isOpen, onClose, cameraId, microphoneId }: Props): JSX.Element {
    const [mediaDevices, setMediaDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedCamera, setSelectedCamera] = useState<string | null>(cameraId);
    const [selectedMicrophone, setSelectedMicrophone] = useState<string | null>(microphoneId);

    const [key, setKey] = useState<number>(0);

    useEffect(() => {
        async function effect() {
            const devices = await navigator.mediaDevices.enumerateDevices();
            setMediaDevices(devices);
        }
        if (isOpen) {
            effect();
        }
    }, [isOpen, key]);

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
                            value={selectedCamera ?? undefined}
                            onChange={(e) => (e.target.value === "" ? null : setSelectedCamera(e.target.value))}
                            onMouseDown={async () => {
                                await navigator.mediaDevices.getUserMedia({ video: true });
                                setKey((k) => k + 1);
                            }}
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
                            value={selectedMicrophone ?? undefined}
                            onChange={(e) => (e.target.value === "" ? null : setSelectedMicrophone(e.target.value))}
                            onMouseDown={async () => {
                                await navigator.mediaDevices.getUserMedia({ audio: true });
                                setKey((k) => k + 1);
                            }}
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
                        <Button onClick={doClose} colorScheme="green" mt={5}>
                            Save
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </>
    );
}
