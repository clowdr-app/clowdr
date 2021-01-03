import React, { MutableRefObject, useState } from "react";

export default function useResizeObserver<T extends Element>(elRef: MutableRefObject<T | null>): ReadonlyArray<ResizeObserverEntry> {
    const [observerEntries, setObserverEntries] = useState<ReadonlyArray<ResizeObserverEntry>>([]);

    const observer = React.useRef(
        new ResizeObserver((entries) => {
            setObserverEntries(entries);
        })
    );

    React.useEffect(() => {
        const elCurrent = elRef?.current;
        const obsCurrent = observer.current;
        if (elCurrent) {
            obsCurrent.observe(elCurrent);
        }
        return () => {
            if (elCurrent) {
                obsCurrent.unobserve(elCurrent);
            }
        };
    }, [elRef]);

    return observerEntries;
}
