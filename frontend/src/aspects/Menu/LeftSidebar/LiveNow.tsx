import { VStack } from "@chakra-ui/react";
import React from "react";
import { ScheduleList } from "../../Conference/Attend/Schedule/Schedule";
import { useLiveEvents } from "../../LiveEvents/LiveEvents";

export default function LiveNow(): JSX.Element {
    const { liveEvents, upcomingEvents } = useLiveEvents();

    return (
        <VStack spacing={4}>
            <ScheduleList events={liveEvents} noDayHeadings />
            {upcomingEvents.length ? <ScheduleList events={upcomingEvents} noDayHeadings /> : undefined}
        </VStack>
    );
}
