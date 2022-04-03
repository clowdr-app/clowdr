export interface ScheduleProps {
    conferenceId: string;
    includeAllSubconferences?: boolean;
    subconferenceId?: string;
    eventsPerPage: number;

    includeAbstract: boolean;
    wholeScheduleLink?: boolean;
    includeTypeName?: boolean;
}
