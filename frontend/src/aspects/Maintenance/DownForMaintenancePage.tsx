import { Center, Text, VStack } from "@chakra-ui/react";
import React from "react";
import { ExternalLinkButton } from "../Chakra/LinkButton";
import GenericErrorPage from "../Errors/GenericErrorPage";

export default function DownForMaintenancePage(): JSX.Element {
    return (
        <Center flexDir="column">
            <GenericErrorPage heading="Offline for maintenance">
                <VStack alignItems="flex-start" maxW={625}>
                    <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                        Midspace is offline for maintenance.
                    </Text>
                    <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                        Please check our status page for further information.
                    </Text>
                    <ExternalLinkButton to="https://midspace.freshstatus.io/">View Service Status</ExternalLinkButton>
                </VStack>
            </GenericErrorPage>
        </Center>
    );
}
