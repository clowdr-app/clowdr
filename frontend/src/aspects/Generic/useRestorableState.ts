import { Dispatch, SetStateAction, useCallback, useState } from "react";

export function useRestorableState<T>(
    uniqueKey: string,
    initial: T,
    serialise: (input: T) => string,
    parse: (input: string) => T
): [T, Dispatch<SetStateAction<T>>] {
    return useStoredState(uniqueKey, initial, serialise, parse, window.localStorage);
}

export function useSessionState<T>(
    uniqueKey: string,
    initial: T,
    serialise: (input: T) => string,
    parse: (input: string) => T
): [T, Dispatch<SetStateAction<T>>] {
    return useStoredState(uniqueKey, initial, serialise, parse, window.sessionStorage);
}

export function useStoredState<T>(
    uniqueKey: string,
    initial: T,
    serialise: (input: T) => string,
    parse: (input: string) => T,
    storage: Storage
): [T, Dispatch<SetStateAction<T>>] {
    const locallyStoredValue = storage.getItem(uniqueKey);
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
                storage.setItem(uniqueKey, serialise(newV));
                return newV;
            });
        },
        [serialise, storage, uniqueKey]
    );
    return [t, setT];
}
