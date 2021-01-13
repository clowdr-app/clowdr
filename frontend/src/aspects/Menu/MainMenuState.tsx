import React from "react";

interface MenuState {
    onOpen: () => void;
    onClose: () => void;
    onToggle: () => void;
}

export const MenuStateContext = React.createContext<MenuState | undefined>(undefined);

export function useMainMenu(): MenuState {
    const ctx = React.useContext(MenuStateContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}
