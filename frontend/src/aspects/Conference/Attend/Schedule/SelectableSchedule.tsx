/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { HStack, Select, Text, VStack } from "@chakra-ui/react";
import { DateTime, Duration, SystemZone } from "luxon";
import React, { useEffect, useMemo } from "react";
import { gql } from "urql";
import { useSelectScheduleBoundsQuery } from "../../../../generated/graphql";
import CenteredSpinner from "../../../Chakra/CenteredSpinner";
import { LinkButton } from "../../../Chakra/LinkButton";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { useRestorableState } from "../../../Hooks/useRestorableState";
import ContinuousSchedule from "./ContinuousSchedule";
import type { ScheduleProps } from "./ScheduleProps";

gql`
    query SelectScheduleBounds($where: schedule_Event_bool_exp!) @cached {
        first: schedule_Event(where: $where, order_by: [{ scheduledStartTime: asc }], limit: 1) {
            id
            scheduledStartTime
        }
        last: schedule_Event(where: $where, order_by: [{ scheduledEndTime: desc }], limit: 1) {
            id
            scheduledEndTime
        }
    }
`;

export default function SelectableSchedule({
    conferenceId,
    includeAllSubconferences,
    subconferenceId,
    ...props
}: ScheduleProps & {
    canLoadBeyondEnd: boolean;
}): JSX.Element {
    const [boundsResponse] = useSelectScheduleBoundsQuery({
        variables: {
            where: {
                conferenceId: { _eq: conferenceId },
                ...(includeAllSubconferences
                    ? {}
                    : {
                          subconferenceId: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
                      }),
                sessionEventId: { _is_null: true },
            },
        },
    });

    return boundsResponse.fetching ? (
        <CenteredSpinner caller="Schedule.tsx:60" />
    ) : boundsResponse.data ? (
        <SelectableScheduleInner
            earliestTime={boundsResponse.data.first[0]?.scheduledStartTime}
            latestTime={boundsResponse.data.last[0]?.scheduledEndTime}
            conferenceId={conferenceId}
            includeAllSubconferences={includeAllSubconferences}
            subconferenceId={subconferenceId}
            {...props}
        />
    ) : (
        <Text>Unable to load schedule.</Text>
    );
}

function SelectableScheduleInner({
    earliestTime,
    latestTime,
    conferenceId,
    includeAllSubconferences,
    subconferenceId,
    wholeScheduleLink,
    ...props
}: ScheduleProps & {
    earliestTime: string | null | undefined;
    latestTime: string | null | undefined;

    wholeScheduleLink?: boolean;
}): JSX.Element {
    const { conferencePath } = useAuthParameters();

    const days = useMemo(() => {
        if (!earliestTime || !latestTime) {
            return [];
        }

        const startDate = DateTime.fromISO(earliestTime).setZone(SystemZone.instance).startOf("day");
        const endDate = DateTime.fromISO(latestTime).setZone(SystemZone.instance).startOf("day");
        const result: {
            label: string;
            value: number;
        }[] = [];
        let currentDate = startDate;
        while (currentDate.toMillis() <= endDate.toMillis()) {
            result.push({
                label: currentDate.toLocaleString({
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                }),
                value: currentDate.toMillis(),
            });
            currentDate = currentDate.plus(
                Duration.fromObject({
                    days: 1,
                })
            );
        }
        return result;
    }, [earliestTime, latestTime]);

    const today = useMemo(() => DateTime.now().startOf("day"), []);
    const todayMillis = useMemo(() => today.toMillis(), [today]);
    const todayInSchedule = useMemo(() => days.some((x) => x.value === todayMillis), [days, todayMillis]);
    const defaultSelectedDay = todayInSchedule ? todayMillis : days[0]?.value ?? 0;
    const [selectedDay, setSelectedDay] = useRestorableState<{ day: number; at: number }>(
        `PreviouslySelectedDay-v2-${conferenceId}-${subconferenceId}`,
        { day: defaultSelectedDay, at: Date.now() },
        (x) => JSON.stringify(x),
        (x) => JSON.parse(x)
    );

    useEffect(() => {
        if (selectedDay.at < Date.now() - 12 * 60 * 60 * 1000) {
            setSelectedDay({
                day: defaultSelectedDay,
                at: Date.now(),
            });
        }
    }, [defaultSelectedDay, selectedDay.at, setSelectedDay]);

    return (
        <VStack spacing={4} alignItems="flex-start" overflow="hidden">
            <HStack w="100%" p={1}>
                <Select
                    minW="max-content"
                    maxW="100%"
                    w="100%"
                    borderColor="SecondaryActionButton.500"
                    aria-label="Select date"
                    value={selectedDay.day.toString()}
                    onChange={(ev) => {
                        const value = parseInt(ev.target.value, 10);
                        setSelectedDay({
                            day: value,
                            at: Date.now(),
                        });
                    }}
                >
                    {days.map((day) => (
                        <option
                            key={day.value}
                            value={day.value}
                            css={{
                                fontWeight: day.value === todayMillis ? "bold" : undefined,
                            }}
                        >
                            {day.label}
                        </option>
                    ))}
                    {days.length === 0 ? <option value={0}>No dates available</option> : undefined}
                </Select>
                {wholeScheduleLink ? (
                    <LinkButton to={`${conferencePath}/schedule`} variant="outline">
                        Whole schedule
                    </LinkButton>
                ) : undefined}
            </HStack>
            <VStack overflowX="hidden" overflowY="auto" css={{ scrollbarWidth: "thin" }} px={2} pb={4}>
                {selectedDay.day !== 0 ? (
                    <ContinuousSchedule
                        startAtMs={selectedDay.day}
                        conferenceId={conferenceId}
                        subconferenceId={subconferenceId}
                        includeAllSubconferences={includeAllSubconferences}
                        {...props}
                    />
                ) : (
                    <Text>No sessions to display.</Text>
                )}
            </VStack>
        </VStack>
    );
}
