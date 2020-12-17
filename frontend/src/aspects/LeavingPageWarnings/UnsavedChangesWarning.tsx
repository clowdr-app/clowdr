import React from "react";
import LeavePageWarning from "./LeavePageWarning";

export default function UnsavedChangesWarning({ hasUnsavedChanges }: { hasUnsavedChanges: boolean }): JSX.Element {
    return (
        <LeavePageWarning
            hasUnsavedChanges={hasUnsavedChanges}
            message={"You have unsaved changes, are you sure you wish to leave the page?"}
        />
    );
}
