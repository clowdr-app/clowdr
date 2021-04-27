import React, { useMemo } from "react";
import type { RoomPage_RoomDetailsFragment } from "../../../../../generated/graphql";
import CenteredSpinner from "../../../../Chakra/CenteredSpinner";
import { BreakoutChimeRoom } from "./BreakoutChimeRoom";
import { BreakoutVonageRoom } from "./BreakoutVonageRoom";

export function BreakoutRoom({
    defaultVideoBackendName,
    roomDetails,
}: {
    videoRoomBackendName?: string;
    defaultVideoBackendName?: string;
    roomDetails: RoomPage_RoomDetailsFragment;
}): JSX.Element {
    const breakoutRoomEl = useMemo(() => {
        switch (roomDetails.videoRoomBackendName) {
            case "CHIME":
                return <BreakoutChimeRoom room={roomDetails} />;
            case "VONAGE":
                return <BreakoutVonageRoom room={roomDetails} />;
        }

        switch (defaultVideoBackendName) {
            case "CHIME":
                return <BreakoutChimeRoom room={roomDetails} />;
            case "VONAGE":
            case "NO_DEFAULT":
                return <BreakoutVonageRoom room={roomDetails} />;
        }

        return <CenteredSpinner spinnerProps={{ mt: 2, mx: "auto" }} />;
    }, [defaultVideoBackendName, roomDetails]);

    return breakoutRoomEl;
}
