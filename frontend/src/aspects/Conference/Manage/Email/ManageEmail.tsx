import { Container, VStack } from "@chakra-ui/react";
import React from "react";
import { useTitle } from "../../../Hooks/useTitle";
import { useConference } from "../../useConference";
import { DashboardPage } from "../DashboardPage";
import { ConfigureEmailTemplates } from "./ConfigureEmailTemplates";

export default function ManageEmail(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage email templates for ${conference.shortName}`);

    return (
        <DashboardPage title="Email">
            {title}
            <Container maxW="container.lg">
                <VStack spacing={4} alignItems="flex-start" mt={6}>
                    <ConfigureEmailTemplates />
                </VStack>
            </Container>
        </DashboardPage>
    );
}
