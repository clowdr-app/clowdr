import React, { useMemo } from "react";
import { useRestorableState } from "../../Hooks/useRestorableState";

export enum RightSidebarTabs {
    PageChat = 1,
    RaiseHand = 2,
    Chats = 3,
    Presence = 4,
}

interface RightSidebarCurrentTabContext {
    currentTab: RightSidebarTabs;
    setCurrentTab: React.Dispatch<React.SetStateAction<RightSidebarTabs>>;
}

const rightSidebarCurrentTabContext = React.createContext<RightSidebarCurrentTabContext | undefined>(undefined);

export function useRightSidebarCurrentTab(): RightSidebarCurrentTabContext {
    const ctx = React.useContext(rightSidebarCurrentTabContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function RightSidebarCurrentTabProvider({ children }: React.PropsWithChildren<any>): JSX.Element {
    const [currentTab, setCurrentTab] = useRestorableState<RightSidebarTabs>(
        "RightSideBar_CurrentTab",
        RightSidebarTabs.Presence,
        (x) => x.toString(),
        (x) => parseInt(x, 10)
    );

    const ctx = useMemo(
        () => ({
            currentTab,
            setCurrentTab,
        }),
        [currentTab, setCurrentTab]
    );

    return <rightSidebarCurrentTabContext.Provider value={ctx}>{children}</rightSidebarCurrentTabContext.Provider>;
}
