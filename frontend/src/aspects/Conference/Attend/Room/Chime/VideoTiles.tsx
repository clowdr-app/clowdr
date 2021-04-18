import { Flex, useBreakpointValue } from "@chakra-ui/react";
import {
    useContentShareState,
    useFeaturedTileState,
    useLocalVideo,
    useRemoteVideoTileState,
} from "amazon-chime-sdk-component-library-react";
import React from "react";
import useCurrentAttendee from "../../../useCurrentAttendee";
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

    const attendee = useCurrentAttendee();

    const resolutionBP = useBreakpointValue<"low" | "normal" | "high">({
        base: "low",
        lg: "normal",
    });
    const screenSharingActive = !!contentTileId;
    const maxVideoStreams = screenSharingActive ? 4 : 10;
    const cameraResolution = screenSharingActive || tiles.length >= maxVideoStreams ? "low" : resolutionBP ?? "normal";
    const participantWidth = cameraResolution === "low" ? 150 : 300;

    return (
        <Flex
            width="100%"
            height="auto"
            flexWrap={contentTileId !== null ? "nowrap" : "wrap"}
            overflowX={contentTileId !== null ? "auto" : "hidden"}
            overflowY={contentTileId !== null ? "hidden" : "auto"}
        >
            <LocalVideo participantWidth={participantWidth} />
            <RemoteVideos participantWidth={participantWidth} />
        </Flex>
    );
}
