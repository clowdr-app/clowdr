import React from "react";
import Schedule from "../../Conference/Attend/Schedule/Schedule";
import { useConference } from "../../Conference/useConference";

export default function SchedulePullout(): JSX.Element {
    const conference = useConference();
    return (
        <Schedule
            conferenceId={conference.id}
            includeAllSubconferences
            eventsPerPage={1000}
            selectableDates
            includeAbstract={false}
        />
    );
}
