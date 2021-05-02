import { useAudioVideo, useRemoteVideoTileState, useRosterState } from "amazon-chime-sdk-component-library-react";
import React from "react";
import { RemoteVideo } from "./RemoteVideo";

export function RemoteVideos({ participantWidth }: { participantWidth: number }): JSX.Element {
    const { roster } = useRosterState();
    const { tiles, tileIdToAttendeeId } = useRemoteVideoTileState();
    const audioVideo = useAudioVideo();

    return (
        <>
            {tiles.map((tileId) => {
                const registrant = roster[tileIdToAttendeeId[tileId]] || {};
                return <RemoteVideo key={tileId} tileId={tileId} participantWidth={participantWidth} />;
            })}
        </>
    );
}
