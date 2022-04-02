import useSize from "@react-hook/size";
import type { PropsWithChildren } from "react";
import React, { createContext, useEffect } from "react";
import useDebouncedState from "../Hooks/useDebouncedState";

function useValue(_props: Record<never, never>) {
    const mainPaneRef = React.useRef<HTMLDivElement>(null);
    const [mainPaneWidthLive, mainPaneHeightLive] = useSize(mainPaneRef);

    const [mainPaneWidth, , setMainPaneWidth] = useDebouncedState(0, 100);
    useEffect(() => {
        setMainPaneWidth(mainPaneWidthLive);
    }, [mainPaneWidthLive, setMainPaneWidth]);

    const [mainPaneHeight, , setMainPaneHeight] = useDebouncedState(0, 100);
    useEffect(() => {
        setMainPaneHeight(mainPaneHeightLive);
    }, [mainPaneHeightLive, setMainPaneHeight]);

    return {
        mainPaneRef,
        mainPaneWidth,
        mainPaneHeight,
    };
}

export const AppLayoutContext = createContext({} as ReturnType<typeof useValue>);

export function AppLayoutProvider(props: PropsWithChildren<Record<never, never>>): JSX.Element {
    return <AppLayoutContext.Provider value={useValue(props)}>{props.children}</AppLayoutContext.Provider>;
}
