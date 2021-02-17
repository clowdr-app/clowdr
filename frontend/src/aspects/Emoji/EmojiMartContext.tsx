import { EmojiData, Picker } from "emoji-mart";
import React, { Component, useMemo, useState } from "react";
import { createHtmlPortalNode, HtmlPortalNode, InPortal } from "react-reverse-portal";

interface EmojiMartCtx {
    portalNode: HtmlPortalNode<Component<any>>;
    setOnSelect: React.Dispatch<
        React.SetStateAction<{
            f: (data: EmojiData) => void;
        } | null>
    >;
}

const EmojiMartContext = React.createContext<EmojiMartCtx | undefined>(undefined);

export function useEmojiMart(): EmojiMartCtx {
    const ctx = React.useContext(EmojiMartContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export default function EmojiMartProvider({
    children,
}: {
    children: React.ReactNode | React.ReactNodeArray;
}): JSX.Element {
    const portalNode = React.useMemo(() => createHtmlPortalNode(), []);
    const [onSelect, setOnSelect] = useState<{ f: (data: EmojiData) => void } | null>(null);
    const ctx = useMemo(
        () => ({
            portalNode,
            setOnSelect,
        }),
        [portalNode]
    );

    return (
        <EmojiMartContext.Provider value={ctx}>
            {children}
            <InPortal node={portalNode}>
                <Picker
                    set="twitter"
                    showPreview={false}
                    autoFocus={true}
                    onSelect={(data) => {
                        onSelect?.f(data);
                    }}
                />
            </InPortal>
        </EmojiMartContext.Provider>
    );
}
