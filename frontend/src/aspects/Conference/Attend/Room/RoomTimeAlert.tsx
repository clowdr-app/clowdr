import { Alert, AlertDescription, AlertIcon, chakra, Text, VStack } from "@chakra-ui/react";
import React from "react";
import { useRealTime } from "../../../Hooks/useRealTime";
import { formatRemainingTime } from "./formatRemainingTime";

export default function RoomTimeAlert({
    shuffleEndsAt,
    showDefaultVideoChatRoom,
    breakoutRoomClosesAt,
    externalEventStartsAt: externalEventStartsAt,
    eventIsOngoing,
    broadcastStartsAt,
    externalEventName,
}: {
    shuffleEndsAt: number;
    showDefaultVideoChatRoom: boolean;
    breakoutRoomClosesAt: number;
    externalEventStartsAt: number;
    broadcastStartsAt: number;
    eventIsOngoing: boolean;
    externalEventName?: string;
}): JSX.Element {
    const now = useRealTime(1000);
    const secondsUntilShuffleEnds = Math.round(shuffleEndsAt - now) / 1000;
    const secondsUntilVideoChatRoomCloses = Math.round((breakoutRoomClosesAt - now) / 1000);
    const secondsUntilExternalEventEvent = Math.round((externalEventStartsAt - now) / 1000);
    const secondsUntilBroadcastEvent = Math.round((broadcastStartsAt - now) / 1000);

    const isLivestreamStarting = secondsUntilBroadcastEvent > 0 && secondsUntilBroadcastEvent < 180;
    const isExternalEventStarting = secondsUntilExternalEventEvent > 0 && secondsUntilExternalEventEvent < 180;

    const showShuffleRoomEndingAlert = secondsUntilShuffleEnds <= 24 * 60 * 60 * 1000;
    const showVideoChatClosesAlert =
        showDefaultVideoChatRoom && secondsUntilVideoChatRoomCloses > 0 && secondsUntilVideoChatRoomCloses <= 180;
    const showLivestreamStartingAlert = !eventIsOngoing && isLivestreamStarting && !showVideoChatClosesAlert;
    const showExternalEventStartingAlert = !eventIsOngoing && isExternalEventStarting && !showVideoChatClosesAlert;

    return (
        <>
            {showShuffleRoomEndingAlert ? (
                <Alert
                    status={secondsUntilShuffleEnds <= 3 ? "error" : secondsUntilShuffleEnds <= 30 ? "warning" : "info"}
                    pos="sticky"
                    top={0}
                    zIndex={1000}
                >
                    <AlertIcon />
                    <AlertDescription>
                        Shuffle room ends in{" "}
                        <chakra.span fontWeight="bold">
                            {formatRemainingTime(secondsUntilShuffleEnds, false)}
                        </chakra.span>
                    </AlertDescription>
                </Alert>
            ) : undefined}
            {showVideoChatClosesAlert ? (
                <Alert status="warning" pos="sticky" top={0} zIndex={1000} alignItems="flex-start">
                    <AlertIcon />
                    <AlertDescription as={VStack} w="100%">
                        <Text>
                            {isLivestreamStarting
                                ? "A livestream will soon be starting in this room. "
                                : isExternalEventStarting
                                ? "An external event will soon be starting. "
                                : ""}
                            Video-chat closes in{" "}
                            <chakra.span fontWeight="bold">
                                {formatRemainingTime(secondsUntilVideoChatRoomCloses, false)}
                            </chakra.span>
                        </Text>
                    </AlertDescription>
                </Alert>
            ) : undefined}
            {showExternalEventStartingAlert ? (
                <Alert status="info" pos="sticky" top={0} zIndex={1000}>
                    <AlertIcon />
                    <AlertDescription>
                        {externalEventName ?? "Zoom"} event starting in{" "}
                        <chakra.span fontWeight="bold">
                            {formatRemainingTime(secondsUntilExternalEventEvent, false)}
                        </chakra.span>
                    </AlertDescription>
                </Alert>
            ) : undefined}
            {showLivestreamStartingAlert ? (
                <Alert status="info" pos="sticky" top={0} zIndex={1000}>
                    <AlertIcon />
                    <AlertDescription>
                        Livestream event starting in{" "}
                        <chakra.span fontWeight="bold">
                            {formatRemainingTime(secondsUntilBroadcastEvent, false)}
                        </chakra.span>
                    </AlertDescription>
                </Alert>
            ) : undefined}
        </>
    );
}
