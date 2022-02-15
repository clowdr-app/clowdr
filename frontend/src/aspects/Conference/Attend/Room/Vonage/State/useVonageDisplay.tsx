import { useContext, useEffect, useMemo, useState } from "react";
import { VonageComputedStateContext } from "./VonageComputedStateContext";
import { useVonageRoom } from "./VonageRoomProvider";

export const enum DisplayType {
    Auto = "AUTO",
    Browse = "BROWSE",
    BroadcastLayout = "BROADCAST_LAYOUT",
}

export interface Auto {
    type: DisplayType.Auto;
}

export interface Browse {
    type: DisplayType.Browse;
}

export interface BroadcastLayout {
    type: DisplayType.BroadcastLayout;
}

export type VonageDisplay = {
    chosenDisplay: Auto | Browse | BroadcastLayout;
    actualDisplay: Browse | BroadcastLayout;
    setChosenDisplay: React.Dispatch<React.SetStateAction<Auto | Browse | BroadcastLayout>>;
};

export function useVonageDisplay(): VonageDisplay {
    const { settings } = useVonageRoom();
    const { isRecordingActive, connected } = useContext(VonageComputedStateContext);
    const [chosenDisplay, setChosenDisplay] = useState<Auto | Browse | BroadcastLayout>({ type: DisplayType.Auto });

    useEffect(() => {
        if (!connected) {
            setChosenDisplay({ type: DisplayType.Auto });
        }
    }, [connected]);

    const actualDisplay = useMemo<Browse | BroadcastLayout>(
        () =>
            chosenDisplay.type === DisplayType.Auto
                ? settings.isBackstageRoom || isRecordingActive
                    ? { type: DisplayType.BroadcastLayout }
                    : { type: DisplayType.Browse }
                : chosenDisplay,
        [chosenDisplay, isRecordingActive, settings.isBackstageRoom]
    );

    return useMemo(
        () => ({
            chosenDisplay,
            setChosenDisplay,
            actualDisplay,
        }),
        [chosenDisplay, actualDisplay]
    );
}
