import React from "react";

export interface MenuState {
    isLeftBarOpen: boolean;
    onLeftBarOpen: () => void;
    onLeftBarClose: () => void;

    isRightBarOpen: boolean;
    onRightBarOpen: () => void;
    onRightBarClose: () => void;
}

export const MenuStateContext = React.createContext<MenuState | undefined>(undefined);

export function useMainMenu(): MenuState {
    const ctx = React.useContext(MenuStateContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}
