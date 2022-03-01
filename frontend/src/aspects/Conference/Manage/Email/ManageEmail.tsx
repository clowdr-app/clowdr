import { Container, Heading, VStack } from "@chakra-ui/react";
import React from "react";
import PageNotFound from "../../../Errors/PageNotFound";
import { useTitle } from "../../../Hooks/useTitle";
import RequireRole from "../../RequireRole";
import { useConference } from "../../useConference";
import { ConfigureEmailTemplates } from "./ConfigureEmailTemplates";

export default function ManageEmail(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage email templates for ${conference.shortName}`);

    return (
        <RequireRole organizerRole componentIfDenied={<PageNotFound />}>
            {title}
            <Container maxW="container.lg">
                <VStack spacing={4} alignItems="flex-start" mt={6}>
                    <Heading as="h1" size="xl">
                        Email Templates
                    </Heading>
                    <Heading id="page-heading" as="h2" size="md">
                        Manage {conference.shortName}
                    </Heading>
                    <ConfigureEmailTemplates />
                </VStack>
            </Container>
        </RequireRole>
    );
}
