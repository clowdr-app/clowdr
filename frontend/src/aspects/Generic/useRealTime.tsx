import { useEffect, useState } from "react";

const nowOffset = Date.parse("2021-01-17 15:30") - Date.now();
export function useRealTime(periodMs = 10000): number {
    const [now, setNow] = useState<number>(Date.now());
    useEffect(() => {
        const intervalId = setInterval(() => {
            setNow(Date.now());
        }, periodMs);
        return () => {
            clearInterval(intervalId);
        };
    }, [periodMs]);
    return now + nowOffset;
}
