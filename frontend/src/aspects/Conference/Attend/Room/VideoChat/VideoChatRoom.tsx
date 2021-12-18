import { Box } from "@chakra-ui/react";
import React, { useMemo } from "react";
import type { RoomPage_RoomDetailsFragment } from "../../../../../generated/graphql";
import CenteredSpinner from "../../../../Chakra/CenteredSpinner";
import EmojiFloatContainer from "../../../../Emoji/EmojiFloatContainer";
import { VideoChatChimeRoom } from "./ChimeRoom";
import { VideoChatVonageRoom } from "./VonageRoom";

export function VideoChatRoom({
    defaultVideoBackendName,
    roomDetails,
    enable,
    eventId,
    eventIsFuture,
    isPresenterOrChairOrOrganizer,
}: {
    videoRoomBackendName?: string;
    defaultVideoBackendName?: string;
    roomDetails: RoomPage_RoomDetailsFragment;
    enable: boolean;
    eventId: string | undefined;
    eventIsFuture: boolean;
    isPresenterOrChairOrOrganizer: boolean;
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
                    <VideoChatChimeRoom room={roomDetails} enable={enableChime} />
                    {enableChime ? <EmojiFloatContainer chatId={roomDetails.chatId ?? ""} /> : undefined}
                </Box>
                <Box pos="relative" display={enableVonage ? "block" : "none"}>
                    <VideoChatVonageRoom
                        room={roomDetails}
                        enable={enableVonage}
                        eventId={eventId}
                        eventIsFuture={eventIsFuture}
                        isPresenterOrChairOrOrganizer={isPresenterOrChairOrOrganizer}
                    />
                    {enableVonage ? <EmojiFloatContainer chatId={roomDetails.chatId ?? ""} /> : undefined}
                </Box>
                {!backend && enable ? (
                    <CenteredSpinner spinnerProps={{ mt: 2, mx: "auto" }} caller="VideoChatRoom:63" />
                ) : undefined}
            </>
        );
    }, [
        enableChime,
        roomDetails,
        enableVonage,
        eventId,
        eventIsFuture,
        isPresenterOrChairOrOrganizer,
        backend,
        enable,
    ]);

    return breakoutRoomEl;
}
