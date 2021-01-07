import React from "react";
import useCurrentAttendee, { CurrentAttendeeProvider } from "../../useCurrentAttendee";
import EditProfilePitureForm from "./EditProfilePictureForm";

function EditProfilePageInner(): JSX.Element {
    const attendee = useCurrentAttendee();
    return (
        <>
            {attendee.displayName}
            <EditProfilePitureForm />
        </>
    );
}

export default function EditProfilePage(): JSX.Element {
    return (
        <CurrentAttendeeProvider>
            <EditProfilePageInner />
        </CurrentAttendeeProvider>
    );
}
