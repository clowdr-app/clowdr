import { Box, Heading } from "@chakra-ui/react";
import React from "react";
import { Permissions_Permission_Enum } from "../../../generated/graphql";
import PageNotFound from "../../Errors/PageNotFound";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import { ConfigureEmailTemplates } from "./Email/ConfigureEmailTemplates";

export function ManageConferenceEmailPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage email settings for ${conference.shortName}`);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permissions_Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            <Box w="100%">
                {title}
                <Heading as="h1" size="xl">
                    Manage {conference.shortName}
                </Heading>
                <Heading as="h2" size="lg" fontStyle="italic">
                    Email
                </Heading>
                <ConfigureEmailTemplates />
            </Box>
        </RequireAtLeastOnePermissionWrapper>
    );
}
