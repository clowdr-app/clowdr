import { Text, VStack } from "@chakra-ui/react";
import React from "react";
import GenericErrorPage from "../Errors/GenericErrorPage";

export default function DownForMaintenancePage(): JSX.Element {
    return (
        <GenericErrorPage heading="Offline for maintenance">
            <VStack alignItems="flex-start" maxW={625}>
                <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                    Clowdr is currently offline for maintenance until 8pm UTC on 25th January.
                </Text>
                <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                    This is while we make important updates to the platform and wait for a number of users to refresh to
                    get the latest version of our software.
                </Text>
            </VStack>
        </GenericErrorPage>
    );
}
