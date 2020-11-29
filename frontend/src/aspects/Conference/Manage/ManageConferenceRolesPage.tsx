import { Heading, Text } from "@chakra-ui/react";
import React from "react";
import { Permission_Enum } from "../../../generated/graphql";
import PageNotFound from "../../Errors/PageNotFound";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

export default function ManageConferenceRolesPage(): JSX.Element {
    const conference = useConference();

    useDashboardPrimaryMenuButtons();

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageRoles]}
            componentIfDenied={<PageNotFound />}
        >
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading
                as="h2"
                fontSize="1.7rem"
                lineHeight="2.4rem"
                fontStyle="italic"
            >
                Roles
            </Heading>
            <Text>TODO</Text>
        </RequireAtLeastOnePermissionWrapper>
    );
}
