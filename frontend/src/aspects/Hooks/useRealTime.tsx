import { useEffect, useState } from "react";

const nowOffset = Date.parse("2021-01-18 17:30") - Date.now();
export function useRealTime(periodMs = 10000, virtualisedTime = false): number {
    const [now, setNow] = useState<number>(Date.now());
    useEffect(() => {
        const intervalId = setInterval(() => {
            setNow(Date.now());
        }, periodMs);
        return () => {
            clearInterval(intervalId);
        };
    }, [periodMs]);
    return now + (virtualisedTime ? nowOffset : 0);
}
