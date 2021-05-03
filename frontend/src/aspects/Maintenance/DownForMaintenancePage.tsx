import { Center, Text, VStack } from "@chakra-ui/react";
import React from "react";
import GenericErrorPage from "../Errors/GenericErrorPage";

export default function DownForMaintenancePage(): JSX.Element {
    return (
        <Center flexDir="column">
            <GenericErrorPage heading="Offline for maintenance">
                <VStack alignItems="flex-start" maxW={625}>
                    <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                        Clowdr is offline for maintenance ending 1am UTC on 4th May.
                    </Text>
                    <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                        This is while we make important updates to the platform.
                    </Text>
                </VStack>
            </GenericErrorPage>
        </Center>
    );
}
