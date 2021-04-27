import { Box } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type { RoomPage_RoomDetailsFragment } from "../../../../../generated/graphql";
import CenteredSpinner from "../../../../Chakra/CenteredSpinner";
import { BreakoutChimeRoom } from "./BreakoutChimeRoom";
import { BreakoutVonageRoom } from "./BreakoutVonageRoom";

export function BreakoutRoom({
    defaultVideoBackendName,
    roomDetails,
    enable,
}: {
    videoRoomBackendName?: string;
    defaultVideoBackendName?: string;
    roomDetails: RoomPage_RoomDetailsFragment;
    enable: boolean;
}): JSX.Element {
    const backend = useMemo(() => {
        switch (roomDetails.videoRoomBackendName) {
            case "CHIME":
                return "CHIME";
            case "VONAGE":
                return "VONAGE";
        }

        switch (defaultVideoBackendName) {
            case "CHIME":
                return "CHIME";
            case "VONAGE":
            case "NO_DEFAULT":
                return "VONAGE";
        }
        return null;
    }, [defaultVideoBackendName, roomDetails.videoRoomBackendName]);

    const enableChime = backend === "CHIME" && enable;
    const enableVonage = backend === "VONAGE" && enable;

    const breakoutRoomEl = useMemo(() => {
        return (
            <>
                <Box display={enableChime ? "block" : "none"}>
                    <BreakoutChimeRoom room={roomDetails} enable={enableChime} />
                </Box>
                <Box display={enableVonage ? "block" : "none"}>
                    <BreakoutVonageRoom room={roomDetails} enable={enableVonage} />
                </Box>
                {!backend && enable ? <CenteredSpinner spinnerProps={{ mt: 2, mx: "auto" }} /> : undefined}
            </>
        );
    }, [backend, enable, roomDetails]);

    return breakoutRoomEl;
}
