import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
    ButtonGroup,
    Text,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import React, { useContext, useEffect, useRef } from "react";
import { VonageComputedStateContext } from "../State/VonageComputedStateContext";
import { StateType } from "../State/VonageGlobalState";
import { useVonageGlobalState } from "../State/VonageGlobalStateProvider";
import { useVonageRoom } from "../State/VonageRoomProvider";

export function RecordingAlert(): JSX.Element {
    const leastDestructiveRef = useRef<HTMLButtonElement | null>(null);

    const vonage = useVonageGlobalState();
    const { settings } = useVonageRoom();
    const { isRecordingActive, leaveRoom, recentlyConnected, recentlyToggledRecording, setRecentlyToggledRecording } =
        useContext(VonageComputedStateContext);
    const recordingAlert_LeastDestructiveRef = useRef<HTMLButtonElement | null>(null);

    const {
        isOpen: isRecordingAlertOpen,
        onOpen: onRecordingAlertOpen,
        onClose: onRecordingAlertClose,
    } = useDisclosure();

    useEffect(() => {
        if (!isRecordingActive || vonage.state.type !== StateType.Connected) {
            onRecordingAlertClose();
        }
    }, [isRecordingActive, onRecordingAlertClose, vonage.state.type]);

    useEffect(() => {
        if (isRecordingActive && !recentlyConnected && !recentlyToggledRecording) {
            onRecordingAlertOpen();
        }
        setRecentlyToggledRecording(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isRecordingActive]);

    return (
        <>
            <AlertDialog
                isOpen={Boolean(settings.completeGetAccessToken)}
                onClose={() => {
                    // Empty
                }}
                leastDestructiveRef={leastDestructiveRef}
            >
                <AlertDialogOverlay />
                <AlertDialogContent>
                    <AlertDialogHeader>Video is being recorded</AlertDialogHeader>
                    <AlertDialogBody>
                        <VStack spacing={4} alignItems="flex-start">
                            <Text>
                                The video-chat you are about to join{" "}
                                {settings.eventIsFuture
                                    ? "will be recorded when the event starts"
                                    : "is being recorded"}
                                .
                            </Text>
                            <Text>
                                By clicking Join below you consent to being recorded and for the recording to be owned
                                and managed by the organizers of this conference.
                            </Text>
                            <Text>For further information, please speak to your conference organizers.</Text>
                        </VStack>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <ButtonGroup spacing={2}>
                            <Button
                                ref={leastDestructiveRef}
                                onClick={() => {
                                    settings.completeGetAccessToken?.reject?.("Declined to be recorded");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    settings.completeGetAccessToken?.resolve?.();
                                }}
                                colorScheme="PrimaryActionButton"
                            >
                                Join
                            </Button>
                        </ButtonGroup>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog
                isOpen={isRecordingAlertOpen}
                onClose={onRecordingAlertClose}
                leastDestructiveRef={recordingAlert_LeastDestructiveRef}
            >
                <AlertDialogOverlay />
                <AlertDialogContent>
                    <AlertDialogHeader>Recording has started</AlertDialogHeader>
                    <AlertDialogBody>
                        <VStack>
                            <Text>
                                Recording of the video-call in this room has started. The recording will be managed by
                                the conference and be made available to you when recording ends. For further
                                information, please contact your conference organizers.
                            </Text>
                            <Text>You can find recordings under the My Stuff menu on the left.</Text>
                        </VStack>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <ButtonGroup spacing={2}>
                            <Button
                                onClick={() => {
                                    leaveRoom();
                                    onRecordingAlertClose();
                                }}
                            >
                                Disconnect
                            </Button>
                            <Button
                                ref={recordingAlert_LeastDestructiveRef}
                                colorScheme="PrimaryActionButton"
                                onClick={() => onRecordingAlertClose()}
                            >
                                Ok, stay connected
                            </Button>
                        </ButtonGroup>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
