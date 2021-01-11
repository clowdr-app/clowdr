import { Badge, Box, HStack, Stat, StatLabel, StatNumber, Text } from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import type { RoomEventDetailsFragment } from "../../../../../generated/graphql";
import usePolling from "../../../../Generic/usePolling";
import { FAIcon } from "../../../../Icons/FAIcon";

export function LiveIndicator({ event }: { event: RoomEventDetailsFragment }): JSX.Element {
    const [live, setLive] = useState<boolean>();
    const [secondsUntilLive, setSecondsUntilLive] = useState<number>(0);
    const [secondsUntilOffAir, setSecondsUntilOffAir] = useState<number>(0);

    const update = useCallback(() => {
        const startTime = Date.parse(event.startTime);
        const now = new Date().getTime();
        const endTime = Date.parse(event.endTime);

        setLive(now >= startTime && now <= endTime);
        setSecondsUntilLive((startTime - now) / 1000);
        setSecondsUntilOffAir((endTime - now) / 1000);
    }, [event.endTime, event.startTime]);

    useEffect(() => {
        update();
    }, [update]);

    usePolling(update, 500, true);

    return (
        <Box my={2}>
            {live ? (
                <HStack>
                    <Badge fontSize="lg" colorScheme="red" fontWeight="bold">
                        <HStack>
                            <FAIcon icon="broadcast-tower" iconStyle="s" fontSize="lg" m={2} />
                            <Text mx={2}>Live</Text>
                        </HStack>
                    </Badge>
                    <Stat fontSize="md" ml="auto" flexGrow={1} textAlign="right">
                        <StatLabel>Seconds remaining</StatLabel>
                        <StatNumber>{Math.round(secondsUntilOffAir)}</StatNumber>
                    </Stat>
                </HStack>
            ) : secondsUntilLive > 0 ? (
                <HStack>
                    <Badge fontSize="lg" colorScheme="blue" fontWeight="bold">
                        <Text m={2}>Off air</Text>
                    </Badge>
                    <Stat fontSize="md" ml="auto" flexGrow={1} textAlign="right">
                        <StatLabel>Seconds remaining</StatLabel>
                        <StatNumber>{Math.round(secondsUntilLive)}</StatNumber>
                    </Stat>
                </HStack>
            ) : (
                <Badge fontSize="lg" colorScheme="blue" fontWeight="bold">
                    <Text m={2}>Off air</Text>
                </Badge>
            )}
        </Box>
    );
}
