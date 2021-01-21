import { Badge, Box, HStack, Stat, StatLabel, StatNumber, Text, VStack } from "@chakra-ui/react";
import React from "react";
import type { RoomEventDetailsFragment } from "../../../../../generated/graphql";
import { FAIcon } from "../../../../Icons/FAIcon";
import { useEventLiveStatus } from "./useEventLiveStatus";

export function LiveIndicator({ event }: { event: RoomEventDetailsFragment }): JSX.Element {
    const { live, secondsUntilLive, secondsUntilOffAir } = useEventLiveStatus(event);

    return (
        <Box my={2}>
            {live ? (
                <VStack>
                    <Badge fontSize="lg" colorScheme="red" fontWeight="bold" mb={4}>
                        <HStack>
                            <FAIcon icon="broadcast-tower" iconStyle="s" fontSize="lg" m={2} />
                            <Text mx={2}>Live</Text>
                        </HStack>
                    </Badge>
                    <Stat fontSize="md" ml="auto" flexGrow={1} textAlign="center">
                        <StatLabel>Seconds remaining</StatLabel>
                        <StatNumber>{Math.round(secondsUntilOffAir)}</StatNumber>
                    </Stat>
                </VStack>
            ) : secondsUntilLive > 0 ? (
                <VStack>
                    <Badge fontSize="lg" colorScheme="blue" fontWeight="bold" mb={4}>
                        <Text m={2}>Off air</Text>
                    </Badge>
                    {secondsUntilLive < 1000 ? (
                        <Stat fontSize="md" ml="auto" flexGrow={1} textAlign="center">
                            <StatLabel>Seconds remaining</StatLabel>
                            <StatNumber>{Math.round(secondsUntilLive)}</StatNumber>
                        </Stat>
                    ) : (
                        <></>
                    )}
                </VStack>
            ) : (
                <Badge fontSize="lg" colorScheme="blue" fontWeight="bold">
                    <Text m={2}>Off air</Text>
                </Badge>
            )}
        </Box>
    );
}
