import { Box } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type { RoomPage_RoomDetailsFragment } from "../../../../../generated/graphql";
import CenteredSpinner from "../../../../Chakra/CenteredSpinner";
import EmojiFloatContainer from "../../../../Emoji/EmojiFloatContainer";
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
        switch (roomDetails.backendName) {
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
    }, [defaultVideoBackendName, roomDetails.backendName]);

    const enableChime = backend === "CHIME" && enable;
    const enableVonage = backend === "VONAGE" && enable;

    const breakoutRoomEl = useMemo(() => {
        return (
            <>
                <Box pos="relative" display={enableChime ? "block" : "none"}>
                    <BreakoutChimeRoom room={roomDetails} enable={enableChime} />
                    {enableChime ? <EmojiFloatContainer /> : undefined}
                </Box>
                <Box pos="relative" display={enableVonage ? "block" : "none"}>
                    <BreakoutVonageRoom room={roomDetails} enable={enableVonage} />
                    {enableVonage ? <EmojiFloatContainer /> : undefined}
                </Box>
                {!backend && enable ? <CenteredSpinner spinnerProps={{ mt: 2, mx: "auto" }} /> : undefined}
            </>
        );
    }, [backend, enable, enableChime, enableVonage, roomDetails]);

    return breakoutRoomEl;
}
