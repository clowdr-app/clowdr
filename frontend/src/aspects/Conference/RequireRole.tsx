import React from "react";
import { Registrant_RegistrantRole_Enum } from "../../generated/graphql";
import { useAuthParameters } from "../GQL/AuthParameters";
import { useMaybeConference } from "./useConference";
import { useMaybeCurrentRegistrant } from "./useCurrentRegistrant";

export default function RequireRole({
    children,
    organizerRole,
    moderatorRole,
    attendeeRole,
    permitIfAnySubconference = false,
    componentIfDenied,
}: {
    children: React.ReactNode | React.ReactNode[];
    organizerRole?: boolean;
    moderatorRole?: boolean;
    attendeeRole?: boolean;
    permitIfAnySubconference?: boolean;
    componentIfDenied?: JSX.Element;
}): JSX.Element | null {
    const conference = useMaybeConference();
    const registrant = useMaybeCurrentRegistrant();
    const { subconferenceId } = useAuthParameters();

    if (conference && "registrants" in conference && conference.registrants.length && !registrant) {
        return <></>;
    }

    if (
        registrant &&
        (hasPermission(registrant.conferenceRole, organizerRole, moderatorRole, attendeeRole) ||
            registrant.subconferenceMemberships.some(
                (x) =>
                    (permitIfAnySubconference || x.subconferenceId === subconferenceId) &&
                    hasPermission(x.role, organizerRole, moderatorRole, attendeeRole)
            ))
    ) {
        return <>{children}</>;
    }

    return componentIfDenied ?? null;
}

function hasPermission(
    role: Registrant_RegistrantRole_Enum,
    organizerRole: boolean | undefined,
    moderatorRole: boolean | undefined,
    attendeeRole: boolean | undefined
) {
    return (
        (organizerRole && role === Registrant_RegistrantRole_Enum.Organizer) ||
        (moderatorRole &&
            (role === Registrant_RegistrantRole_Enum.Moderator || role === Registrant_RegistrantRole_Enum.Organizer)) ||
        (attendeeRole &&
            (role === Registrant_RegistrantRole_Enum.Attendee ||
                role === Registrant_RegistrantRole_Enum.Moderator ||
                role === Registrant_RegistrantRole_Enum.Organizer))
    );
}
