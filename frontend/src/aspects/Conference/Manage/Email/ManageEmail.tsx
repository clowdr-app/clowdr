import { Container, VStack } from "@chakra-ui/react";
import React from "react";
import { DashboardPage } from "../DashboardPage";
import { ConfigureEmailTemplates } from "./ConfigureEmailTemplates";

export default function ManageEmail(): JSX.Element {
    return (
        <DashboardPage title="Email">
            <Container maxW="container.lg">
                <VStack spacing={4} alignItems="flex-start" mt={6}>
                    <ConfigureEmailTemplates />
                </VStack>
            </Container>
        </DashboardPage>
    );
}
