import { useRemoteVideoTileState } from "amazon-chime-sdk-component-library-react";
import React from "react";
import { RemoteVideo } from "./RemoteVideo";

export function RemoteVideos({ participantWidth }: { participantWidth: number }): JSX.Element {
    const { tiles } = useRemoteVideoTileState();

    return (
        <>
            {tiles.map((tileId) => {
                return <RemoteVideo key={tileId} tileId={tileId} participantWidth={participantWidth} />;
            })}
        </>
    );
}
