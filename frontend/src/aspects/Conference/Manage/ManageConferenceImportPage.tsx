import { Flex, Heading } from "@chakra-ui/react";
import React from "react";
import { Route, Switch } from "react-router-dom";
import { Permission_Enum } from "../../../generated/graphql";
import PageNotFound from "../../Errors/PageNotFound";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import ImportContentPage from "./Import/Content/ImportContentPage";
import ImportSchedulePage from "./Import/Schedule/ImportSchedulePage";
import RestrictedDashboardButton from "./RestrictedDashboardButton";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

export default function ManageConferenceImportPage({ rootUrl }: { rootUrl: string }): JSX.Element {
    return (
        <Switch>
            <Route path={`${rootUrl}/content`}>
                <ImportContentPage />
            </Route>
            <Route path={`${rootUrl}/schedule`}>
                <ImportSchedulePage />
            </Route>
            <Route path={`${rootUrl}/`}>
                <InnerManageConferenceImportPage />
            </Route>
        </Switch>
    );
}

function InnerManageConferenceImportPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Import to ${conference.shortName}`);
    useDashboardPrimaryMenuButtons();

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageContent, Permission_Enum.ConferenceManageSchedule]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
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
                    permissions={[Permission_Enum.ConferenceManageContent]}
                    colorScheme="green"
                />
                <RestrictedDashboardButton
                    to="import/schedule"
                    name="Schedule"
                    icon="calendar"
                    description="Import your schedule including rooms and events."
                    permissions={[Permission_Enum.ConferenceManageSchedule]}
                    colorScheme="green"
                />
            </Flex>
        </RequireAtLeastOnePermissionWrapper>
    );
}
