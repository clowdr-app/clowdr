import type { StatProps } from "@chakra-ui/react";
import { Stat, StatHelpText, StatLabel, StatNumber } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useMaybeConference } from "../Conference/useConference";
import { usePresenceState } from "./PresenceStateProvider";

export default function ConferenceCountText(props: StatProps): JSX.Element {
    const presence = usePresenceState();
    const [conferenceCount, setConferenceCount] = useState<number | null>(null);
    const mConference = useMaybeConference();

    useEffect(() => {
        return presence.observeConference(mConference?.slug, (ids) => {
            setConferenceCount(ids.size);
        });
    }, [mConference?.slug, presence]);

    return (
        <Stat {...props}>
            <StatLabel>Online users</StatLabel>
            <StatNumber>{conferenceCount}</StatNumber>
            <StatHelpText>Unique users with at least 1 tab open in the last 2 minutes.</StatHelpText>
        </Stat>
    );
}
