import { Center, Text, VStack } from "@chakra-ui/react";
import React from "react";
import GenericErrorPage from "../Errors/GenericErrorPage";

export default function DownForMaintenancePage(): JSX.Element {
    return (
        <Center flexDir="column">
            <GenericErrorPage heading="Offline for maintenance">
                <VStack alignItems="flex-start" maxW={625}>
                    <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                        Clowdr is offline for maintenance starting 5pm UTC on 7th April for approximately 30 minutes.
                    </Text>
                    <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                        This is while we make important updates to the platform to improve the chat and video
                        experiences.
                    </Text>
                </VStack>
            </GenericErrorPage>
        </Center>
    );
}
