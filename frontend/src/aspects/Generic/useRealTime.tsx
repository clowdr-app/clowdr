import { useEffect, useState } from "react";

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
    return now;
}
