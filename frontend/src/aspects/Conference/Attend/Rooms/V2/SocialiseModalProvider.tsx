import { useDisclosure } from "@chakra-ui/react";
import type { FocusableElement } from "@chakra-ui/utils";
import React, { Suspense, useCallback, useContext, useMemo, useRef } from "react";
import { useRestorableState } from "../../../../Generic/useRestorableState";
import { EnableRoomParticipantsPollingContext } from "../../../../Room/EnableRoomParticipantsPollingContext";
import { useConference } from "../../../useConference";
import { useMaybeCurrentRegistrant } from "../../../useCurrentRegistrant";

const SocialiseModal = React.lazy(() => import("./SocialiseModal"));

export enum SocialiseModalTab {
    Rooms = "Rooms",
    People = "People",
    Networking = "Networking",
}

interface SocialiseModalContext {
    isOpen: boolean;
    onOpen: (tab?: SocialiseModalTab) => void;
    onClose: () => void;
    finalFocusRef: React.RefObject<FocusableElement>;
}

const SocialiseModalContext = React.createContext<SocialiseModalContext | undefined>(undefined);

export function useSocialiseModal(): SocialiseModalContext {
    const ctx = React.useContext(SocialiseModalContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function SocialiseModalProvider({ children }: React.PropsWithChildren<any>): JSX.Element {
    const conference = useConference();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const socialiseButtonRef = useRef<FocusableElement>(null);
    const [selectedTab, setSelectedTab] = useRestorableState<SocialiseModalTab>(
        "SocialiseModal_SelectedTab" + conference.id,
        SocialiseModalTab.Rooms,
        (x) => x,
        (x) => x as SocialiseModalTab
    );
    const { setPaused } = useContext(EnableRoomParticipantsPollingContext);

    const doOnOpen = useCallback(
        (tab?: SocialiseModalTab) => {
            onOpen();
            if (tab) {
                setSelectedTab(tab);
            }
            setPaused(false);
        },
        [onOpen, setPaused, setSelectedTab]
    );

    const doOnClose = useCallback(() => {
        setPaused(true);
        onClose();
    }, [setPaused, onClose]);

    const ctx: SocialiseModalContext = useMemo(
        () => ({
            finalFocusRef: socialiseButtonRef,
            isOpen,
            onOpen: doOnOpen,
            onClose: doOnClose,
        }),
        [doOnOpen, isOpen, doOnClose]
    );

    const maybeRegistrant = useMaybeCurrentRegistrant();

    return (
        <SocialiseModalContext.Provider value={ctx}>
            {children}
            {maybeRegistrant ? (
                <Suspense fallback={null}>
                    <SocialiseModal
                        isOpen={isOpen}
                        onClose={doOnClose}
                        finalFocusRef={socialiseButtonRef}
                        selectedTab={selectedTab}
                        setSelectedTab={setSelectedTab}
                    />
                </Suspense>
            ) : undefined}
        </SocialiseModalContext.Provider>
    );
}
