import React, { useEffect, useState } from "react";

export interface PrimaryMenuButton {
    key: string;
    action: string | (() => void);
    text: string | JSX.Element | Array<JSX.Element>;
    label: string;
    colorScheme?: string;
}

export type PrimaryMenuButtons = Array<PrimaryMenuButton>;

export type PrimaryMenuButtonsContextT = [PrimaryMenuButtons, React.Dispatch<React.SetStateAction<PrimaryMenuButtons>>];

export const PrimaryMenuButtonsContext = React.createContext<PrimaryMenuButtonsContextT>([
    [],
    () => {
        return void 0;
    },
]);

export function PrimaryMenuButtonsProvider({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const st = useState<PrimaryMenuButtons>([]);
    return <PrimaryMenuButtonsContext.Provider value={st}>{children}</PrimaryMenuButtonsContext.Provider>;
}

export function useNoPrimaryMenuButtons(): void {
    const [_, setPrimaryMenuButtons] = React.useContext(PrimaryMenuButtonsContext);
    useEffect(() => {
        setPrimaryMenuButtons([]);
    }, [setPrimaryMenuButtons]);
}

export default function usePrimaryMenuButtons(): {
    buttons: PrimaryMenuButtonsContextT[0];
    setPrimaryMenuButtons: PrimaryMenuButtonsContextT[1];
} {
    const [buttons, setPrimaryMenuButtons] = React.useContext(PrimaryMenuButtonsContext);
    return {
        buttons,
        setPrimaryMenuButtons,
    };
}
