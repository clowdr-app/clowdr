import { VStack } from "@chakra-ui/react";
import React from "react";
import ScheduleList from "../../Conference/Attend/Schedule/ScheduleList";
import { useLiveEvents } from "../../LiveEvents/LiveEvents";

export default function LiveNow(): JSX.Element {
    const { liveEvents, upcomingEvents } = useLiveEvents();

    return (
        <VStack px={[2, 2, 4]} spacing={4} alignItems="flex-start" w="100%">
            <ScheduleList events={liveEvents} noDayHeadings />
            {upcomingEvents.length ? <ScheduleList events={upcomingEvents} noDayHeadings /> : undefined}
        </VStack>
    );
}
