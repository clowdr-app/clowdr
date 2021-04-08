import { Button } from "@chakra-ui/react";
import { useMeetingManager, VideoTileGrid } from "amazon-chime-sdk-component-library-react";
import React, { useCallback } from "react";

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
    getMeetingData: () => Promise<{ meetingInfo: Meeting; attendeeInfo: Attendee }>;
    disable: boolean;
}): JSX.Element {
    const meetingManager = useMeetingManager();

    const joinRoom = useCallback(async () => {
        const meetingData = await getMeetingData();

        await meetingManager.join(meetingData);

        await meetingManager.start();
    }, []);

    return (
        <>
            <VideoTileGrid />
            <Button onClick={() => joinRoom()}>Join</Button>
        </>
    );
}
