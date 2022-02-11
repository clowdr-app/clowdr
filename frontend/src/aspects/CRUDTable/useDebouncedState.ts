import { useEffect, useState } from "react";

export default function useDebouncedState<T>(
    initial: T,
    delay = 100
): [value: T, debouncedValue: T, setValue: React.Dispatch<React.SetStateAction<T>>] {
    const [val, setVal] = useState<T>(initial);
    const [debouncedVal, setDebouncedVal] = useState<T>(initial);

    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedVal(val);
        }, delay);
        return () => {
            clearTimeout(t);
        };
    }, [delay, val]);

    return [val, debouncedVal, setVal];
}
