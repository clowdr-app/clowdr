import { useEffect, useMemo, useState } from "react";
import { useRoomPage_GetRoomChannelStackQuery } from "../../../../../generated/graphql";
import usePolling from "../../../../Generic/usePolling";
import { useRealTime } from "../../../../Generic/useRealTime";

export function useHLSUri(roomId: string, broadcastEventStartsAt: number): string | null {
    const now5s = useRealTime(30000);
    const secondsUntilBroadcastEvent = broadcastEventStartsAt - now5s;

    const [refetchChannelStackInterval, setRefetchChannelStackInterval] = useState<number>(2 * 60 * 1000);
    const [skipGetChannelStack, setSkipGetChannelStack] = useState<boolean>(true);
    const [roomChannelStackResponse, refetchChannelStack] = useRoomPage_GetRoomChannelStackQuery({
        variables: {
            roomId,
        },
        requestPolicy: "network-only",
        pause: skipGetChannelStack,
    });
    const { start, stop } = usePolling(refetchChannelStack, refetchChannelStackInterval, skipGetChannelStack);
    useEffect(() => {
        if (skipGetChannelStack) {
            stop();
        } else {
            start();
        }
    }, [skipGetChannelStack, start, stop]);

    useEffect(() => {
        if (skipGetChannelStack && secondsUntilBroadcastEvent < 5 * 60 * 1000) {
            setSkipGetChannelStack(false);
        }
    }, [skipGetChannelStack, secondsUntilBroadcastEvent]);
    useEffect(() => {
        if (roomChannelStackResponse.data?.video_ChannelStack?.[0]) {
            setRefetchChannelStackInterval(5 * 60 * 1000);
        }
    }, [roomChannelStackResponse.data?.video_ChannelStack]);

    const hlsUri = useMemo(() => {
        if (!roomChannelStackResponse.data?.video_ChannelStack?.[0]) {
            return null;
        }
        const finalUri = new URL(roomChannelStackResponse.data.video_ChannelStack[0].endpointUri);
        finalUri.hostname = roomChannelStackResponse.data.video_ChannelStack[0].cloudFrontDomain;
        return finalUri.toString();
    }, [roomChannelStackResponse.data?.video_ChannelStack]);

    return hlsUri;
}
