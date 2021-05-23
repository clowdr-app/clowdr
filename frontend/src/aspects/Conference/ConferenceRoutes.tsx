import React from "react";
import { Redirect, Route, RouteComponentProps, Switch, useRouteMatch } from "react-router-dom";
import { Permissions_Permission_Enum } from "../../generated/graphql";
import ChatRedirectPage from "../Chat/ChatRedirectPage";
import ConferencePageNotFound from "../Errors/ConferencePageNotFound";
import PageNotFound from "../Errors/PageNotFound";
import PageNotImplemented from "../Errors/PageNotImplemented";
import WaitingPage from "../ShuffleRooms/WaitingPage";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import ConferenceLandingPage from "./Attend/ConferenceLandingPage";
import ItemPage from "./Attend/Content/ItemPage";
import ExhibitionPage from "./Attend/Exhibition/ExhibitionPage";
import ExhibitionsPage from "./Attend/Exhibition/ExhibitionsPage";
import EditProfilePage from "./Attend/Profile/EditProfilePage";
import MyBackstages from "./Attend/Profile/MyBackstages";
import ViewProfilePage from "./Attend/Profile/ViewProfilePage";
import RegistrantListPage from "./Attend/Registrant/RegistrantListPage";
import RoomPage from "./Attend/Room/RoomPage";
import RoomListPageV1 from "./Attend/Rooms/V1/RoomListPage";
import Schedule from "./Attend/Schedule/Schedule";
import AnalyticsDashboard from "./Manage/Analytics/AnalyticsDashboard";
import ChecklistPage from "./Manage/Checklist/ChecklistPage";
import ManageConferenceBroadcastPage from "./Manage/ManageConferenceBroadcastPage";
import ManageConferenceContentPage from "./Manage/ManageConferenceContentPage";
import ManageConferenceContentPageV2 from "./Manage/ManageConferenceContentPageV2";
import { ManageConferenceEmailPage } from "./Manage/ManageConferenceEmailPage";
import ManageConferenceExportPage from "./Manage/ManageConferenceExportPage";
import ManageConferenceGroupsPage from "./Manage/ManageConferenceGroupsPage";
import ManageConferenceImportPage from "./Manage/ManageConferenceImportPage";
import ManageConferenceNamePage from "./Manage/ManageConferenceNamePage";
import ManageConferenceProgramPeoplePage from "./Manage/ManageConferenceProgramPeoplePage";
import ManageConferenceRegistrantsPage from "./Manage/ManageConferenceRegistrantsPage";
import ManageConferenceRolesPage from "./Manage/ManageConferenceRolesPage";
import ManageConferenceRoomsPage from "./Manage/ManageConferenceRoomsPage";
import ManageConferenceSchedulePage from "./Manage/ManageConferenceSchedulePage";
import ManageConferenceShufflePage from "./Manage/ManageConferenceShufflePage";
import { ManageConferenceSponsorsPage } from "./Manage/ManageConferenceSponsorsPage";
import ManagerLandingPage from "./Manage/ManagerLandingPage";
import RequireAtLeastOnePermissionWrapper from "./RequireAtLeastOnePermissionWrapper";
import { useConference } from "./useConference";
import { useMaybeCurrentRegistrant } from "./useCurrentRegistrant";

export default function ConferenceRoutes(): JSX.Element {
    const conference = useConference();
    const mUser = useMaybeCurrentUser();
    const mRegistrant = useMaybeCurrentRegistrant();

    const { path } = useRouteMatch();

    return (
        <Switch>
            <Route exact path={`${path}/profile/edit`} component={EditProfilePage} />

            <Route exact path={`${path}/profile/view`} component={ViewProfilePage} />

            {mUser.user ? (
                <Route exact path={`${path}/profile`}>
                    <Redirect to={`/conference/${conference.slug}/profile/edit`} />
                </Route>
            ) : undefined}

            {mRegistrant && mRegistrant.profile && !mRegistrant.profile.hasBeenEdited ? (
                <Route path={path}>
                    <Redirect to={`/conference/${conference.slug}/profile/edit`} />
                </Route>
            ) : undefined}

            {mRegistrant && <Route exact path={`${path}/profile/backstages`} component={MyBackstages} />}

            <Route exact path={`${path}`}>
                <ConferenceLandingPage />
            </Route>

            <Route exact path={`${path}/manage`}>
                <RequireAtLeastOnePermissionWrapper
                    permissions={[
                        Permissions_Permission_Enum.ConferenceManageAttendees,
                        Permissions_Permission_Enum.ConferenceManageContent,
                        Permissions_Permission_Enum.ConferenceManageGroups,
                        Permissions_Permission_Enum.ConferenceManageName,
                        Permissions_Permission_Enum.ConferenceManageRoles,
                        Permissions_Permission_Enum.ConferenceManageSchedule,
                        Permissions_Permission_Enum.ConferenceManageShuffle,
                        Permissions_Permission_Enum.ConferenceModerateAttendees,
                    ]}
                    componentIfDenied={<PageNotFound />}
                >
                    <ManagerLandingPage />
                </RequireAtLeastOnePermissionWrapper>
            </Route>
            <Route path={`${path}/manage/name`}>
                <ManageConferenceNamePage />
            </Route>
            <Route path={`${path}/manage/roles`}>
                <ManageConferenceRolesPage />
            </Route>
            <Route path={`${path}/manage/groups`}>
                <ManageConferenceGroupsPage />
            </Route>
            <Route path={`${path}/manage/registrants`}>
                <ManageConferenceRegistrantsPage />
            </Route>
            <Route path={`${path}/manage/people`}>
                <ManageConferenceProgramPeoplePage />
            </Route>
            <Route path={`${path}/manage/content/v2`}>
                <ManageConferenceContentPageV2 />
            </Route>
            <Route path={`${path}/manage/content`}>
                <ManageConferenceContentPage />
            </Route>
            <Route path={`${path}/manage/import`}>
                <ManageConferenceImportPage />
            </Route>
            <Route path={`${path}/manage/rooms`}>
                <ManageConferenceRoomsPage />
            </Route>
            <Route path={`${path}/manage/shuffle`}>
                <ManageConferenceShufflePage />
            </Route>
            <Route path={`${path}/manage/broadcasts`}>
                <ManageConferenceBroadcastPage />
            </Route>

            <Route path={`${path}/manage/export`}>
                <ManageConferenceExportPage />
            </Route>
            <Route path={`${path}/manage/schedule`}>
                <ManageConferenceSchedulePage />
            </Route>
            <Route path={`${path}/manage/chats`}>
                <PageNotImplemented />
            </Route>
            <Route path={`${path}/manage/email`}>
                <ManageConferenceEmailPage />
            </Route>
            <Route path={`${path}/manage/sponsors`}>
                <ManageConferenceSponsorsPage />
            </Route>
            <Route path={`${path}/manage/checklist`}>
                <ChecklistPage />
            </Route>
            <Route path={`${path}/manage/analytics`}>
                <AnalyticsDashboard />
            </Route>
            <Route path={`${path}/manage/support`}>
                <PageNotImplemented />
            </Route>

            <Route
                path={`${path}/item/:itemId`}
                component={(props: RouteComponentProps<{ itemId: string }>) => (
                    <ItemPage itemId={props.match.params.itemId} />
                )}
            />
            <Route path={`${path}/exhibitions`}>
                <ExhibitionsPage />
            </Route>
            <Route
                path={`${path}/exhibition/:exhibitionId`}
                component={(props: RouteComponentProps<{ exhibitionId: string }>) => (
                    <ExhibitionPage exhibitionId={props.match.params.exhibitionId} />
                )}
            />

            <Route path={`${path}/rooms`}>
                <RoomListPageV1 />
            </Route>

            <Route path={`${path}/registrants`}>
                <RequireAtLeastOnePermissionWrapper
                    componentIfDenied={<Redirect to={`/conference/${conference.slug}`} />}
                    permissions={[
                        Permissions_Permission_Enum.ConferenceViewAttendees,
                        Permissions_Permission_Enum.ConferenceManageAttendees,
                        Permissions_Permission_Enum.ConferenceManageGroups,
                        Permissions_Permission_Enum.ConferenceManageRoles,
                    ]}
                >
                    <RegistrantListPage />
                </RequireAtLeastOnePermissionWrapper>
            </Route>

            <Route
                path={`${path}/room/:roomId`}
                component={(
                    props: RouteComponentProps<{
                        roomId: string;
                        eventId?: string;
                    }>
                ) => <RoomPage roomId={props.match.params.roomId} />}
            />

            <Route path={`${path}/schedule`}>
                <RequireAtLeastOnePermissionWrapper
                    componentIfDenied={<Redirect to={`/conference/${conference.slug}`} />}
                    permissions={[
                        Permissions_Permission_Enum.ConferenceView,
                        Permissions_Permission_Enum.ConferenceManageSchedule,
                    ]}
                >
                    <Schedule />
                </RequireAtLeastOnePermissionWrapper>
            </Route>

            <Route exact path={`${path}/profile/edit/:registrantId`}>
                {(props) =>
                    props.match?.params.registrantId ? (
                        <EditProfilePage
                            registrantId={
                                props.match?.params.registrantId && props.match?.params.registrantId.length > 0
                                    ? props.match?.params.registrantId
                                    : undefined
                            }
                        />
                    ) : (
                        <Redirect to={`/conference/${conference.slug}`} />
                    )
                }
            </Route>

            <Route exact path={`${path}/profile/view/:registrantId`}>
                {(props) =>
                    props.match?.params.registrantId ? (
                        <ViewProfilePage
                            registrantId={
                                props.match?.params.registrantId && props.match?.params.registrantId.length > 0
                                    ? props.match?.params.registrantId
                                    : undefined
                            }
                        />
                    ) : (
                        <Redirect to={`/conference/${conference.slug}`} />
                    )
                }
            </Route>

            <Route path={`${path}/chat/:chatId`}>
                {(props) =>
                    props.match?.params.chatId ? (
                        <ChatRedirectPage chatId={props.match.params.chatId} />
                    ) : (
                        <Redirect to={`/conference/${conference.slug}`} />
                    )
                }
            </Route>
            <Route path={`${path}/shuffle`}>
                <RequireAtLeastOnePermissionWrapper
                    componentIfDenied={<Redirect to={`/conference/${conference.slug}`} />}
                    permissions={[
                        Permissions_Permission_Enum.ConferenceViewAttendees,
                        Permissions_Permission_Enum.ConferenceManageAttendees,
                        Permissions_Permission_Enum.ConferenceModerateAttendees,
                        Permissions_Permission_Enum.ConferenceManageSchedule,
                    ]}
                >
                    <WaitingPage />
                </RequireAtLeastOnePermissionWrapper>
            </Route>

            <Route path={path}>
                <ConferencePageNotFound />
            </Route>
        </Switch>
    );
}
