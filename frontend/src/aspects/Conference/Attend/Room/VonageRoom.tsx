import { gql } from "@apollo/client";
import { SettingsIcon } from "@chakra-ui/icons";
import { Box, Button, HStack, Text, useDisclosure, useToast, VStack } from "@chakra-ui/react";
import React, { useCallback, useEffect, useRef } from "react";
import { useGetRoomVonageTokenMutation } from "../../../../generated/graphql";
import FAIcon from "../../../Icons/FAIcon";
import useOpenTok from "../../../Vonage/useOpenTok";
import { useVonageRoom, VonageRoomStateActionType, VonageRoomStateProvider } from "../../../Vonage/useVonageRoom";
import DeviceChooserModal from "./DeviceChooserModal";

gql`
    mutation GetRoomVonageToken($roomId: uuid!) {
        joinRoomVonageSession(roomId: $roomId) {
            accessToken
            sessionId
        }
    }
`;

export default function VonageRoom({ roomId }: { roomId: string }): JSX.Element {
    const [openTokProps, openTokMethods] = useOpenTok();
    const [getRoomVonageToken] = useGetRoomVonageTokenMutation({
        variables: {
            roomId,
        },
    });

    const joinRoom = useCallback(async () => {
        const result = await getRoomVonageToken();

        if (!result.data?.joinRoomVonageSession?.accessToken || !result.data.joinRoomVonageSession.sessionId) {
            return;
        }

        const session = await openTokMethods.initSession({
            apiKey: import.meta.env.SNOWPACK_PUBLIC_OPENTOK_API_KEY,
            sessionId: result.data.joinRoomVonageSession.sessionId,
            sessionOptions: {},
        });

        await openTokMethods.initPublisher({
            element: "my-video",
            name: "camera",
            options: {},
        });

        await openTokMethods.connectSession(result.data.joinRoomVonageSession.accessToken, session);

        await openTokMethods.publishPublisher({ name: "camera" });
    }, [getRoomVonageToken, openTokMethods]);

    return (
        <VonageRoomStateProvider>
            <Box minH="100%" display="grid" gridTemplateRows="1fr auto">
                <Box>
                    {openTokProps.session ? (
                        openTokProps.session.connection ? (
                            <Box textAlign="center">
                                <Button
                                    mt={5}
                                    onClick={() => {
                                        try {
                                            openTokMethods.unpublish({ name: "camera" });
                                        } catch (e) {
                                            console.warn("Could not unpublish own video");
                                        }
                                        try {
                                            openTokMethods.removePublisher({ name: "camera" });
                                        } catch (e) {
                                            console.warn("Could not remove own video publisher");
                                        }
                                        openTokMethods.disconnectSession();
                                    }}
                                >
                                    Disconnect
                                </Button>
                            </Box>
                        ) : (
                            <Text>Connecting</Text>
                        )
                    ) : (
                        <VStack justifyContent="center" height="100%">
                            <Box height="50%">
                                <CameraPreview />
                            </Box>
                        </VStack>
                    )}
                </Box>
                <VonageRoomControlBar onJoinRoom={joinRoom} />
            </Box>
        </VonageRoomStateProvider>
    );
}

function CameraPreview(): JSX.Element {
    const { state, dispatch } = useVonageRoom();
    const cameraPreviewRef = useRef<HTMLVideoElement>(null);
    const toast = useToast();

    const startCamera = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetCameraIntendedState,
            cameraEnabled: true,
        });
    }, [dispatch]);

    const stopCamera = useCallback(() => {
        dispatch({
            type: VonageRoomStateActionType.SetCameraIntendedState,
            cameraEnabled: false,
        });
    }, [dispatch]);

    useEffect(() => {
        if (cameraPreviewRef.current) {
            cameraPreviewRef.current.srcObject = state.cameraStream;
        } else {
            throw new Error("Failed to start camera: element missing");
        }
    }, [state.cameraStream, toast]);

    return (
        <HStack>
            <video
                ref={cameraPreviewRef}
                style={{
                    background: "gray.100",
                    height: "300px",
                    width: "300px",
                    objectFit: "cover",
                }}
            />
            <VStack alignItems="left">
                {state.cameraStream ? (
                    <Button onClick={stopCamera}>
                        <FAIcon icon="video" iconStyle="s" mr="auto" />
                        <span style={{ marginLeft: "1rem" }}>Stop video</span>
                    </Button>
                ) : (
                    <Button onClick={startCamera}>
                        <FAIcon icon="video" iconStyle="s" mr="auto" />
                        <span style={{ marginLeft: "1rem" }}>Start video</span>
                    </Button>
                )}
                <Button>
                    <FAIcon icon="microphone" iconStyle="s" mr="auto" />
                    <span style={{ marginLeft: "1rem" }}>Start microphone</span>
                </Button>
            </VStack>
        </HStack>
    );
}

function VonageRoomControlBar({ onJoinRoom }: { onJoinRoom: () => void }): JSX.Element {
    const { state, dispatch } = useVonageRoom();
    const { isOpen, onClose, onOpen } = useDisclosure();

    return (
        <>
            <HStack>
                <Button leftIcon={<SettingsIcon />} onClick={onOpen}>
                    Settings
                </Button>
                <Button ml="auto">Join Room</Button>
            </HStack>
            <DeviceChooserModal
                cameraId={state.preferredCameraId}
                microphoneId={state.preferredMicrophoneId}
                isOpen={isOpen}
                onChangeCamera={(cameraId) =>
                    dispatch({ type: VonageRoomStateActionType.SetPreferredCamera, cameraId })
                }
                onChangeMicrophone={(microphoneId) =>
                    dispatch({ type: VonageRoomStateActionType.SetPreferredMicrophone, microphoneId })
                }
                onClose={onClose}
                onOpen={onOpen}
            />
        </>
    );
}
