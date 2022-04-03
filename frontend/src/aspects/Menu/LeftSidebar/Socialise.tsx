import { useBreakpointValue } from "@chakra-ui/react";
import React from "react";
import { SocialiseModalTab, SocialiseTabs } from "../../Conference/Attend/Rooms/SocialiseTabs";
import { useConference } from "../../Conference/useConference";
import { useRestorableState } from "../../Hooks/useRestorableState";

export default function SocialisePullout(): JSX.Element {
    const conference = useConference();
    const [selectedTab, setSelectedTab] = useRestorableState<SocialiseModalTab>(
        "SocialiseModal_SelectedTab" + conference.id,
        SocialiseModalTab.Rooms,
        (x) => x,
        (x) => x as SocialiseModalTab
    );
    const buttonSize = useBreakpointValue(["sm", "sm", "md"]);

    return (
        <SocialiseTabs
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
            tabButtonSize={buttonSize}
            columns={1}
            linkInsteadOfModal
            alignLeft
        />
    );
}
