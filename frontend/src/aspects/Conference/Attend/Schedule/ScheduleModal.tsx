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
} from "@chakra-ui/react";
import type { FocusableElement } from "@chakra-ui/utils";
import * as R from "ramda";
import type { MutableRefObject } from "react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
    Schedule_EventSummaryFragment,
    Schedule_HappeningSoonQuery,
    Schedule_ItemFieldsFragment,
    Schedule_ProgramPersonFragment,
    Schedule_RoomSummaryFragment,
    Schedule_TagFragment,
} from "../../../../generated/graphql";
import { useGetSponsorBoothsQuery, useSchedule_HappeningSoonQuery } from "../../../../generated/graphql";
import { roundDownToNearest, roundUpToNearest } from "../../../Generic/MathUtils";
import { useRealTime } from "../../../Generic/useRealTime";
import QueryWrapper from "../../../GQL/QueryWrapper";
import { FAIcon } from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";
import ItemList from "../Content/ItemList";
import { ExhibitionsGrid } from "../Exhibition/ExhibitionsPage";
import { SponsorBoothsInner } from "../Rooms/V2/SponsorBooths";
import SearchPanel from "../Search/SearchPanel";
import { ProgramModalTab } from "./ProgramModal";
import { ScheduleFetchWrapper, ScheduleInner } from "./v1/Schedule";
import WholeSchedule from "./v2/WholeSchedule";

export default function ScheduleModal({
    isOpen,
    onClose,
    finalFocusRef,
    selectedTab,
    setSelectedTab,
    selectedTagId,
    setSelectedTag,
    changeSearch,
}: {
    isOpen: boolean;
    onClose: () => void;
    finalFocusRef: React.RefObject<FocusableElement>;
    selectedTab: ProgramModalTab;
    setSelectedTab: (tab: ProgramModalTab) => void;
    selectedTagId: string | null;
    setSelectedTag: (tagId: string | null) => void;
    changeSearch: MutableRefObject<null | ((term: string) => void)>;
}): JSX.Element {
    const conference = useConference();
    const closeRef = useRef<HTMLButtonElement | null>(null);

    const [anyHappeningSoon, setAnyHappeningSoon] = useState<boolean>(false);
    const now = useRealTime(15 * 60 * 1000);
    const endAfter = useMemo(
        () => new Date(roundDownToNearest(now - 10 * 60 * 1000, 5 * 60 * 1000)).toISOString(),
        [now]
    );
    const startBefore = useMemo(
        () => new Date(roundUpToNearest(now + 2 * 60 * 60 * 1000, 15 * 60 * 1000)).toISOString(),
        [now]
    );
    const loadedAt = useMemo(() => Date.now(), []);
    const now60s = useRealTime(60000);
    const [roomsResult] = useSchedule_HappeningSoonQuery({
        variables: {
            conferenceId: conference.id,
            endAfter,
            startBefore,
        },
        pause: !isOpen && now60s - loadedAt < 60000,
    });
    useEffect(() => {
        setAnyHappeningSoon(!!roomsResult.data && roomsResult.data.schedule_Event.length > 0);
    }, [setAnyHappeningSoon, roomsResult.data]);
    const happeningSoon = useMemo(
        () => (
            <QueryWrapper<
                Schedule_HappeningSoonQuery,
                unknown,
                {
                    rooms: ReadonlyArray<Schedule_RoomSummaryFragment>;
                    events: ReadonlyArray<Schedule_EventSummaryFragment>;
                    items: ReadonlyArray<Schedule_ItemFieldsFragment>;
                    tags: ReadonlyArray<Schedule_TagFragment>;
                    people: ReadonlyArray<Schedule_ProgramPersonFragment>;
                }
            >
                queryResult={roomsResult}
                getter={(x) => ({
                    rooms: R.uniqBy(
                        (r) => r.id,
                        x.schedule_Event.flatMap((e) => e.room)
                    ),
                    events: x.schedule_Event,
                    items: x.schedule_Event.filter((x) => !!x.item).map((x) => x.item) as Schedule_ItemFieldsFragment[],
                    tags: x.collection_Tag,
                    people: x.collection_ProgramPerson,
                })}
            >
                {(data) => <ScheduleInner titleStr={"Happening Soon"} {...data} />}
            </QueryWrapper>
        ),
        [roomsResult]
    );

    const [anySponsors, setAnySponsors] = useState<boolean>(false);
    const [result] = useGetSponsorBoothsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });
    useEffect(() => {
        setAnySponsors?.(!!result.data && result.data.content_Item.length > 0);
    }, [setAnySponsors, result.data]);
    const sponsors = useMemo(
        () => <SponsorBoothsInner sponsors={result.data?.content_Item ?? []} />,
        [result.data?.content_Item]
    );

    const selectedTabIndex = useMemo(() => {
        const offset1 = anyHappeningSoon ? 1 : 0;
        const offset2 = offset1 + (anySponsors ? 1 : 0);
        switch (selectedTab) {
            case ProgramModalTab.Exhibitions:
                return offset1 + 1;
            case ProgramModalTab.HappeningSoon:
                return 0;
            case ProgramModalTab.SchedulePreview:
                return offset2 + 4;
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
                    } else if (anyHappeningSoon || anySponsors) {
                        setSelectedTab(ProgramModalTab.Schedule);
                    } else {
                        setSelectedTab(ProgramModalTab.SchedulePreview);
                    }
                    break;
                case 5:
                    if (anyHappeningSoon && anySponsors) {
                        setSelectedTab(ProgramModalTab.Schedule);
                    } else {
                        setSelectedTab(ProgramModalTab.SchedulePreview);
                    }
                    break;
                case 6:
                    setSelectedTab(ProgramModalTab.SchedulePreview);
                    break;
            }
        },
        [anyHappeningSoon, anySponsors, setSelectedTab]
    );

    const enableScheduleViewV2 = conference.scheduleViewVersion[0]?.value === "v2";

    return (
        <Modal
            initialFocusRef={closeRef}
            finalFocusRef={finalFocusRef}
            size="full"
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
                        variant="enclosed-colored"
                        colorScheme="PrimaryActionButton"
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
                                &nbsp;&nbsp;{conference.visibleExhibitionsLabel[0]?.value ?? "Exhibition"}s
                            </Tab>
                            {anySponsors ? (
                                <Tab>
                                    <FAIcon iconStyle="s" icon="star" />
                                    &nbsp;&nbsp;{conference.sponsorsLabel?.[0]?.value ?? "Sponsors"}
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
                            {enableScheduleViewV2 ? (
                                <Tab>
                                    <FAIcon iconStyle="s" icon="calendar" />
                                    &nbsp;&nbsp;Schedule V2: Early preview
                                </Tab>
                            ) : undefined}
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
                            {anySponsors ? (
                                <TabPanel w="100%" h="100%" overflowY="auto">
                                    {sponsors}
                                </TabPanel>
                            ) : undefined}
                            <TabPanel w="100%" h="100%" overflowY="auto">
                                <SearchPanel changeSearch={changeSearch} />
                            </TabPanel>
                            <TabPanel w="100%" h="100%" display="flex" flexDir="column" alignItems="center">
                                <ScheduleFetchWrapper />
                            </TabPanel>
                            {enableScheduleViewV2 ? (
                                <TabPanel w="100%" h="100%" display="flex" flexDir="column" alignItems="center">
                                    <WholeSchedule />
                                </TabPanel>
                            ) : undefined}
                        </TabPanels>
                    </Tabs>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
}
