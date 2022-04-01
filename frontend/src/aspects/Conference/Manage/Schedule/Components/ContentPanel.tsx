import React from "react";
import { gql } from "urql";
import type { PanelProps } from "../../../../CRUDCards/Types";
import type { ScheduleEditorRecord } from "./ScheduleEditorRecord";

gql`
    fragment ManageSchedule_Element on content_Element {
        id
        name
        data
        layoutData
        typeName
        uploadsRemaining
        isHidden
    }
`;

export default function ContentPanel({ record }: PanelProps<ScheduleEditorRecord>): JSX.Element {
    const isSession = !("sessionEventId" in record && record.sessionEventId);
    return (
        <>
            Coming soon! For now, please use the Manage Content page to edit your{" "}
            {isSession ? "session's" : "presentation's"} content.
        </>
    );
}
