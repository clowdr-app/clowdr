/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { VStack } from "@chakra-ui/react";
import { DateTime } from "luxon";
import React from "react";
import ContinuousSchedule from "./ContinuousSchedule";
import type { ScheduleProps } from "./ScheduleProps";
import SelectableSchedule from "./SelectableSchedule";

export default function Schedule({
    selectableDates,
    ...props
}: ScheduleProps & {
    selectableDates: boolean;
}): JSX.Element {
    if (selectableDates) {
        return <SelectableSchedule canLoadBeyondEnd={true} {...props} />;
    } else {
        return (
            <VStack spacing={4} alignItems="flex-start" w="100%">
                <ContinuousSchedule startAtMs={DateTime.now().startOf("hour").toMillis()} {...props} />
            </VStack>
        );
    }
}
