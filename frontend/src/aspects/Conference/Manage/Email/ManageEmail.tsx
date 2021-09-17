import { Container, Heading, VStack } from "@chakra-ui/react";
import React from "react";
import { Permissions_Permission_Enum } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import { ConfigureEmailTemplates } from "./ConfigureEmailTemplates";

export default function ManageEmail(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage email templates for ${conference.shortName}`);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permissions_Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
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
        </RequireAtLeastOnePermissionWrapper>
    );
}
