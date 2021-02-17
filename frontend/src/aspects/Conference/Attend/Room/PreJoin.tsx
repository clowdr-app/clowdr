import { Optional } from "@ahanapediatrics/ahana-fp";
import { VmShape, VolumeMeter } from "@ahanapediatrics/react-volume-meter";
import { Box, Center, Heading, useToast, VStack } from "@chakra-ui/react";
import React, { useEffect } from "react";
import { backgroundImage } from "../../../Vonage/resources";
import { useVonageRoom } from "../../../Vonage/useVonageRoom";

export const AudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

export function PreJoin({ cameraPreviewRef }: { cameraPreviewRef: React.RefObject<HTMLVideoElement> }): JSX.Element {
    const { state } = useVonageRoom();
    const toast = useToast();

    useEffect(() => {
        if (cameraPreviewRef.current) {
            cameraPreviewRef.current.srcObject = state.cameraStream;
        } else {
            throw new Error("Failed to start camera: element missing");
        }
    }, [cameraPreviewRef, state.cameraStream, toast]);

    return (
        <VStack>
            <Heading fontSize="3xl">Preview</Heading>
            <Box position="relative">
                <Box position="absolute" width="100%" height="100%">
                    <Box
                        position="absolute"
                        width="100%"
                        height="100%"
                        bgColor="black"
                        bgImage={backgroundImage}
                        bgRepeat="no-repeat"
                        bgSize="auto 76%"
                        bgPos="center bottom"
                        opacity="0.25"
                    />
                    <Center position="absolute" w="100%" h="100%" t="0" l="0">
                        <Box bgColor="rgba(0,0,0,0.5)" p={4} fontSize="lg" color="white" whiteSpace="normal">
                            Your camera is not switched on.
                        </Box>
                    </Center>
                </Box>
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
        </VStack>
    );
}
