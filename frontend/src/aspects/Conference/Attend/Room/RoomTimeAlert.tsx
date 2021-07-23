import { Alert, AlertDescription, AlertIcon, chakra, Text, VStack } from "@chakra-ui/react";
import React from "react";
import { useRealTime } from "../../../Generic/useRealTime";
import { formatRemainingTime } from "./formatTimeRemaining";

export default function RoomTimeAlert({
    shuffleEndsAt,
    showDefaultBreakoutRoom,
    breakoutRoomClosesAt,
    zoomStartsAt,
    eventIsOngoing,
    broadcastStartsAt,
}: {
    shuffleEndsAt: number;
    showDefaultBreakoutRoom: boolean;
    breakoutRoomClosesAt: number;
    zoomStartsAt: number;
    broadcastStartsAt: number;
    eventIsOngoing: boolean;
}): JSX.Element {
    const now = useRealTime(1000);
    const secondsUntilShuffleEnds = Math.round(shuffleEndsAt - now) / 1000;
    const secondsUntilBreakoutRoomCloses = Math.round((breakoutRoomClosesAt - now) / 1000);
    const secondsUntilZoomEvent = Math.round((zoomStartsAt - now) / 1000);
    const secondsUntilBroadcastEvent = Math.round((broadcastStartsAt - now) / 1000);

    return (
        <>
            {secondsUntilShuffleEnds <= 30 ? (
                <Alert status="warning" pos="sticky" top={0} zIndex={1000}>
                    <AlertIcon />
                    <AlertDescription>
                        Shuffle room ends in{" "}
                        <chakra.span fontWeight="bold">
                            {formatRemainingTime(secondsUntilShuffleEnds, false)}
                        </chakra.span>
                    </AlertDescription>
                </Alert>
            ) : undefined}
            {showDefaultBreakoutRoom && secondsUntilBreakoutRoomCloses <= 180 ? (
                <Alert status="warning" pos="sticky" top={0} zIndex={1000} alignItems="flex-start">
                    <AlertIcon />
                    <AlertDescription as={VStack} w="100%">
                        <Text>
                            Video-chat closes in{" "}
                            <chakra.span fontWeight="bold">
                                {formatRemainingTime(secondsUntilBreakoutRoomCloses, false)}
                            </chakra.span>
                        </Text>
                    </AlertDescription>
                </Alert>
            ) : undefined}
            {secondsUntilZoomEvent > 0 && secondsUntilZoomEvent < 180 && !eventIsOngoing ? (
                <Alert status="info" pos="sticky" top={0} zIndex={1000}>
                    <AlertIcon />
                    <AlertDescription>
                        Zoom event starting in{" "}
                        <chakra.span fontWeight="bold">{formatRemainingTime(secondsUntilZoomEvent, false)}</chakra.span>
                    </AlertDescription>
                </Alert>
            ) : undefined}
            {secondsUntilBroadcastEvent > 0 && secondsUntilBroadcastEvent < 180 ? (
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
