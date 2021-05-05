import React, { Component, useMemo, useState } from "react";
import { Twemoji } from "react-emoji-render";
import { createHtmlPortalNode, HtmlPortalNode, InPortal } from "react-reverse-portal";

interface EmojiFloatContext {
    addFloater(emoji: string): void;
    setExtents(
        xStartPc: number,
        xEndPc: number,
        xDurationMs: number,
        yStartPc: number,
        yEndPc: number,
        yDurationMs: number
    ): void;

    portalNode: HtmlPortalNode<Component<any>>;
}

const EmojiFloatCtx = React.createContext<EmojiFloatContext | undefined>(undefined);

export function useEmojiFloat(): EmojiFloatContext {
    const ctx = React.useContext(EmojiFloatCtx);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function EmojiFloatProvider({ children }: { children: React.ReactNode | React.ReactNodeArray }): JSX.Element {
    const portalNode = React.useMemo(() => createHtmlPortalNode(), []);

    const [floaters, setFloaters] = useState<JSX.Element[]>([]);
    const [extents, setExtents] = useState<{
        xStartPc: number;
        yStartPc: number;
        xEndPc: number;
        yEndPc: number;
        xDurationMs: number;
        yDurationMs: number;
    }>({
        xStartPc: 0,
        yStartPc: 0,
        xEndPc: 0,
        yEndPc: 0,
        xDurationMs: 2000,
        yDurationMs: 10000,
    });
    const ctx: EmojiFloatContext = useMemo(
        () => ({
            portalNode,
            setExtents: (xStartPc, xEndPc, xDurationMs, yStartPc, yEndPc, yDurationMs) =>
                setExtents({
                    xStartPc,
                    yStartPc,
                    xEndPc,
                    yEndPc,
                    xDurationMs,
                    yDurationMs,
                }),
            addFloater: (emoji) => {
                const xInitial = extents.xStartPc + Math.random() * (extents.xEndPc - extents.xStartPc);
                const yInitial = extents.yStartPc;
                setFloaters((old) => [
                    ...old.filter((x) => Date.now() - (x.key as number) < extents.yDurationMs),
                    <FloatingEmoji
                        key={Date.now()}
                        emoji={emoji}
                        xInitial={xInitial}
                        yInitial={yInitial}
                        {...extents}
                    />,
                ]);
            },
        }),
        [extents, portalNode]
    );

    return (
        <EmojiFloatCtx.Provider value={ctx}>
            {children}
            <InPortal node={portalNode}>{floaters}</InPortal>
        </EmojiFloatCtx.Provider>
    );
}

function FloatingEmoji({
    emoji,
    xInitial,
    yInitial,
    xStartPc,
    xEndPc,
    yStartPc,
    yEndPc,
    xDurationMs,
    yDurationMs,
}: {
    emoji: string;
    xInitial: number;
    yInitial: number;
    xStartPc: number;
    yStartPc: number;
    xEndPc: number;
    yEndPc: number;
    xDurationMs: number;
    yDurationMs: number;
}): JSX.Element {
    return <Twemoji className="twemoji" text={emoji} />;
}
