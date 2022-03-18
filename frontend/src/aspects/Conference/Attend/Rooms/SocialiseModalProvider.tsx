import { useDisclosure } from "@chakra-ui/react";
import type { FocusableElement } from "@chakra-ui/utils";
import React, { Suspense, useCallback, useMemo, useRef } from "react";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { useRestorableState } from "../../../Hooks/useRestorableState";
import { useMaybeCurrentRegistrant } from "../../useCurrentRegistrant";

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
    selectedTab: SocialiseModalTab;
    setSelectedTab: (value: SocialiseModalTab) => void;
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
    const { conferenceId } = useAuthParameters();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const socialiseButtonRef = useRef<FocusableElement>(null);
    const [selectedTab, setSelectedTab] = useRestorableState<SocialiseModalTab>(
        "SocialiseModal_SelectedTab:" + conferenceId,
        SocialiseModalTab.Rooms,
        (x) => x,
        (x) => x as SocialiseModalTab
    );

    const doOnOpen = useCallback(
        (tab?: SocialiseModalTab) => {
            onOpen();
            if (tab) {
                setSelectedTab(tab);
            }
        },
        [onOpen, setSelectedTab]
    );

    const doOnClose = useCallback(() => {
        onClose();
    }, [onClose]);

    const ctx: SocialiseModalContext = useMemo(
        () => ({
            finalFocusRef: socialiseButtonRef,
            isOpen,
            onOpen: doOnOpen,
            onClose: doOnClose,
            selectedTab,
            setSelectedTab,
        }),
        [isOpen, doOnOpen, doOnClose, selectedTab, setSelectedTab]
    );

    return <SocialiseModalContext.Provider value={ctx}>{children}</SocialiseModalContext.Provider>;
}

export function SocialiseModalInstance(): JSX.Element {
    const {
        finalFocusRef: socialiseButtonRef,
        isOpen,
        onClose: doOnClose,
        selectedTab,
        setSelectedTab,
    } = useSocialiseModal();
    const maybeRegistrant = useMaybeCurrentRegistrant();

    return (
        <>
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
        </>
    );
}
