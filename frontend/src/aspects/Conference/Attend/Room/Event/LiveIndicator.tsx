import { Badge, HStack, Stat, StatLabel, StatNumber, Text } from "@chakra-ui/react";
import React from "react";
import type { RoomEventDetailsFragment } from "../../../../../generated/graphql";
import { roundDownToNearest } from "../../../../Generic/MathUtils";
import { FAIcon } from "../../../../Icons/FAIcon";
import { useEventLiveStatus } from "./useEventLiveStatus";

function formatRemainingTime(seconds: number): string {
    const NearestHoursInS = roundDownToNearest(seconds, 60 * 60);
    const IntermediateSeconds = seconds - NearestHoursInS;
    const NearestMinutesInS = roundDownToNearest(IntermediateSeconds, 60);
    const NearestSeconds = IntermediateSeconds - NearestMinutesInS;
    const Hours = (NearestHoursInS / (60 * 60)).toFixed(0).padStart(2, "0");
    const Minutes = (NearestMinutesInS / 60).toFixed(0).padStart(2, "0");
    const Seconds = NearestSeconds.toFixed(0).padStart(2, "0");
    return `${Hours}:${Minutes}:${Seconds}`;
}

export function LiveIndicator({ event }: { event: RoomEventDetailsFragment }): JSX.Element {
    const { live, secondsUntilLive, secondsUntilOffAir } = useEventLiveStatus(event);

    return live ? (
        <HStack alignItems="flex-start" justifyContent="flex-start" mx="auto">
            <Badge fontSize="lg" colorScheme="red" fontWeight="bold" p={4}>
                <HStack>
                    <FAIcon icon="broadcast-tower" iconStyle="s" fontSize="lg" />
                    <Text mx={2}>Live</Text>
                </HStack>
            </Badge>
            <Stat fontSize="md" ml="auto" flexGrow={1} textAlign="center">
                <StatLabel>Time remaining</StatLabel>
                <StatNumber>{formatRemainingTime(secondsUntilOffAir)}</StatNumber>
            </Stat>
        </HStack>
    ) : (
        <HStack alignItems="flex-start" justifyContent="flex-start" mx="auto">
            {secondsUntilLive > 0 ? (
                <>
                    <Badge fontSize="lg" colorScheme="blue" fontWeight="bold" p={4}>
                        <Text>Off air</Text>
                    </Badge>
                    {secondsUntilLive < 1000 ? (
                        <Stat fontSize="md" ml="auto" flexGrow={1} textAlign="center">
                            <StatLabel>Time remaining</StatLabel>
                            <StatNumber>{formatRemainingTime(secondsUntilLive)}</StatNumber>
                        </Stat>
                    ) : (
                        <></>
                    )}
                </>
            ) : (
                <Badge fontSize="lg" colorScheme="blue" fontWeight="bold" p={4}>
                    <Text>Off air</Text>
                </Badge>
            )}
        </HStack>
    );
}
