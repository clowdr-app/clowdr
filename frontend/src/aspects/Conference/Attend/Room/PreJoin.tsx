import { Optional } from "@ahanapediatrics/ahana-fp";
import { VmShape, VolumeMeter } from "@ahanapediatrics/react-volume-meter";
import { Box, Center, chakra, HStack, useToast, VStack } from "@chakra-ui/react";
import React, { useEffect } from "react";
import { FAIcon } from "../../../Icons/FAIcon";
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
        <VStack w="auto">
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
                        opacity: state.cameraIntendedEnabled ? "1" : "0",
                    }}
                />
                <HStack position="absolute" bottom="10px" right="20px" w="auto" h="min-content">
                    {state.microphoneStream &&
                    state.microphoneStream
                        .getAudioTracks()
                        .some((track) => track.enabled && track.readyState === "live") ? (
                        <>
                            <VolumeMeter
                                audioContext={AudioContext}
                                height={25}
                                width={50}
                                shape={VmShape.VM_FLAT}
                                stream={Optional.of(state.microphoneStream)}
                                blocks={10}
                                css={{
                                    w: "100%",
                                }}
                            />
                            <chakra.div w="2rem" h="2rem" bgColor="rgba(50,50,50,0.8)" borderRadius="50%">
                                <FAIcon
                                    iconStyle="s"
                                    icon="volume-up"
                                    fixedWidth={true}
                                    fontSize="lg"
                                    color="white"
                                    __css={{
                                        textAlign: "center",
                                        display: "block",
                                        w: "100%",
                                        h: "100%",
                                        i: {
                                            verticalAlign: "middle",
                                        },
                                    }}
                                    borderRadius="50%"
                                />
                            </chakra.div>
                        </>
                    ) : (
                        <chakra.div w="2rem" h="2rem" bgColor="rgba(50,50,50,0.8)" borderRadius="50%">
                            <FAIcon
                                iconStyle="s"
                                icon="volume-mute"
                                fixedWidth={true}
                                fontSize="lg"
                                color="white"
                                __css={{
                                    textAlign: "center",
                                    display: "block",
                                    w: "100%",
                                    h: "100%",
                                    i: {
                                        verticalAlign: "middle",
                                    },
                                }}
                                borderRadius="50%"
                            />
                        </chakra.div>
                    )}
                </HStack>
            </Box>
        </VStack>
    );
}
