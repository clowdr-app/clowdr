import { Heading } from "@chakra-ui/react";
import React from "react";
import { Permission_Enum } from "../../../generated/graphql";
import PageNotFound from "../../Errors/PageNotFound";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import { ConfigureEmailTemplates } from "./Email/ConfigureEmailTemplates";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

export function ManageConferenceEmailPage(): JSX.Element {
    const conference = useConference();
    useDashboardPrimaryMenuButtons();
    const title = useTitle(`Manage email settings for ${conference.shortName}`);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" size="xl">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" size="lg" fontStyle="italic">
                Email
            </Heading>
            <ConfigureEmailTemplates />
        </RequireAtLeastOnePermissionWrapper>
    );
}
