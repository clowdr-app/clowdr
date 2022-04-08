import { Heading, Tab, TabList, TabPanel, TabPanels, Tabs, VStack } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo } from "react";
import { useRestorableState } from "../../../Hooks/useRestorableState";
import { useTitle } from "../../../Hooks/useTitle";
import { useConference } from "../../useConference";
import Schedule from "./Schedule";
import type { ScheduleProps } from "./ScheduleProps";

export default function WholeSchedule(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Schedule - ${conference.name}`);

    const sortedSubconferences = useMemo(
        () => R.sortBy((x) => x.shortName, conference.subconferences),
        [conference.subconferences]
    );

    const defaultScheduleProps = useMemo<
        Pick<ScheduleProps, "eventsPerPage" | "includeAbstract" | "includeTypeName"> & {
            selectableDates: boolean;
        }
    >(
        () => ({
            eventsPerPage: 10,
            selectableDates: true,
            includeAbstract: true,
            includeTypeName: true,
        }),
        []
    );

    const [selectedTabIndex, setSelectedTabIndex] = useRestorableState<number>(
        `WholeScheduleSelectedTab-${conference.id}`,
        0,
        (x) => x.toString(),
        (x) => parseInt(x, 10)
    );

    return (
        <VStack spacing={4} w="100%" alignItems="flex-start" p={[0, 2, 4]}>
            {title}
            <Heading as="h2">Schedule</Heading>
            {sortedSubconferences.length > 0 ? (
                <Tabs
                    isLazy
                    variant="line"
                    index={selectedTabIndex}
                    onChange={(idx) => {
                        setSelectedTabIndex(idx);
                    }}
                    colorScheme="PrimaryActionButton"
                    w="100%"
                >
                    <TabList overflowX="auto" overflowY="hidden" css={{ scrollbarWidth: "thin" }}>
                        <Tab>All</Tab>
                        <Tab>{conference.shortName}</Tab>
                        {sortedSubconferences.map((subconf) => (
                            <Tab key={subconf.id}>{subconf.shortName}</Tab>
                        ))}
                    </TabList>
                    <TabPanels>
                        <TabPanel>
                            <Schedule
                                conferenceId={conference.id}
                                includeAllSubconferences={true}
                                {...defaultScheduleProps}
                            />
                        </TabPanel>
                        <TabPanel>
                            <Schedule conferenceId={conference.id} {...defaultScheduleProps} />
                        </TabPanel>
                        {sortedSubconferences.map((subconf) => (
                            <TabPanel key={subconf.id}>
                                <Schedule
                                    conferenceId={conference.id}
                                    subconferenceId={subconf.id}
                                    {...defaultScheduleProps}
                                />
                            </TabPanel>
                        ))}
                    </TabPanels>
                </Tabs>
            ) : (
                <Schedule conferenceId={conference.id} {...defaultScheduleProps} />
            )}
        </VStack>
    );
}
