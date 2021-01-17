import React from "react";
import { Redirect, Route, RouteComponentProps, Switch } from "react-router-dom";
import { Permission_Enum } from "../../generated/graphql";
import { ChatNotificationsProvider } from "../Chat/ChatNotifications";
import PageNotFound from "../Errors/PageNotFound";
import PageNotImplemented from "../Errors/PageNotImplemented";
import PresenceCountProvider from "../Presence/PresenceCountProvider";
import useTabTracker from "../Presence/useTabTracker";
import RoomParticipantsProvider from "../Room/RoomParticipantsProvider";
import { SharedRoomContextProvider } from "../Room/SharedRoomContextProvider";
import WaitingPage from "../ShuffleRooms/WaitingPage";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import AttendeeListPage from "./Attend/Attendee/AttendeeListPage";
import ConferenceLandingPage from "./Attend/ConferenceLandingPage";
import ContentGroupPage from "./Attend/Content/ContentGroupPage";
import EditProfilePage from "./Attend/Profile/EditProfilePage";
import ViewProfilePage from "./Attend/Profile/ViewProfilePage";
import RoomListPage from "./Attend/Room/RoomListPage";
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
import RequireAtLeastOnePermissionWrapper from "./RequireAtLeastOnePermissionWrapper";
import ConferenceProvider, { useConference } from "./useConference";
import ConferenceCurrentUserActivePermissionsProvider from "./useConferenceCurrentUserActivePermissions";
import CurrentUserGroupsRolesPermissionsProvider from "./useConferenceCurrentUserGroups";
import { CurrentAttendeeProvider, useMaybeCurrentAttendee } from "./useCurrentAttendee";

function ConferenceRoutesInner({ rootUrl }: { rootUrl: string }): JSX.Element {
    const conference = useConference();
    const mUser = useMaybeCurrentUser();
    const mAttendee = useMaybeCurrentAttendee();

    return (
        <Switch>
            <Route exact path={`${rootUrl}/profile/edit`} component={EditProfilePage} />

            <Route exact path={`${rootUrl}/profile/view`} component={ViewProfilePage} />

            {mUser.user ? (
                <Route exact path={`${rootUrl}/profile`}>
                    <Redirect to={`${rootUrl}/profile/edit`} />
                </Route>
            ) : undefined}

            {mAttendee && !mAttendee.profile.hasBeenEdited ? (
                <Route path={rootUrl}>
                    <Redirect to={`/conference/${conference.slug}/profile/edit`} />
                </Route>
            ) : undefined}

            <Route exact path={`${rootUrl}`}>
                <ConferenceLandingPage />
            </Route>

            <Route exact path={`${rootUrl}/manage`}>
                <RequireAtLeastOnePermissionWrapper
                    permissions={[
                        Permission_Enum.ConferenceManageAttendees,
                        Permission_Enum.ConferenceManageContent,
                        Permission_Enum.ConferenceManageGroups,
                        Permission_Enum.ConferenceManageName,
                        Permission_Enum.ConferenceManageRoles,
                        Permission_Enum.ConferenceManageSchedule,
                        Permission_Enum.ConferenceModerateAttendees,
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

            <Route path={`${rootUrl}/rooms`}>
                <RoomListPage />
            </Route>

            <Route path={`${rootUrl}/attendees`}>
                <RequireAtLeastOnePermissionWrapper
                    componentIfDenied={<Redirect to={`/conference/${conference.slug}`} />}
                    permissions={[
                        Permission_Enum.ConferenceViewAttendees,
                        Permission_Enum.ConferenceManageAttendees,
                        Permission_Enum.ConferenceManageGroups,
                        Permission_Enum.ConferenceManageRoles,
                    ]}
                >
                    <AttendeeListPage />
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
                    permissions={[Permission_Enum.ConferenceView, Permission_Enum.ConferenceManageSchedule]}
                >
                    <ConferenceTimeline />
                </RequireAtLeastOnePermissionWrapper>
            </Route>

            <Route exact path={`${rootUrl}/profile/edit/:attendeeId`}>
                {(props) =>
                    props.match?.params.attendeeId ? (
                        <EditProfilePage
                            attendeeId={
                                props.match?.params.attendeeId && props.match?.params.attendeeId.length > 0
                                    ? props.match?.params.attendeeId
                                    : undefined
                            }
                        />
                    ) : (
                        <Redirect to={`/conference/${conference.slug}`} />
                    )
                }
            </Route>

            <Route exact path={`${rootUrl}/profile/view/:attendeeId`}>
                {(props) =>
                    props.match?.params.attendeeId ? (
                        <ViewProfilePage
                            attendeeId={
                                props.match?.params.attendeeId && props.match?.params.attendeeId.length > 0
                                    ? props.match?.params.attendeeId
                                    : undefined
                            }
                        />
                    ) : (
                        <Redirect to={`/conference/${conference.slug}`} />
                    )
                }
            </Route>

            <Route path={`${rootUrl}/shuffle`}>
                <RequireAtLeastOnePermissionWrapper
                    componentIfDenied={<Redirect to={`/conference/${conference.slug}`} />}
                    permissions={[
                        Permission_Enum.ConferenceViewAttendees,
                        Permission_Enum.ConferenceManageAttendees,
                        Permission_Enum.ConferenceModerateAttendees,
                        Permission_Enum.ConferenceManageSchedule,
                    ]}
                >
                    <WaitingPage />
                </RequireAtLeastOnePermissionWrapper>
            </Route>

            <Route path={rootUrl}>
                <PageNotFound />
            </Route>
        </Switch>
    );
}

function TabTracker(): JSX.Element {
    const mAttendee = useMaybeCurrentAttendee();
    useTabTracker(mAttendee?.id);
    return <></>;
}

// gql`
//     query SelectActiveShufflePeriods(
//         $conferenceId: uuid!
//         $start: timestamptz!
//         $end: timestamptz!
//         $attendeeId: uuid!
//     ) {
//         room_ShufflePeriod(
//             where: { conferenceId: { _eq: $conferenceId }, startAt: { _lte: $start }, endAt: { _gte: $end } }
//         ) {
//             ...ShufflePeriodData
//         }
//     }
// `;

// function ShuffleRoomsQueueMonitor(): JSX.Element {
//     const conference = useConference();
//     const periods = useSelectActiveShufflePeriodsQuery({
//         skip: true,
//     });
//     const fetchShuffleRooms = useCallback(() => {
//         periods.refetch({
//             conferenceId: conference.id,
//             start: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
//             end: new Date().toISOString(),
//         });
//     }, [conference.id, periods]);
//     usePolling(fetchShuffleRooms, 15000, true);

//     // const [seenAllocatedRooms, setSeenAllocatedRooms] = useState<Set<number>>();
//     // useEffect(() => {
//     //     if (periods.data?.room_ShufflePeriod) {
//     //         for (const period of periods.data.room_ShufflePeriod) {
//     //             // period.queueEntries
//     //         }
//     //     }
//     // }, [periods.data.room_ShufflePeriod]);

//     return <></>;
// }

export default function ConferenceRoutes({ confSlug, rootUrl }: { confSlug: string; rootUrl: string }): JSX.Element {
    return (
        <ConferenceProvider confSlug={confSlug}>
            <PresenceCountProvider>
                <CurrentUserGroupsRolesPermissionsProvider>
                    <ConferenceCurrentUserActivePermissionsProvider>
                        <CurrentAttendeeProvider>
                            <TabTracker />
                            {/* <ShuffleRoomsQueueMonitor /> */}
                            <ChatNotificationsProvider>
                                <RoomParticipantsProvider>
                                    <SharedRoomContextProvider>
                                        <ConferenceRoutesInner rootUrl={rootUrl} />
                                    </SharedRoomContextProvider>
                                </RoomParticipantsProvider>
                            </ChatNotificationsProvider>
                        </CurrentAttendeeProvider>
                    </ConferenceCurrentUserActivePermissionsProvider>
                </CurrentUserGroupsRolesPermissionsProvider>
            </PresenceCountProvider>
        </ConferenceProvider>
    );
}
