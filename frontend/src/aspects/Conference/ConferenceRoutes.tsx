import React from "react";
import { Route, Switch } from "react-router-dom";
import PageNotFound from "../Errors/PageNotFound";
import AttendeeLandingPage from "./Attend/AttendeeLandingPage";
import ConferenceProvider from "./ConferenceProvider";
import ManageConferenceGroupsPage from "./Manage/ManageConferenceGroupsPage";
import ManageConferenceNamePage from "./Manage/ManageConferenceNamePage";
import ManageConferencePeoplePage from "./Manage/ManageConferencePeoplePage";
import ManageConferenceRolesPage from "./Manage/ManageConferenceRolesPage";
import ManagerLandingPage from "./Manage/ManagerLandingPage";

export default function ConferenceRoutes({
    confSlug,
    rootUrl,
}: {
    confSlug: string;
    rootUrl: string;
}): JSX.Element {
    return (
        <ConferenceProvider confSlug={confSlug}>
            <Switch>
                <Route exact path={`${rootUrl}/`}>
                    <AttendeeLandingPage />
                </Route>
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

                <Route path={`${rootUrl}/`}>
                    <PageNotFound />
                </Route>
            </Switch>
        </ConferenceProvider>
    );
}
