import { Button, Text, useToast } from "@chakra-ui/react";
import {
    LocalVideo,
    MeetingStatus,
    PreviewVideo,
    useLocalVideo,
    useMeetingManager,
    useMeetingStatus,
    VideoTileGrid,
} from "amazon-chime-sdk-component-library-react";
import React, { useCallback } from "react";
import styled from "styled-components";

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

const MyLocalVideo = styled<any>(LocalVideo)`
    ${(props) => "position: static"}
`;

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

            await meetingManager.start();
        } catch (e) {
            console.error("Failed to join Chime room", { err: e });
            toast({ title: "Failed to get join room", status: "error", description: e.message });
        }
    }, [getMeetingData, meetingManager, toast]);

    return (
        <>
            {meetingStatus === MeetingStatus.Loading ? (
                <PreviewVideo />
            ) : (
                <>
                    <VideoTileGrid
                        noRemoteVideoView={
                            <Text>
                                {meetingManager.meetingStatus}, {meetingStatus}
                            </Text>
                        }
                        className="videos"
                    ></VideoTileGrid>
                    <MyLocalVideo />
                </>
            )}

            <Button onClick={toggleVideo}>Toggle video</Button>
            <Button isDisabled={!roomId || !getMeetingData} onClick={() => joinRoom()}>
                Join
            </Button>
        </>
    );
}
