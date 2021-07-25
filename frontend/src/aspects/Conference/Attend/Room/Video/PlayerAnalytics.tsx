import useTrackView from "../../../../Realtime/Analytics/useTrackView";

export function PlayerAnalytics({ isPlaying, roomId }: { isPlaying: boolean; roomId: string }): null {
    useTrackView(isPlaying, roomId, "Room.HLSStream");

    return null;
}
