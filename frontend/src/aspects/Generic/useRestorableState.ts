import { Dispatch, SetStateAction, useCallback, useState } from "react";

export function useRestorableState<T>(
    uniqueKey: string,
    initial: T,
    serialise: (input: T) => string,
    parse: (input: string) => T
): [T, Dispatch<SetStateAction<T>>] {
    const locallyStoredValue = window.localStorage.getItem(uniqueKey);
    const [t, setTInner] = useState<T>(locallyStoredValue ? parse(locallyStoredValue) : initial);
    const setT = useCallback(
        (f: SetStateAction<T>) => {
            setTInner((old) => {
                let newV: T;
                if (f instanceof Function) {
                    newV = f(old);
                } else {
                    newV = f;
                }
                window.localStorage.setItem(uniqueKey, serialise(newV));
                return newV;
            });
        },
        [serialise, uniqueKey]
    );
    return [t, setT];
}
