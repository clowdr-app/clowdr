import { useDisclosure } from "@chakra-ui/react";
import type { FocusableElement } from "@chakra-ui/utils";
import React, { useMemo, useRef } from "react";
import { usePreloadedLiveProgramRooms } from "./LiveProgramRooms";

interface LiveProgramRoomsContext {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
    finalFocusRef: React.RefObject<FocusableElement>;
}

const LiveProgramRoomsContext = React.createContext<LiveProgramRoomsContext | undefined>(undefined);

export function useLiveProgramRooms(): LiveProgramRoomsContext {
    const ctx = React.useContext(LiveProgramRoomsContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function LiveProgramRoomsProvider({ children }: React.PropsWithChildren<any>): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const liveprogramroomsButtonRef = useRef<FocusableElement>(null);

    const ctx: LiveProgramRoomsContext = useMemo(
        () => ({
            finalFocusRef: liveprogramroomsButtonRef,
            isOpen,
            onOpen,
            onClose,
        }),
        [onOpen, isOpen, onClose]
    );

    usePreloadedLiveProgramRooms();

    return <LiveProgramRoomsContext.Provider value={ctx}>{children}</LiveProgramRoomsContext.Provider>;
}
