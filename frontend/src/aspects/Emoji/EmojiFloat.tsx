import { Box } from "@chakra-ui/react";
import React, { Component, useCallback, useMemo, useState } from "react";
import { createHtmlPortalNode, HtmlPortalNode, InPortal } from "react-reverse-portal";
import usePolling from "../Generic/usePolling";
import { useRealTime } from "../Generic/useRealTime";
import FloatingEmoji from "./FloatingEmoji";

interface EmojiFloatContext {
    setExtents(
        xStartPc: number,
        xEndPc: number,
        xDurationMs: number,
        yStartPc: number,
        yEndPc: number,
        yDurationMs: number
    ): void;

    isActive: string;
    setIsActive(activeForChatId: string): void;

    portalNode: HtmlPortalNode<Component<any>>;
}

interface AddEmojiFloatContext {
    addFloater(emoji: string, name: string): void;
}

const EmojiFloatCtx = React.createContext<EmojiFloatContext | undefined>(undefined);
const AddEmojiFloatCtx = React.createContext<AddEmojiFloatContext | undefined>(undefined);

export function useEmojiFloat(): EmojiFloatContext {
    const ctx = React.useContext(EmojiFloatCtx);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function useAddEmojiFloat(): AddEmojiFloatContext {
    const ctx = React.useContext(AddEmojiFloatCtx);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function EmojiFloatProvider({ children }: { children: React.ReactNode | React.ReactNodeArray }): JSX.Element {
    const portalNode = React.useMemo(() => createHtmlPortalNode(), []);

    const [isActive, setIsActive] = useState<string>("");
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
    const ctx1: EmojiFloatContext = useMemo(
        () => ({
            portalNode,
            isActive,
            setIsActive: (value) => {
                setFloaters([]);
                setIsActive(value);
            },
            setExtents: (xStartPc, xEndPc, xDurationMs, yStartPc, yEndPc, yDurationMs) =>
                setExtents({
                    xStartPc,
                    yStartPc,
                    xEndPc,
                    yEndPc,
                    xDurationMs,
                    yDurationMs,
                }),
        }),
        [isActive, portalNode]
    );
    const ctx2: AddEmojiFloatContext = useMemo(
        () => ({
            addFloater: (emoji, name) => {
                const xInitial = extents.xStartPc + Math.random() * (extents.xEndPc - extents.xStartPc);
                const yInitial = extents.yStartPc + Math.random() * 0.05 * (extents.yEndPc - extents.yStartPc);
                setFloaters((old) => {
                    old.push(
                        <FloatingEmoji
                            key={"emoji-" + Date.now() + "-" + (Math.random() * 100000).toFixed(0)}
                            emoji={emoji}
                            xInitial={xInitial}
                            yInitial={yInitial}
                            createdAt={Date.now()}
                            name={name}
                            {...extents}
                        />
                    );
                    return old;
                });
            },
        }),
        [extents]
    );

    const filterOutOld = useCallback(() => {
        setFloaters((old) => old.filter((x) => Date.now() - x.props.createdAt < extents.yDurationMs - 500));
    }, [extents.yDurationMs]);
    usePolling(filterOutOld, 1000);

    return (
        <>
            <EmojiFloatCtx.Provider value={ctx1}>
                <AddEmojiFloatCtx.Provider value={ctx2}>{children}</AddEmojiFloatCtx.Provider>
            </EmojiFloatCtx.Provider>
            <InPortal node={portalNode}>
                <FloatersPortal>{floaters}</FloatersPortal>
            </InPortal>
        </>
    );
}

function FloatersPortal({ children }: React.PropsWithChildren<any>): JSX.Element {
    useRealTime(100);
    return (
        <Box pos="absolute" top={0} left={0} w="100%" h="100%">
            {children}
        </Box>
    );
}
