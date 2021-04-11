import {
    ContentShare,
    useContentShareState,
    useFeaturedTileState,
    useLocalVideo,
    useRemoteVideoTileState,
    VideoGrid,
} from "@clowdr-app/amazon-chime-sdk-component-library-react";
import React from "react";
import { LocalVideo } from "./LocalVideo";
import { RemoteVideos } from "./RemoteVideos";

export function VideoTiles({
    layout = "featured",
    noRemoteVideoView,
}: {
    layout?: string;
    noRemoteVideoView?: boolean;
}): JSX.Element {
    const { tileId: featureTileId } = useFeaturedTileState();
    const { tiles } = useRemoteVideoTileState();
    const { tileId: contentTileId } = useContentShareState();
    const { isVideoEnabled } = useLocalVideo();
    const featured = (layout === "featured" && !!featureTileId) || !!contentTileId;
    const remoteSize = tiles.length + (contentTileId ? 1 : 0);
    const gridSize = remoteSize > 1 && isVideoEnabled ? remoteSize + 1 : remoteSize;

    return (
        <VideoGrid size={gridSize} layout={featured ? "featured" : null}>
            <ContentShare css="grid-area: ft;" />
            <RemoteVideos />
            <LocalVideo nameplate="Me" />
            {remoteSize === 0 && noRemoteVideoView}
        </VideoGrid>
    );
}
