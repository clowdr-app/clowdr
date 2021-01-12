import { Badge, Box, HStack, Stat, StatLabel, StatNumber, Text } from "@chakra-ui/react";
import React from "react";
import type { RoomEventDetailsFragment } from "../../../../../generated/graphql";
import { FAIcon } from "../../../../Icons/FAIcon";
import { useEventLiveStatus } from "./useEventLiveStatus";

export function LiveIndicator({ event }: { event: RoomEventDetailsFragment }): JSX.Element {
    const { live, secondsUntilLive, secondsUntilOffAir } = useEventLiveStatus(event);

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
                    {secondsUntilLive < 1000 ? (
                        <Stat fontSize="md" ml="auto" flexGrow={1} textAlign="right">
                            <StatLabel>Seconds remaining</StatLabel>
                            <StatNumber>{Math.round(secondsUntilLive)}</StatNumber>
                        </Stat>
                    ) : (
                        <></>
                    )}
                </HStack>
            ) : (
                <Badge fontSize="lg" colorScheme="blue" fontWeight="bold">
                    <Text m={2}>Off air</Text>
                </Badge>
            )}
        </Box>
    );
}
