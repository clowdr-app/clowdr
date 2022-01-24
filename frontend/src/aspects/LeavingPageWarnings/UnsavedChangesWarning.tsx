import React from "react";
import LeavePageWarning from "./LeavePageWarning";
import { useIntl } from "react-intl";


export default function UnsavedChangesWarning({ hasUnsavedChanges }: { hasUnsavedChanges: boolean }): JSX.Element {
    const intl = useIntl();
    return (
        <LeavePageWarning
            hasUnsavedChanges={hasUnsavedChanges}
            message={intl.formatMessage({ id: 'leavingpagewarnings.unsavedchangeswarning.message', defaultMessage: "You have unsaved changes, are you sure you wish to leave the page?" })}
        />
    );
}
