import * as luxon from "luxon";
import React, { useMemo } from "react";
import { gql } from "urql";
import { useScheduleV2_AllEvents_ParamsQuery } from "../../../../../generated/graphql";
import CenteredSpinner from "../../../../Chakra/CenteredSpinner";
import { useConference } from "../../../useConference";
import Schedule from "./Schedule";

gql`
    query ScheduleV2_AllEvents_Params($conferenceId: uuid!) @cached {
        earliestStartingEvent: schedule_Event(
            where: { conferenceId: { _eq: $conferenceId }, sessionEventId: { _is_null: true } }
            limit: 1
            order_by: { scheduledStartTime: asc }
        ) {
            id
            scheduledStartTime
            conferenceId
        }
        latestEndingEvent: schedule_Event(
            where: { conferenceId: { _eq: $conferenceId }, sessionEventId: { _is_null: true } }
            limit: 1
            order_by: { scheduledEndTime: desc }
        ) {
            id
            scheduledEndTime
            conferenceId
        }
    }
`;

export default function WholeSchedule(): JSX.Element {
    const conference = useConference();
    const [eventsResponse] = useScheduleV2_AllEvents_ParamsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    const earliestStartingTime = useMemo(() => {
        if (eventsResponse.data?.earliestStartingEvent) {
            return luxon.DateTime.fromISO(eventsResponse.data.earliestStartingEvent[0].scheduledStartTime);
        }
        return undefined;
    }, [eventsResponse.data?.earliestStartingEvent]);

    const latestEndingTime = useMemo(() => {
        if (eventsResponse.data?.latestEndingEvent[0]?.scheduledEndTime) {
            return luxon.DateTime.fromISO(eventsResponse.data.latestEndingEvent[0].scheduledEndTime);
        }
        return undefined;
    }, [eventsResponse.data?.latestEndingEvent]);

    if (eventsResponse.fetching || !eventsResponse.data) {
        return <CenteredSpinner caller="WholeSchedule:55" />;
    }

    if (!earliestStartingTime || !latestEndingTime) {
        return <>No events</>;
    }

    return <Schedule earliestStartingTime={earliestStartingTime} latestEndingTime={latestEndingTime} />;
}
