import assert from "assert";
import React, { ReactNode, ReactNodeArray, useMemo } from "react";
import type { Maybe } from "../../generated/graphql";
import type { BadgeData } from "../Badges/ProfileBadge";
import { useConference } from "./useConference";

export type AttendeeProfile = {
    readonly attendeeId: string;
    readonly realName?: Maybe<string>;
    readonly badges?: Maybe<BadgeData[]>;
    readonly affiliation?: Maybe<string>;
    readonly affiliationURL?: Maybe<string>;
    readonly country?: Maybe<string>;
    readonly timezoneUTCOffset?: Maybe<number>;
    readonly bio?: Maybe<string>;
    readonly website?: Maybe<string>;
    readonly github?: Maybe<string>;
    readonly twitter?: Maybe<string>;
    readonly pronouns?: Maybe<string[]>;
    readonly photoURL_50x50?: Maybe<string>;
    readonly photoURL_350x350?: Maybe<string>;
    readonly hasBeenEdited: boolean;
};

export type Attendee = {
    readonly id: any;
    readonly userId?: Maybe<string>;
    readonly displayName: string;
    readonly profile: AttendeeProfile;
};

export type AttendeeContextT = Attendee;

const CurrentAttendeeContext = React.createContext<AttendeeContextT | undefined>(undefined);

export default function useCurrentAttendee(): AttendeeContextT {
    const ctx = React.useContext(CurrentAttendeeContext);
    assert(ctx, "useCurrentAttendee: Context not available");
    return ctx;
}

export function useMaybeCurrentAttendee(): AttendeeContextT | undefined {
    return React.useContext(CurrentAttendeeContext);
}

export function CurrentAttendeeProvider({ children }: { children: ReactNode | ReactNodeArray }): JSX.Element {
    const conference = useConference();

    const ctx = useMemo(() => {
        if (!("attendees" in conference)) {
            return undefined;
        }
        // Annoyingly, GraphQL CodeGen mistakenly types `conference.attendees`
        // as a single object rather than an array. Arguably, it is correct, on
        // the basis of the primary key. But Hasura still returns it as an array.
        return conference.attendees.length > 0 ? (conference.attendees[0] as Attendee) : undefined;
    }, [conference]);

    return <CurrentAttendeeContext.Provider value={ctx}>{children}</CurrentAttendeeContext.Provider>;
}
