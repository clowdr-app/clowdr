import { gql } from "@apollo/client";
import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalOverlay,
    ModalProps,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
} from "@chakra-ui/react";
import React, { useMemo, useRef } from "react";
import {
    Schedule_EventSummaryFragment,
    Schedule_HappeningSoonQuery,
    Schedule_ItemElementsFragment,
    Schedule_RoomSummaryFragment,
    useSchedule_HappeningSoonQuery,
} from "../../../../generated/graphql";
import { roundDownToNearest, roundUpToNearest } from "../../../Generic/MathUtils";
import { useRealTime } from "../../../Generic/useRealTime";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { FAIcon } from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";
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
    }
`;

export function HappeningSoonFetchWrapper(): JSX.Element {
    const conference = useConference();
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
    return (
        <ApolloQueryWrapper<
            Schedule_HappeningSoonQuery,
            unknown,
            {
                rooms: ReadonlyArray<Schedule_RoomSummaryFragment>;
                events: ReadonlyArray<Schedule_EventSummaryFragment>;
                items: ReadonlyArray<Schedule_ItemElementsFragment>;
            }
        >
            queryResult={roomsResult}
            getter={(x) => ({
                rooms: x.room_Room,
                events: x.schedule_Event,
                items: x.schedule_Event.filter((x) => !!x.item).map((x) => x.item) as Schedule_ItemElementsFragment[],
            })}
        >
            {(data) => <ScheduleInner titleStr={"Happening Soon"} {...data} />}
        </ApolloQueryWrapper>
    );
}

export function ScheduleModal(props: Omit<ModalProps, "children">): JSX.Element {
    const closeRef = useRef<HTMLButtonElement | null>(null);

    return (
        <Modal
            initialFocusRef={closeRef}
            size="6xl"
            isCentered
            autoFocus={false}
            returnFocusOnClose={false}
            trapFocus={true}
            scrollBehavior="inside"
            {...props}
        >
            <ModalOverlay />
            <ModalContent minH="70vh" overflow="hidden">
                <ModalCloseButton ref={closeRef} />
                <ModalBody display="flex" justifyContent="center" overflow="hidden">
                    <Tabs isLazy w="100%" h="100%" display="flex" flexDir="column">
                        <TabList justifyContent="center">
                            <Tab>
                                <FAIcon iconStyle="s" icon="clock" />
                                &nbsp;&nbsp;Happening Soon
                            </Tab>
                            <Tab>
                                <FAIcon iconStyle="s" icon="search" />
                                &nbsp;&nbsp;Search program
                            </Tab>
                            <Tab>
                                <FAIcon iconStyle="s" icon="calendar" />
                                &nbsp;&nbsp;Full schedule
                            </Tab>
                        </TabList>
                        <TabPanels h="100%" overflow="hidden">
                            <TabPanel w="100%" h="100%" display="flex" justifyContent="center">
                                <HappeningSoonFetchWrapper />
                            </TabPanel>
                            <TabPanel w="100%" h="100%">
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
