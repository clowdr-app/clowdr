import React from "react";
import { Redirect, Route, RouteComponentProps, Switch } from "react-router-dom";
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
import RoomListPage from "./Attend/Room/RoomListPage";
import RoomPage from "./Attend/Room/RoomPage";
import Schedule from "./Attend/Schedule/Schedule";
import ManageConferenceBroadcastPage from "./Manage/ManageConferenceBroadcastPage";
import ManageConferenceContentPage from "./Manage/ManageConferenceContentPage";
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

export default function ConferenceRoutes({ rootUrl }: { rootUrl: string }): JSX.Element {
    const conference = useConference();
    const mUser = useMaybeCurrentUser();
    const mRegistrant = useMaybeCurrentRegistrant();

    return (
        <Switch>
            <Route exact path={`${rootUrl}/profile/edit`} component={EditProfilePage} />

            <Route exact path={`${rootUrl}/profile/view`} component={ViewProfilePage} />

            {mUser.user ? (
                <Route exact path={`${rootUrl}/profile`}>
                    <Redirect to={`${rootUrl}/profile/edit`} />
                </Route>
            ) : undefined}

            {mRegistrant && mRegistrant.profile && !mRegistrant.profile.hasBeenEdited ? (
                <Route path={rootUrl}>
                    <Redirect to={`/conference/${conference.slug}/profile/edit`} />
                </Route>
            ) : undefined}

            {mRegistrant && <Route exact path={`${rootUrl}/profile/backstages`} component={MyBackstages} />}

            <Route exact path={`${rootUrl}`}>
                <ConferenceLandingPage />
            </Route>

            <Route exact path={`${rootUrl}/manage`}>
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
            <Route path={`${rootUrl}/manage/name`}>
                <ManageConferenceNamePage />
            </Route>
            <Route path={`${rootUrl}/manage/roles`}>
                <ManageConferenceRolesPage />
            </Route>
            <Route path={`${rootUrl}/manage/groups`}>
                <ManageConferenceGroupsPage />
            </Route>
            <Route path={`${rootUrl}/manage/registrants`}>
                <ManageConferenceRegistrantsPage />
            </Route>
            <Route path={`${rootUrl}/manage/people`}>
                <ManageConferenceProgramPeoplePage />
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
            <Route path={`${rootUrl}/manage/shuffle`}>
                <ManageConferenceShufflePage />
            </Route>
            <Route path={`${rootUrl}/manage/broadcasts`}>
                <ManageConferenceBroadcastPage />
            </Route>

            <Route path={`${rootUrl}/manage/export`}>
                <ManageConferenceExportPage />
            </Route>
            <Route path={`${rootUrl}/manage/schedule`}>
                <ManageConferenceSchedulePage />
            </Route>
            <Route path={`${rootUrl}/manage/chats`}>
                <PageNotImplemented />
            </Route>
            <Route path={`${rootUrl}/manage/email`}>
                <ManageConferenceEmailPage />
            </Route>
            <Route path={`${rootUrl}/manage/sponsors`}>
                <ManageConferenceSponsorsPage />
            </Route>
            <Route path={`${rootUrl}/manage/analytics`}>
                <PageNotImplemented />
            </Route>
            <Route path={`${rootUrl}/manage/support`}>
                <PageNotImplemented />
            </Route>

            <Route
                path={`${rootUrl}/item/:itemId`}
                component={(props: RouteComponentProps<{ itemId: string }>) => (
                    <ItemPage itemId={props.match.params.itemId} />
                )}
            />
            <Route path={`${rootUrl}/exhibitions`}>
                <ExhibitionsPage />
            </Route>
            <Route
                path={`${rootUrl}/exhibition/:exhibitionId`}
                component={(props: RouteComponentProps<{ exhibitionId: string }>) => (
                    <ExhibitionPage exhibitionId={props.match.params.exhibitionId} />
                )}
            />

            <Route path={`${rootUrl}/rooms`}>
                <RoomListPage />
            </Route>

            <Route path={`${rootUrl}/registrants`}>
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
                path={`${rootUrl}/room/:roomId`}
                component={(
                    props: RouteComponentProps<{
                        roomId: string;
                        eventId?: string;
                    }>
                ) => <RoomPage roomId={props.match.params.roomId} />}
            />

            <Route path={`${rootUrl}/schedule`}>
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

            <Route exact path={`${rootUrl}/profile/edit/:registrantId`}>
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

            <Route exact path={`${rootUrl}/profile/view/:registrantId`}>
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

            <Route path={`${rootUrl}/chat/:chatId`}>
                {(props) =>
                    props.match?.params.chatId ? (
                        <ChatRedirectPage chatId={props.match.params.chatId} />
                    ) : (
                        <Redirect to={`/conference/${conference.slug}`} />
                    )
                }
            </Route>
            <Route path={`${rootUrl}/shuffle`}>
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

            <Route path={rootUrl}>
                <ConferencePageNotFound />
            </Route>
        </Switch>
    );
}
