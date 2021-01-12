import { useCallback, useEffect, useState } from "react";
import type { RoomEventDetailsFragment } from "../../../../../generated/graphql";
import usePolling from "../../../../Generic/usePolling";

export function useEventLiveStatus(
    event: RoomEventDetailsFragment
): { live: boolean; secondsUntilLive: number; secondsUntilOffAir: number } {
    const [live, setLive] = useState<boolean>(false);
    const [secondsUntilLive, setSecondsUntilLive] = useState<number>(0);
    const [secondsUntilOffAir, setSecondsUntilOffAir] = useState<number>(0);

    const update = useCallback(() => {
        const startTime = Date.parse(event.startTime);
        const now = new Date().getTime();
        const endTime = Date.parse(event.endTime);

        setLive(now >= startTime && now <= endTime);
        setSecondsUntilLive((startTime - now) / 1000);
        setSecondsUntilOffAir((endTime - now) / 1000);
    }, [event.endTime, event.startTime]);

    useEffect(() => {
        update();
    }, [update]);

    usePolling(update, 1000, true);

    return { live, secondsUntilLive, secondsUntilOffAir };
}
