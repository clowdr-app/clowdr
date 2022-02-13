import { useMemo, useState } from "react";

export const enum DisplayType {
    Auto,
    Gallery,
    BroadcastLayout,
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
    currentDisplay: Auto | Gallery | BroadcastLayout;
    setCurrentDisplay: React.Dispatch<React.SetStateAction<Auto | Gallery | BroadcastLayout>>;
};

export function useVonageDisplay(): VonageDisplay {
    const [currentDisplay, setCurrentDisplay] = useState<Auto | Gallery | BroadcastLayout>({ type: DisplayType.Auto });

    return useMemo(
        () => ({
            currentDisplay,
            setCurrentDisplay,
        }),
        [currentDisplay]
    );
}
