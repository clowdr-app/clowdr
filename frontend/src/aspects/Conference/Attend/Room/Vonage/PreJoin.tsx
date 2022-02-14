import { Optional } from "@ahanapediatrics/ahana-fp";
import { VmShape, VolumeMeter } from "@ahanapediatrics/react-volume-meter";
import { Box, Center, chakra, HStack, useConst, useToast } from "@chakra-ui/react";
import React, { useContext, useEffect } from "react";
import { AppLayoutContext } from "../../../../App/AppLayoutContext";
import FAIcon from "../../../../Chakra/FAIcon";
import { getAudioContext } from "../../../../Utils/getAudioContext";
import { VonageRoomControlBar } from "./ControlBar/VonageRoomControlBar";
import { backgroundImage } from "./resources";
import { VonageComputedStateContext } from "./State/VonageComputedStateContext";
import { useVonageRoom } from "./State/VonageRoomProvider";

export function PreJoin({
    cameraPreviewRef,
    roomId,
    eventId,
}: {
    cameraPreviewRef: React.RefObject<HTMLVideoElement>;
    roomId?: string;
    eventId?: string;
}): JSX.Element {
    const { state } = useVonageRoom();
    const { cancelJoin } = useContext(VonageComputedStateContext);
    const toast = useToast();
    const audioContext = useConst(getAudioContext());

    useEffect(() => {
        if (cameraPreviewRef.current) {
            cameraPreviewRef.current.srcObject = state.cameraStream;
        } else {
            throw new Error("Failed to start camera: element missing");
        }
    }, [cameraPreviewRef, state.cameraStream, toast]);

    const { mainPaneHeight } = useContext(AppLayoutContext);

    return (
        <HStack w="100%" h={`${mainPaneHeight}px`} alignItems="center" justifyContent="center">
            <Box position="relative" mb={4}>
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
                    <Center position="absolute" w="100%" h="100%" top="0" left="0">
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
                            {audioContext ? (
                                <VolumeMeter
                                    audioContext={audioContext}
                                    height={25}
                                    width={50}
                                    shape={VmShape.VM_FLAT}
                                    stream={Optional.of(state.microphoneStream)}
                                    blocks={10}
                                />
                            ) : undefined}
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
            <VonageRoomControlBar onCancelJoinRoom={cancelJoin} roomId={roomId} eventId={eventId} />
        </HStack>
    );
}
