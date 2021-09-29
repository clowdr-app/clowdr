import { Box, Button, Text, useToast } from "@chakra-ui/react";
import {
    MeetingStatus,
    useLocalVideo,
    useMeetingManager,
    useMeetingStatus,
} from "amazon-chime-sdk-component-library-react";
import React, { useCallback, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ChatProfileModalProvider from "../../../../Chat/Frame/ChatProfileModalProvider";
import { PermissionsExplanationModal } from "../VideoChat/PermissionsExplanationModal";
import { ChimeRoomControlBar } from "./ChimeRoomControlBar";
import { ContentShare } from "./ContentShare";
import { DeviceSetup } from "./DeviceSetup/DeviceSetup";
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

export function ChimeRoom({
    roomId,
    getMeetingData,
    disable,
}: {
    roomId: string;
    getMeetingData?: () => Promise<{ meetingInfo: Meeting; attendeeInfo: Attendee }>;
    disable: boolean;
}): JSX.Element {
    const location = useLocation();
    const locationParts = (location.pathname.startsWith("/") ? location.pathname.substr(1) : location.pathname).split(
        "/"
    );
    const roomCouldBeInUse = locationParts[0] === "conference" && locationParts[2] === "room";

    return (
        <>
            <ChatProfileModalProvider>
                <ChimeRoomInner stop={!roomCouldBeInUse || disable} getMeetingData={getMeetingData} roomId={roomId} />
            </ChatProfileModalProvider>
        </>
    );
}

function ChimeRoomInner({
    getMeetingData,
    stop,
    roomId,
}: {
    getMeetingData?: () => Promise<{ meetingInfo: Meeting; attendeeInfo: Attendee }>;
    stop: boolean;
    roomId: string;
}): JSX.Element {
    const meetingStatus = useMeetingStatus();
    const meetingManager = useMeetingManager();
    const { toggleVideo } = useLocalVideo();
    const toast = useToast();

    useEffect(() => {
        meetingManager.leave().catch((e) => console.error("Failed to leave Chime room", e));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roomId]);

    useEffect(() => {
        if (stop) {
            meetingManager.leave().catch((e) => console.error("Failed to leave Chime room", e));
        }
    }, [meetingManager, stop]);

    const joinRoom = useCallback(async () => {
        try {
            const meetingData = await getMeetingData?.();

            if (!meetingData) {
                throw new Error("No meeting data returned");
            }

            await meetingManager.join(meetingData);
            await toggleVideo();
            console.log("Initialized meeting");
        } catch (e) {
            console.error("Failed to join Chime room", { err: e });
            toast({ title: "Failed to get join room", status: "error", description: e.message });
        }
    }, [getMeetingData, meetingManager, toast, toggleVideo]);

    return (
        <>
            <PermissionsExplanationModal />
            <Box>
                <Box position="relative" width="100%">
                    {meetingManager.meetingSession && meetingStatus === MeetingStatus.Loading ? (
                        <>
                            <ChimeRoomControlBar />
                            <DeviceSetup />
                        </>
                    ) : undefined}

                    {!meetingManager.meetingSession ? (
                        <Box textAlign="center">
                            <Button
                                colorScheme="PrimaryActionButton"
                                w="10em"
                                h="6ex"
                                fontSize="xl"
                                my={8}
                                onClick={joinRoom}
                                isLoading={false}
                                variant="glowing"
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
        </>
    );
}
