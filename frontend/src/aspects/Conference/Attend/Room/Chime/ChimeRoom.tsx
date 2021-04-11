import { Box, Button, chakra, Text, useToast } from "@chakra-ui/react";
import {
    LocalVideo,
    MeetingStatus,
    useLocalVideo,
    useMeetingManager,
    useMeetingStatus,
} from "@clowdr-app/amazon-chime-sdk-component-library-react";
import React, { useCallback } from "react";
import ChatProfileModalProvider from "../../../../Chat/Frame/ChatProfileModalProvider";
import { ChimeRoomControlBar } from "./ChimeRoomControlBar";
import { ContentShare } from "./ContentShare";
import { DeviceSetup } from "./DeviceSetup";
import { PermissionsExplanationModal } from "./PermissionsExplanationModal";
import { VideoTiles } from "./VideoTiles";

export interface Meeting {
    MeetingId?: string;
    ExternalMeetingId?: string;
    MediaPlacement?: MediaPlacement;
    MediaRegion?: string;
}

export interface MediaPlacement {
    AudioHostUrl?: string;
    AudioFallbackUrl?: string;
    ScreenDataUrl?: string;
    ScreenSharingUrl?: string;
    ScreenViewingUrl?: string;
    SignalingUrl?: string;
    TurnControlUrl?: string;
}

export interface Attendee {
    ExternalUserId?: string;
    AttendeeId?: string;
    JoinToken?: string;
}

const MyLocalVideo = chakra(LocalVideo, {
    baseStyle: {
        pos: "relative",
        maxH: "200px",
    },
});

export function ChimeRoom({
    roomId,
    getMeetingData,
    disable,
}: {
    roomId?: string;
    getMeetingData?: () => Promise<{ meetingInfo: Meeting; attendeeInfo: Attendee }>;
    disable: boolean;
}): JSX.Element {
    const meetingManager = useMeetingManager();
    const { toggleVideo } = useLocalVideo();
    const toast = useToast();
    const meetingStatus = useMeetingStatus();

    const joinRoom = useCallback(async () => {
        try {
            const meetingData = await getMeetingData?.();

            if (!meetingData) {
                throw new Error("No meeting data returned");
            }

            await meetingManager.join(meetingData);
            console.log("Initialized meeting");
        } catch (e) {
            console.error("Failed to join Chime room", { err: e });
            toast({ title: "Failed to get join room", status: "error", description: e.message });
        }
    }, [getMeetingData, meetingManager, toast]);

    return (
        <>
            <ChatProfileModalProvider>
                <PermissionsExplanationModal />
                <Box>
                    <Box position="relative" width="100%">
                        {meetingManager.meetingSession && meetingStatus === MeetingStatus.Loading ? (
                            <DeviceSetup />
                        ) : undefined}

                        {!meetingManager.meetingSession ? (
                            <Box textAlign="center">
                                <Button
                                    colorScheme="green"
                                    w="10em"
                                    h="6ex"
                                    fontSize="xl"
                                    my={8}
                                    onClick={joinRoom}
                                    isLoading={false}
                                >
                                    Join Room
                                </Button>
                            </Box>
                        ) : undefined}

                        {meetingStatus === MeetingStatus.Succeeded ? (
                            <>
                                <ChimeRoomControlBar />
                                <ContentShare />
                                <VideoTiles />
                            </>
                        ) : undefined}

                        {meetingStatus === MeetingStatus.Ended ? <Text>Ended</Text> : undefined}
                        {meetingStatus === MeetingStatus.Failed ? <Text>Failed</Text> : undefined}
                    </Box>
                </Box>
            </ChatProfileModalProvider>
        </>
    );
}
