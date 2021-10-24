import React from "react";
import { Registrant_RegistrantRole_Enum } from "../../generated/graphql";
import { useMaybeCurrentRegistrant } from "./useCurrentRegistrant";

export default function RequireRole({
    children,
    organizerRole,
    moderatorRole,
    attendeeRole,
    componentIfDenied,
}: {
    children: React.ReactNode | React.ReactNodeArray;
    organizerRole?: boolean;
    moderatorRole?: boolean;
    attendeeRole?: boolean;
    componentIfDenied?: JSX.Element;
}): JSX.Element | null {
    const registrant = useMaybeCurrentRegistrant();

    if (
        registrant &&
        ((organizerRole && registrant.conferenceRole === Registrant_RegistrantRole_Enum.Organizer) ||
            ((moderatorRole || organizerRole) &&
                (registrant.conferenceRole === Registrant_RegistrantRole_Enum.Moderator ||
                    registrant.conferenceRole === Registrant_RegistrantRole_Enum.Organizer)) ||
            ((attendeeRole || moderatorRole || organizerRole) &&
                (registrant.conferenceRole === Registrant_RegistrantRole_Enum.Attendee ||
                    registrant.conferenceRole === Registrant_RegistrantRole_Enum.Moderator ||
                    registrant.conferenceRole === Registrant_RegistrantRole_Enum.Organizer)))
    ) {
        return <>{children}</>;
    }

    return componentIfDenied ?? null;
}
