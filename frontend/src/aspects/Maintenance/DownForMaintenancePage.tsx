import { Center, Text, VStack } from "@chakra-ui/react";
import React from "react";
import { ExternalLinkButton } from "../Chakra/LinkButton";
import GenericErrorPage from "../Errors/GenericErrorPage";
import { FormattedMessage, useIntl } from "react-intl";

export default function DownForMaintenancePage(): JSX.Element {
    const intl = useIntl();
    return (
        <Center flexDir="column">
            <GenericErrorPage heading={intl.formatMessage({ id: 'maintenance.downformaintenancepage.offline', defaultMessage: "Offline for maintenance" })}>
                <VStack alignItems="flex-start" maxW={625}>
                    <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                        <FormattedMessage
                            id="maintenance.downformaintenancepage.offlinedesc"
                            defaultMessage="Midspace is offline for maintenance."
                        />
                    </Text>
                    <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                        <FormattedMessage
                            id="maintenance.downformaintenancepage.checkstatuspage"
                            defaultMessage="Please check our status page for further information."
                        />
                    </Text>
                    <ExternalLinkButton to="https://midspace.freshstatus.io/">
                        <FormattedMessage
                            id="maintenance.downformaintenancepage.viewstatus"
                            defaultMessage="View Service Status"
                        />
                    </ExternalLinkButton>
                </VStack>
            </GenericErrorPage>
        </Center>
    );
}
