import React, { Dispatch, SetStateAction, useState } from "react";
import { useChatConfiguration } from "./Configuration";

interface SelectedChat {
    id: string;
    label: string;
    selectedSide: "L" | "R";
    setSelectedSide: Dispatch<SetStateAction<"L" | "R">>;

    nonSelectedId: string | undefined;
}

const SelectedChatContext = React.createContext<SelectedChat | undefined>(undefined);

export function SelectedChatProvider({ children }: { children: React.ReactNode | React.ReactNodeArray }): JSX.Element {
    const config = useChatConfiguration();
    const [selectedSide, setSelectedSide] = useState<"L" | "R">(
        "chatId" in config.sources ? "L" : config.sources.defaultSelected
    );
    return (
        <SelectedChatContext.Provider
            value={{
                id:
                    "chatId" in config.sources
                        ? config.sources.chatId
                        : selectedSide === "L"
                        ? config.sources.chatIdL
                        : config.sources.chatIdR,
                label:
                    "chatId" in config.sources
                        ? config.sources.chatLabel
                        : selectedSide === "L"
                        ? config.sources.chatLabelL
                        : config.sources.chatLabelR,
                selectedSide,
                setSelectedSide,

                nonSelectedId:
                    "chatId" in config.sources
                        ? undefined
                        : selectedSide === "L"
                        ? config.sources.chatIdR
                        : config.sources.chatIdL,
            }}
        >
            {children}
        </SelectedChatContext.Provider>
    );
}

export function useSelectedChat(): SelectedChat {
    const ctx = React.useContext(SelectedChatContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}
