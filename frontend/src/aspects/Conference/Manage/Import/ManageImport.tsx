import { Flex, Heading } from "@chakra-ui/react";
import React from "react";
import { Route, Switch, useRouteMatch } from "react-router-dom";
import { Permissions_Permission_Enum } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import RestrictedDashboardButton from "../RestrictedDashboardButton";
import ImportContentPage from "./Content/ImportContentPage";
import ImportRegistrantsPage from "./Registrants/ImportRegistrantsPage";
import ImportSchedulePage from "./Schedule/ImportSchedulePage";

export default function ManageImport(): JSX.Element {
    const { path } = useRouteMatch();
    return (
        <Switch>
            <Route path={`${path}/content`}>
                <ImportContentPage />
            </Route>
            <Route path={`${path}/schedule`}>
                <ImportSchedulePage />
            </Route>
            <Route path={`${path}/registrants`}>
                <ImportRegistrantsPage />
            </Route>
            <Route path={`${path}/`}>
                <InnerManageImport />
            </Route>
        </Switch>
    );
}

function InnerManageImport(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Import to ${conference.shortName}`);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[
                Permissions_Permission_Enum.ConferenceManageContent,
                Permissions_Permission_Enum.ConferenceManageSchedule,
            ]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading id="page-heading" as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Import
            </Heading>
            <Flex
                flexDirection="row"
                flexWrap="wrap"
                gridGap={["0.3rem", "0.3rem", "1rem"]}
                alignItems="stretch"
                justifyContent="center"
            >
                <RestrictedDashboardButton
                    to="import/content"
                    name="Content"
                    icon="align-left"
                    description="Import content such as papers, posters and authors."
                    permissions={[Permissions_Permission_Enum.ConferenceManageContent]}
                    colorScheme="purple"
                />
                <RestrictedDashboardButton
                    to="import/schedule"
                    name="Schedule"
                    icon="calendar"
                    description="Import your schedule including rooms and events."
                    permissions={[Permissions_Permission_Enum.ConferenceManageSchedule]}
                    colorScheme="purple"
                />
                <RestrictedDashboardButton
                    to="import/registrants"
                    name="Registrants"
                    icon="users"
                    description="Import your registrants, organisers and other users."
                    permissions={[Permissions_Permission_Enum.ConferenceManageAttendees]}
                    colorScheme="red"
                />
            </Flex>
        </RequireAtLeastOnePermissionWrapper>
    );
}
