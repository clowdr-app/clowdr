import React from "react";
import { Route, RouteComponentProps, Switch } from "react-router-dom";
import PageNotFound from "../Errors/PageNotFound";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import AttendeeLandingPage from "./Attend/AttendeeLandingPage";
import ManageConferenceBroadcastPage from "./Manage/ManageConferenceBroadcastPage";
import ManageConferenceContentPage from "./Manage/ManageConferenceContentPage";
import ManageConferenceGroupsPage from "./Manage/ManageConferenceGroupsPage";
import ManageConferenceImportPage from "./Manage/ManageConferenceImportPage";
import ManageConferenceNamePage from "./Manage/ManageConferenceNamePage";
import ManageConferencePeoplePage from "./Manage/ManageConferencePeoplePage";
import ManageConferenceRolesPage from "./Manage/ManageConferenceRolesPage";
import ManagerLandingPage from "./Manage/ManagerLandingPage";
import ConferenceProvider from "./useConference";
import ConferenceCurrentUserActivePermissionsProvider from "./useConferenceCurrentUserActivePermissions";
import CurrentUserGroupsRolesPermissionsProvider from "./useConferenceCurrentUserGroups";

function AuthenticatedConferenceRoutes(rootUrl: string): JSX.Element {
    const { user } = useMaybeCurrentUser();

    if (!user) {
        return <></>;
    }

    return (
        <CurrentUserGroupsRolesPermissionsProvider>
            <ConferenceCurrentUserActivePermissionsProvider>
                <Switch>
                    <Route exact path={`${rootUrl}/manage`}>
                        <ManagerLandingPage />
                    </Route>
                    <Route path={`${rootUrl}/manage/name`}>
                        <ManageConferenceNamePage />
                    </Route>
                    <Route path={`${rootUrl}/manage/roles`}>
                        <ManageConferenceRolesPage />
                    </Route>
                    <Route path={`${rootUrl}/manage/groups`}>
                        <ManageConferenceGroupsPage />
                    </Route>
                    <Route path={`${rootUrl}/manage/people`}>
                        <ManageConferencePeoplePage />
                    </Route>
                    <Route path={`${rootUrl}/manage/content`}>
                        <ManageConferenceContentPage />
                    </Route>
                    <Route
                        path={`${rootUrl}/manage/import`}
                        component={(props: RouteComponentProps<any>) => (
                            <ManageConferenceImportPage rootUrl={props.match.url} />
                        )}
                    />
                    <Route path={`${rootUrl}/manage/broadcasts`}>
                        <ManageConferenceBroadcastPage />
                    </Route>

                    <Route path={`${rootUrl}/`}>
                        <PageNotFound />
                    </Route>
                </Switch>
            </ConferenceCurrentUserActivePermissionsProvider>
        </CurrentUserGroupsRolesPermissionsProvider>
    );
}

export default function ConferenceRoutes({ confSlug, rootUrl }: { confSlug: string; rootUrl: string }): JSX.Element {
    return (
        <ConferenceProvider confSlug={confSlug}>
            <Switch>
                <Route exact path={`${rootUrl}/`}>
                    <AttendeeLandingPage />
                </Route>

                {AuthenticatedConferenceRoutes(rootUrl)}

                <Route path={`${rootUrl}/`}>
                    <PageNotFound />
                </Route>
            </Switch>
        </ConferenceProvider>
    );
}
