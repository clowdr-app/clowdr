import { useDisclosure } from "@chakra-ui/react";
import type { FocusableElement } from "@chakra-ui/utils";
import { gql } from "@urql/core";
import React, { Suspense, useCallback, useMemo, useRef } from "react";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { useRestorableState } from "../../../Hooks/useRestorableState";

const ScheduleModal = React.lazy(() => import("./ScheduleModal"));

gql`
    query Schedule_HappeningSoon($conferenceId: uuid!, $startBefore: timestamptz!, $endAfter: timestamptz!) {
        schedule_Event(
            where: {
                conferenceId: { _eq: $conferenceId }
                startTime: { _lte: $startBefore }
                endTime: { _gte: $endAfter }
            }
        ) {
            ...Schedule_EventSummary
            item {
                ...Schedule_ItemFields
            }
            room {
                ...Schedule_RoomSummary
            }
        }
        collection_ProgramPerson(where: { conferenceId: { _eq: $conferenceId } }) {
            ...Schedule_ProgramPerson
        }
        collection_Tag(where: { conferenceId: { _eq: $conferenceId } }) {
            ...Schedule_Tag
        }
    }
`;

export enum ProgramModalTab {
    Tags = "Tags",
    HappeningSoon = "HappeningSoon",
    Exhibitions = "Exhibitions",
    Sponsors = "Sponsors",
    Schedule = "Schedule",
    SchedulePreview = "ScheduleV2",
}

interface ScheduleModalContext {
    isOpen: boolean;
    onOpen: (tagId?: string, tab?: ProgramModalTab) => void;
    onClose: () => void;
    finalFocusRef: React.RefObject<FocusableElement>;
    selectedTab: ProgramModalTab;
    setSelectedTab: (value: ProgramModalTab) => void;
    selectedTagId: string | null;
    setSelectedTag: (value: string | null) => void;
}

const ScheduleModalContext = React.createContext<ScheduleModalContext | undefined>(undefined);

export function useScheduleModal(): ScheduleModalContext {
    const ctx = React.useContext(ScheduleModalContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

export function ScheduleModalStateProvider({ children }: React.PropsWithChildren<any>): JSX.Element {
    const { conferenceId } = useAuthParameters();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const scheduleButtonRef = useRef<FocusableElement>(null);
    const [selectedTab, setSelectedTab] = useRestorableState<ProgramModalTab>(
        "ProgramModal_SelectedTab:" + conferenceId,
        ProgramModalTab.HappeningSoon,
        (x) => x,
        (x) => x as ProgramModalTab
    );
    const [selectedTagId, setSelectedTag] = useRestorableState<string | null>(
        "ProgramModal_ItemList_OpenPanelId:" + conferenceId,
        null,
        (s) => (s === null ? "null" : s),
        (s) => (s === "null" ? null : s)
    );

    const doOnOpen = useCallback(
        (tagId?: string, tab?: ProgramModalTab) => {
            onOpen();
            if (tab) {
                setSelectedTab(tab);
            }
            if (tagId) {
                setSelectedTag(tagId);
                if (!tab) {
                    setSelectedTab(ProgramModalTab.Tags);
                }
            }
        },
        [onOpen, setSelectedTab, setSelectedTag]
    );

    const ctx: ScheduleModalContext = useMemo(
        () => ({
            finalFocusRef: scheduleButtonRef,
            isOpen,
            onOpen: doOnOpen,
            onClose,
            selectedTab,
            setSelectedTab,
            selectedTagId,
            setSelectedTag,
        }),
        [doOnOpen, isOpen, onClose, selectedTab, selectedTagId, setSelectedTab, setSelectedTag]
    );

    return <ScheduleModalContext.Provider value={ctx}>{children}</ScheduleModalContext.Provider>;
}

export function ProgramModal({ children }: React.PropsWithChildren<any>): JSX.Element {
    const {
        finalFocusRef: scheduleButtonRef,
        isOpen,
        onClose,
        selectedTab,
        setSelectedTab,
        selectedTagId,
        setSelectedTag,
    } = useScheduleModal();

    return (
        <>
            {children}
            <Suspense fallback={null}>
                <ScheduleModal
                    isOpen={isOpen}
                    onClose={onClose}
                    finalFocusRef={scheduleButtonRef}
                    selectedTab={selectedTab}
                    setSelectedTab={setSelectedTab}
                    selectedTagId={selectedTagId}
                    setSelectedTag={setSelectedTag}
                />
            </Suspense>
        </>
    );
}
