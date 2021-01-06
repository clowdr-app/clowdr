import React from "react";
import { Route, RouteComponentProps, Switch } from "react-router-dom";
import PageNotImplemented from "../Errors/PageNotImplemented";
import ConferenceLandingPage from "./Attend/ConferenceLandingPage";
import ContentGroupPage from "./Attend/Content/ContentGroupPage";
import RoomPage from "./Attend/Room/RoomPage";
import ConferenceTimeline from "./Attend/Schedule/ConferenceTimeline";
import ManageConferenceBroadcastPage from "./Manage/ManageConferenceBroadcastPage";
import ManageConferenceContentPage from "./Manage/ManageConferenceContentPage";
import ManageConferenceGroupsPage from "./Manage/ManageConferenceGroupsPage";
import ManageConferenceImportPage from "./Manage/ManageConferenceImportPage";
import ManageConferenceNamePage from "./Manage/ManageConferenceNamePage";
import ManageConferencePeoplePage from "./Manage/ManageConferencePeoplePage";
import ManageConferenceRolesPage from "./Manage/ManageConferenceRolesPage";
import ManageConferenceRoomsPage from "./Manage/ManageConferenceRoomsPage";
import ManageConferenceSchedulePage from "./Manage/ManageConferenceSchedulePage";
import ManagerLandingPage from "./Manage/ManagerLandingPage";
import ConferenceProvider from "./useConference";
import ConferenceCurrentUserActivePermissionsProvider from "./useConferenceCurrentUserActivePermissions";
import CurrentUserGroupsRolesPermissionsProvider from "./useConferenceCurrentUserGroups";

export default function ConferenceRoutes({ confSlug, rootUrl }: { confSlug: string; rootUrl: string }): JSX.Element {
    return (
        <ConferenceProvider confSlug={confSlug}>
            <CurrentUserGroupsRolesPermissionsProvider>
                <ConferenceCurrentUserActivePermissionsProvider>
                    <Switch>
                        <Route exact path={`${rootUrl}`}>
                            <ConferenceLandingPage />
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
                        <Route path={`${rootUrl}/manage/content`}>
                            <ManageConferenceContentPage />
                        </Route>
                        <Route
                            path={`${rootUrl}/manage/import`}
                            component={(props: RouteComponentProps<any>) => (
                                <ManageConferenceImportPage rootUrl={props.match.url} />
                            )}
                        />
                        <Route path={`${rootUrl}/manage/rooms`}>
                            <ManageConferenceRoomsPage />
                        </Route>
                        <Route path={`${rootUrl}/manage/broadcasts`}>
                            <ManageConferenceBroadcastPage />
                        </Route>

                        <Route path={`${rootUrl}/manage/export`}>
                            <PageNotImplemented />
                        </Route>
                        <Route path={`${rootUrl}/manage/schedule`}>
                            <ManageConferenceSchedulePage />
                        </Route>
                        <Route path={`${rootUrl}/manage/chats`}>
                            <PageNotImplemented />
                        </Route>
                        <Route path={`${rootUrl}/manage/sponsors`}>
                            <PageNotImplemented />
                        </Route>
                        <Route path={`${rootUrl}/manage/analytics`}>
                            <PageNotImplemented />
                        </Route>
                        <Route path={`${rootUrl}/manage/support`}>
                            <PageNotImplemented />
                        </Route>

                        <Route
                            path={`${rootUrl}/item/:contentGroupId`}
                            component={(props: RouteComponentProps<{ contentGroupId: string }>) => (
                                <ContentGroupPage contentGroupId={props.match.params.contentGroupId} />
                            )}
                        />

                        <Route
                            path={`${rootUrl}/room/:roomId`}
                            component={(
                                props: RouteComponentProps<{
                                    roomId: string;
                                }>
                            ) => <RoomPage roomId={props.match.params.roomId} />}
                        />

                        <Route path={`${rootUrl}/schedule`}>
                            <ConferenceTimeline />
                        </Route>
                    </Switch>
                </ConferenceCurrentUserActivePermissionsProvider>
            </CurrentUserGroupsRolesPermissionsProvider>
        </ConferenceProvider>
    );
}
