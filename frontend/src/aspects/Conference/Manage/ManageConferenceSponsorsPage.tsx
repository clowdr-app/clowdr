import { Heading } from "@chakra-ui/react";
import React from "react";
import { Permission_Enum } from "../../../generated/graphql";
import PageNotFound from "../../Errors/PageNotFound";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import { EditableSponsorsTable } from "./Sponsors/EditableSponsorsTable";

export function ManageConferenceSponsorsPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage sponsors of ${conference.shortName}`);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageSchedule]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" fontSize="4xl">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" fontSize="2xl" fontStyle="italic">
                Sponsors
            </Heading>
            <EditableSponsorsTable />
        </RequireAtLeastOnePermissionWrapper>
    );
}
