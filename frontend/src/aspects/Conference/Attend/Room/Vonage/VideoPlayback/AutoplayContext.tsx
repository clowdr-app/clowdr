import canAutoplay from "can-autoplay";
import type { PropsWithChildren } from "react";
import React, { createContext, useCallback, useEffect, useState } from "react";

function useValue() {
    const [autoplayAlertDismissed, setAutoplayAlertDismissed] = useState<boolean>(false);
    const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(true);

    const unblockAutoplay = useCallback(async (): Promise<boolean> => {
        const result = await canAutoplay.video({
            inline: true,
            muted: false,
        });
        setAutoplayBlocked(!result.result);
        return Boolean(result.result);
    }, []);

    useEffect(() => {
        async function fn() {
            await unblockAutoplay();
        }
        fn().catch((err) => console.error(err));
    }, [unblockAutoplay]);

    return { unblockAutoplay, autoplayBlocked, autoplayAlertDismissed, setAutoplayAlertDismissed };
}

export const AutoplayContext = createContext({} as ReturnType<typeof useValue>);

export function AutoplayProvider(props: PropsWithChildren<Record<never, never>>): JSX.Element {
    return <AutoplayContext.Provider value={useValue()}>{props.children}</AutoplayContext.Provider>;
}
