import { assert } from "@midspace/assert";
import React, { useContext, useEffect, useState } from "react";
import type { Maybe, Registrant_RegistrantRole_Enum } from "../../generated/graphql";
import type { BadgeData } from "../Badges/ProfileBadge";
import { useConference } from "./useConference";

export type Profile = {
    readonly registrantId: string;
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

export type Registrant = {
    readonly id: any;
    readonly userId?: Maybe<string>;
    readonly displayName: string;
    readonly profile: Profile;
    readonly conferenceRole: Registrant_RegistrantRole_Enum;
};

export type RegistrantContextT = Registrant;

const CurrentRegistrantContext = React.createContext<RegistrantContextT | undefined>(undefined);
const CurrentRegistrantUpdateContext = React.createContext<
    undefined | ((value: RegistrantContextT | undefined) => void)
>(undefined);

export default function useCurrentRegistrant(): RegistrantContextT {
    const ctx = React.useContext(CurrentRegistrantContext);
    assert.truthy(ctx, "useCurrentRegistrant: Context not available");
    return ctx;
}

export function useMaybeCurrentRegistrant(): RegistrantContextT | undefined {
    return React.useContext(CurrentRegistrantContext);
}

export function CurrentRegistrantProvider({ children }: { children: React.ReactChild }): JSX.Element {
    const [ctx, setCtx] = useState<Registrant | undefined>(undefined);
    return (
        <CurrentRegistrantUpdateContext.Provider value={setCtx}>
            <CurrentRegistrantContext.Provider value={ctx}>{children}</CurrentRegistrantContext.Provider>
        </CurrentRegistrantUpdateContext.Provider>
    );
}

export function CurrentRegistrantUpdater(): JSX.Element {
    const conference = useConference();
    const setCtx = useContext(CurrentRegistrantUpdateContext);

    useEffect(() => {
        if (!("registrants" in conference)) {
            setCtx?.(undefined);
            return;
        }
        const registrants = conference.registrants;
        setCtx?.(registrants.length > 0 ? (registrants[0] as Registrant) : undefined);
    }, [conference, setCtx]);

    return <></>;
}
