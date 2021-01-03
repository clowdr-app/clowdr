import { Optional } from "@ahanapediatrics/ahana-fp";
import { VmShape, VolumeMeter } from "@ahanapediatrics/react-volume-meter";
import { Box, HStack, useColorModeValue, useToast } from "@chakra-ui/react";
import React, { useEffect } from "react";
import { useVonageRoom } from "../../../Vonage/useVonageRoom";
import PlaceholderImage from "./PlaceholderImage";

export const AudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

export function PreJoin({ cameraPreviewRef }: { cameraPreviewRef: React.RefObject<HTMLVideoElement> }): JSX.Element {
    const { state, dispatch } = useVonageRoom();
    const toast = useToast();
    const placeholderColour = useColorModeValue("black", "white");

    useEffect(() => {
        if (cameraPreviewRef.current) {
            cameraPreviewRef.current.srcObject = state.cameraStream;
        } else {
            throw new Error("Failed to start camera: element missing");
        }
    }, [cameraPreviewRef, state.cameraStream, toast]);

    return (
        <HStack>
            <Box position="relative">
                <Box position="absolute" width="50%" top="50%" left="50%" transform="translate(-50%,-50%)">
                    <PlaceholderImage colour={placeholderColour} />
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
        </HStack>
    );
}
