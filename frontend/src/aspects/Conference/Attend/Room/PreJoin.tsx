import { Optional } from "@ahanapediatrics/ahana-fp";
import { VmShape, VolumeMeter } from "@ahanapediatrics/react-volume-meter";
import { Alert, AlertIcon, Box, CloseButton, useToast, VStack } from "@chakra-ui/react";
import React, { useEffect } from "react";
import { useRestorableState } from "../../../Generic/useRestorableState";
import { useVonageRoom } from "../../../Vonage/useVonageRoom";
import PlaceholderImage from "./PlaceholderImage";

export const AudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

export function PreJoin({ cameraPreviewRef }: { cameraPreviewRef: React.RefObject<HTMLVideoElement> }): JSX.Element {
    const { state } = useVonageRoom();
    const toast = useToast();
    const [dismissHelpMessage, setDismissHelpMessage] = useRestorableState<boolean>(
        "clowdr-dismissCameraPreviewMessage",
        false,
        (x) => JSON.stringify(x),
        (x) => JSON.parse(x)
    );

    useEffect(() => {
        if (cameraPreviewRef.current) {
            cameraPreviewRef.current.srcObject = state.cameraStream;
        } else {
            throw new Error("Failed to start camera: element missing");
        }
    }, [cameraPreviewRef, state.cameraStream, toast]);

    return (
        <VStack>
            <Box position="relative">
                <PlaceholderImage />
                <video
                    ref={cameraPreviewRef}
                    autoPlay={true}
                    style={{
                        border: "1px solid gray",
                        height: "300px",
                        width: "300px",
                        objectFit: "cover",
                        transform: "rotateY(180deg)",
                    }}
                />
                <Box position="absolute" bottom="5" right="5">
                    {state.microphoneStream ? (
                        <VolumeMeter
                            audioContext={AudioContext}
                            height={50}
                            width={50}
                            shape={VmShape.VM_STEPPED}
                            stream={Optional.of(state.microphoneStream)}
                        />
                    ) : (
                        <></>
                    )}
                </Box>
            </Box>
            {!dismissHelpMessage ? (
                <Alert status="info" maxW="300px" borderRadius="md" pr={8} position="relative">
                    <AlertIcon />
                    Preview your camera here before joining! 🤳
                    <CloseButton
                        position="absolute"
                        right="8px"
                        top="8px"
                        onClick={() => setDismissHelpMessage(true)}
                    />
                </Alert>
            ) : (
                <></>
            )}
        </VStack>
    );
}
