import { useRemoteVideoTileState, useRosterState } from "@clowdr-app/amazon-chime-sdk-component-library-react";
import React from "react";
import { RemoteVideo } from "./RemoteVideo";

export function RemoteVideos(): JSX.Element {
    const { roster } = useRosterState();
    const { tiles, tileIdToAttendeeId } = useRemoteVideoTileState();

    return (
        <>
            {tiles.map((tileId) => {
                const attendee = roster[tileIdToAttendeeId[tileId]] || {};
                const { name }: any = attendee;
                return <RemoteVideo key={tileId} tileId={tileId} name={name} />;
            })}
        </>
    );
}
