import { gql } from "@apollo/client";
import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalOverlay,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    useDisclosure,
} from "@chakra-ui/react";
import type { FocusableElement } from "@chakra-ui/utils";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Schedule_EventSummaryFragment,
    Schedule_HappeningSoonQuery,
    Schedule_ItemElementsFragment,
    Schedule_RoomSummaryFragment,
    Schedule_TagFragment,
    useGetSponsorBoothsQuery,
    useSchedule_HappeningSoonQuery,
} from "../../../../generated/graphql";
import { roundDownToNearest, roundUpToNearest } from "../../../Generic/MathUtils";
import { useRealTime } from "../../../Generic/useRealTime";
import { useRestorableState } from "../../../Generic/useRestorableState";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { FAIcon } from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";
import ItemList from "../Content/ItemList";
import { ExhibitionsGrid } from "../Exhibition/ExhibitionsPage";
import { SponsorBoothsInner } from "../Rooms/V2/SponsorBooths";
import SearchPanel from "../Search/SearchPanel";
import { ScheduleFetchWrapper, ScheduleInner } from "./Schedule";

gql`
    query Schedule_HappeningSoon($conferenceId: uuid!, $startBefore: timestamptz!, $endAfter: timestamptz!) {
        room_Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                managementModeName: { _in: [PUBLIC, PRIVATE] }
                events: { startTime: { _lte: $startBefore }, endTime: { _gte: $endAfter } }
            }
        ) {
            ...Schedule_RoomSummary
        }
        schedule_Event(
            where: {
                conferenceId: { _eq: $conferenceId }
                startTime: { _lte: $startBefore }
                endTime: { _gte: $endAfter }
            }
        ) {
            ...Schedule_EventSummary
            item {
                ...Schedule_ItemElements
            }
        }
        collection_Tag(where: { conferenceId: { _eq: $conferenceId } }) {
            ...Schedule_Tag
        }
    }
`;

interface ScheduleModalContext {
    isOpen: boolean;
    onOpen: (tagId?: string, tab?: "Tags" | "Schedule") => void;
    onClose: () => void;
    finalFocusRef: React.RefObject<FocusableElement>;
}

const ScheduleModalContext = React.createContext<ScheduleModalContext | undefined>(undefined);

export function useScheduleModal(): ScheduleModalContext {
    const ctx = React.useContext(ScheduleModalContext);
    if (!ctx) {
        throw new Error("Context not available - are you outside the provider?");
    }
    return ctx;
}

enum ProgramModalTab {
    Tags = "Tags",
    HappeningSoon = "HappeningSoon",
    Exhibitions = "Exhibitions",
    Sponsors = "Sponsors",
    Search = "Search",
    Schedule = "Schedule",
}

export function ScheduleModalProvider({ children }: React.PropsWithChildren<any>): JSX.Element {
    const conference = useConference();
    const { isOpen, onOpen, onClose } = useDisclosure();
    const scheduleButtonRef = useRef<FocusableElement>(null);
    const [selectedTab, setSelectedTab] = useRestorableState<ProgramModalTab>(
        "ProgramModal_SelectedTab" + conference.id,
        ProgramModalTab.HappeningSoon,
        (x) => x,
        (x) => x as ProgramModalTab
    );
    const [selectedTagId, setSelectedTag] = useRestorableState<string | null>(
        "ProgramModal_ItemList_OpenPanelId" + conference.id,
        null,
        (s) => (s === null ? "null" : s),
        (s) => (s === "null" ? null : s)
    );

    const doOnOpen = useCallback(
        (tagId?: string, tab?: "Tags" | "Schedule") => {
            onOpen();
            if (tagId) {
                setSelectedTab(ProgramModalTab.Tags);
                setSelectedTag(tagId);
            } else if (tab === "Tags") {
                setSelectedTab(ProgramModalTab.Tags);
            } else if (tab === "Schedule") {
                setSelectedTab(ProgramModalTab.Schedule);
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
        }),
        [doOnOpen, isOpen, onClose]
    );

    return (
        <ScheduleModalContext.Provider value={ctx}>
            {children}
            <ScheduleModal
                isOpen={isOpen}
                onClose={onClose}
                finalFocusRef={scheduleButtonRef}
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
                selectedTagId={selectedTagId}
                setSelectedTag={setSelectedTag}
            />
        </ScheduleModalContext.Provider>
    );
}

export function ScheduleModal({
    isOpen,
    onClose,
    finalFocusRef,
    selectedTab,
    setSelectedTab,
    selectedTagId,
    setSelectedTag,
}: {
    isOpen: boolean;
    onClose: () => void;
    finalFocusRef: React.RefObject<FocusableElement>;
    selectedTab: ProgramModalTab;
    setSelectedTab: (tab: ProgramModalTab) => void;
    selectedTagId: string | null;
    setSelectedTag: (tagId: string | null) => void;
}): JSX.Element {
    const conference = useConference();
    const closeRef = useRef<HTMLButtonElement | null>(null);

    const [anyHappeningSoon, setAnyHappeningSoon] = useState<boolean>(false);
    const now = useRealTime(15 * 60 * 1000);
    const endAfter = useMemo(() => new Date(roundDownToNearest(now - 10 * 60 * 1000, 5 * 60 * 1000)).toISOString(), [
        now,
    ]);
    const startBefore = useMemo(
        () => new Date(roundUpToNearest(now + 2 * 60 * 60 * 1000, 15 * 60 * 1000)).toISOString(),
        [now]
    );
    const roomsResult = useSchedule_HappeningSoonQuery({
        variables: {
            conferenceId: conference.id,
            endAfter,
            startBefore,
        },
    });
    useEffect(() => {
        setAnyHappeningSoon(!!roomsResult.data && roomsResult.data.schedule_Event.length > 0);
    }, [setAnyHappeningSoon, roomsResult.data]);
    const happeningSoon = useMemo(
        () => (
            <ApolloQueryWrapper<
                Schedule_HappeningSoonQuery,
                unknown,
                {
                    rooms: ReadonlyArray<Schedule_RoomSummaryFragment>;
                    events: ReadonlyArray<Schedule_EventSummaryFragment>;
                    items: ReadonlyArray<Schedule_ItemElementsFragment>;
                    tags: ReadonlyArray<Schedule_TagFragment>;
                }
            >
                queryResult={roomsResult}
                getter={(x) => ({
                    rooms: x.room_Room,
                    events: x.schedule_Event,
                    items: x.schedule_Event
                        .filter((x) => !!x.item)
                        .map((x) => x.item) as Schedule_ItemElementsFragment[],
                    tags: x.collection_Tag,
                })}
            >
                {(data) => <ScheduleInner titleStr={"Happening Soon"} {...data} />}
            </ApolloQueryWrapper>
        ),
        [roomsResult]
    );

    const [anySponsors, setAnySponsors] = useState<boolean>(false);
    const result = useGetSponsorBoothsQuery({
        variables: {
            conferenceId: conference.id,
        },
        fetchPolicy: "cache-and-network",
        nextFetchPolicy: "cache-first",
    });
    useEffect(() => {
        setAnySponsors?.(!!result.data && result.data.content_Item.length > 0);
    }, [setAnySponsors, result.data]);
    const sponsors = useMemo(() => <SponsorBoothsInner sponsors={result.data?.content_Item ?? []} />, [
        result.data?.content_Item,
    ]);

    const selectedTabIndex = useMemo(() => {
        const offset1 = anyHappeningSoon ? 1 : 0;
        const offset2 = offset1 + (anySponsors ? 1 : 0);
        switch (selectedTab) {
            case ProgramModalTab.Exhibitions:
                return offset1 + 1;
            case ProgramModalTab.HappeningSoon:
                return 0;
            case ProgramModalTab.Schedule:
                return offset2 + 3;
            case ProgramModalTab.Search:
                return offset2 + 2;
            case ProgramModalTab.Sponsors:
                return offset1 + 2;
            case ProgramModalTab.Tags:
                return offset1;
        }
    }, [anyHappeningSoon, anySponsors, selectedTab]);

    const setSelectedTabFromIndex = useCallback(
        (index: number) => {
            switch (index) {
                case 0:
                    if (anyHappeningSoon) {
                        setSelectedTab(ProgramModalTab.HappeningSoon);
                    } else {
                        setSelectedTab(ProgramModalTab.Tags);
                    }
                    break;
                case 1:
                    if (anyHappeningSoon) {
                        setSelectedTab(ProgramModalTab.Tags);
                    } else {
                        setSelectedTab(ProgramModalTab.Exhibitions);
                    }
                    break;
                case 2:
                    if (anyHappeningSoon) {
                        setSelectedTab(ProgramModalTab.Exhibitions);
                    } else if (anySponsors) {
                        setSelectedTab(ProgramModalTab.Sponsors);
                    } else {
                        setSelectedTab(ProgramModalTab.Search);
                    }
                    break;
                case 3:
                    if (anyHappeningSoon && anySponsors) {
                        setSelectedTab(ProgramModalTab.Sponsors);
                    } else if (anyHappeningSoon || anySponsors) {
                        setSelectedTab(ProgramModalTab.Search);
                    } else {
                        setSelectedTab(ProgramModalTab.Schedule);
                    }
                    break;
                case 4:
                    if (anyHappeningSoon && anySponsors) {
                        setSelectedTab(ProgramModalTab.Search);
                    } else {
                        setSelectedTab(ProgramModalTab.Schedule);
                    }
                    break;
                case 5:
                    setSelectedTab(ProgramModalTab.Schedule);
                    break;
            }
        },
        [anyHappeningSoon, anySponsors, setSelectedTab]
    );

    return (
        <Modal
            initialFocusRef={closeRef}
            finalFocusRef={finalFocusRef}
            size="6xl"
            isCentered
            autoFocus={false}
            returnFocusOnClose={false}
            trapFocus={true}
            scrollBehavior="inside"
            isOpen={isOpen}
            onClose={onClose}
        >
            <ModalOverlay />
            <ModalContent minH="70vh" overflow="hidden">
                <ModalCloseButton ref={closeRef} />
                <ModalBody display="flex" justifyContent="center" overflow="hidden">
                    <Tabs
                        isLazy
                        w="100%"
                        display="flex"
                        flexDir="column"
                        index={selectedTabIndex}
                        onChange={setSelectedTabFromIndex}
                    >
                        <TabList justifyContent="center">
                            {anyHappeningSoon ? (
                                <Tab>
                                    <FAIcon iconStyle="s" icon="clock" />
                                    &nbsp;&nbsp;Happening soon
                                </Tab>
                            ) : undefined}
                            <Tab>
                                <FAIcon iconStyle="s" icon="tags" />
                                &nbsp;&nbsp;Browse content
                            </Tab>
                            <Tab>
                                <FAIcon iconStyle="s" icon="puzzle-piece" />
                                &nbsp;&nbsp;Exhibitions
                            </Tab>
                            {anySponsors ? (
                                <Tab>
                                    <FAIcon iconStyle="s" icon="star" />
                                    &nbsp;&nbsp;Sponsors
                                </Tab>
                            ) : undefined}
                            <Tab>
                                <FAIcon iconStyle="s" icon="search" />
                                &nbsp;&nbsp;Search
                            </Tab>
                            <Tab>
                                <FAIcon iconStyle="s" icon="calendar" />
                                &nbsp;&nbsp;Full schedule
                            </Tab>
                        </TabList>
                        <TabPanels h="100%" overflow="hidden">
                            {anyHappeningSoon ? (
                                <TabPanel w="100%" h="100%" display="flex" justifyContent="center">
                                    {happeningSoon}
                                </TabPanel>
                            ) : undefined}
                            <TabPanel w="100%" h="100%" display="flex" justifyContent="center" overflowY="auto">
                                <ItemList overrideSelectedTag={selectedTagId} setOverrideSelectedTag={setSelectedTag} />
                            </TabPanel>
                            <TabPanel w="100%" h="100%" overflowY="auto">
                                <ExhibitionsGrid />
                            </TabPanel>
                            {anySponsors ? <TabPanel>{sponsors}</TabPanel> : undefined}
                            <TabPanel w="100%" h="100%" overflowY="auto">
                                <SearchPanel />
                            </TabPanel>
                            <TabPanel w="100%" h="100%" display="flex" justifyContent="center">
                                <ScheduleFetchWrapper />
                            </TabPanel>
                        </TabPanels>
                    </Tabs>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
