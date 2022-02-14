import { useContext, useMemo, useState } from "react";
import { VonageComputedStateContext } from "./VonageComputedStateContext";
import { useVonageRoom } from "./VonageRoomProvider";

export const enum DisplayType {
    Auto = "AUTO",
    Gallery = "GALLERY",
    BroadcastLayout = "BROADCAST_LAYOUT",
}

export function formatDisplayType(displayType: DisplayType): string {
    switch (displayType) {
        case DisplayType.Auto:
            return "auto";
        case DisplayType.BroadcastLayout:
            return "TV";
        case DisplayType.Gallery:
            return "gallery";
    }
}

export interface Auto {
    type: DisplayType.Auto;
}

export interface Gallery {
    type: DisplayType.Gallery;
}

export interface BroadcastLayout {
    type: DisplayType.BroadcastLayout;
}

export type VonageDisplay = {
    chosenDisplay: Auto | Gallery | BroadcastLayout;
    actualDisplay: Gallery | BroadcastLayout;
    setChosenDisplay: React.Dispatch<React.SetStateAction<Auto | Gallery | BroadcastLayout>>;
};

export function useVonageDisplay(): VonageDisplay {
    const { settings } = useVonageRoom();
    const { isRecordingActive } = useContext(VonageComputedStateContext);
    const [chosenDisplay, setChosenDisplay] = useState<Auto | Gallery | BroadcastLayout>({ type: DisplayType.Auto });

    const actualDisplay = useMemo<Gallery | BroadcastLayout>(
        () =>
            chosenDisplay.type === DisplayType.Auto
                ? settings.isBackstageRoom || isRecordingActive
                    ? { type: DisplayType.BroadcastLayout }
                    : { type: DisplayType.Gallery }
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
