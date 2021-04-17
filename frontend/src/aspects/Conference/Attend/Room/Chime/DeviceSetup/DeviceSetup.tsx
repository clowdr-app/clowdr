import { Box, Button, Heading, HStack } from "@chakra-ui/react";
import { useToast } from "@chakra-ui/toast";
import { useLocalVideo, useMeetingManager } from "amazon-chime-sdk-component-library-react";
import React, { useCallback, useState } from "react";
import { CameraDevices } from "./CameraDevices";
import { MicrophoneDevices } from "./MicrophoneDevices";

export function DeviceSetup(): JSX.Element {
    const toast = useToast();
    const meetingManager = useMeetingManager();
    const { isVideoEnabled, toggleVideo } = useLocalVideo();
    const [isLoading, setIsLoading] = useState(false);

    const handleJoinMeeting = useCallback(async () => {
        setIsLoading(true);
        try {
            // if (isVideoEnabled) {
            //     await toggleVideo();
            // }
            await meetingManager.start();
            setIsLoading(false);
        } catch (e) {
            setIsLoading(false);
            console.error("Failed to start meeting", e);
            toast({
                title: "Failed to join room",
            });
        }
    }, [isVideoEnabled, meetingManager, toast, toggleVideo]);

    return (
        <Box mt={4}>
            <HStack alignItems="flex-start">
                <Box flex={1} px={4}>
                    <Heading as="h2" mb={4}>
                        Microphone
                    </Heading>
                    <MicrophoneDevices />
                </Box>

                <Box flex={1} px={4}>
                    <Heading as="h2" mb={4}>
                        Camera
                    </Heading>
                    <CameraDevices />
                </Box>
            </HStack>
            <Box textAlign="center">
                <Button
                    onClick={handleJoinMeeting}
                    isLoading={isLoading}
                    my={4}
                    mx="auto"
                    colorScheme="green"
                    w="10em"
                    h="6ex"
                    fontSize="xl"
                >
                    Join meeting
                </Button>
            </Box>
        </Box>
    );
}
