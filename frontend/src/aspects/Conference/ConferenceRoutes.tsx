import React, { useEffect } from "react";
import type { RouteComponentProps } from "react-router-dom";
import { Redirect, Route, Switch, useRouteMatch } from "react-router-dom";
import { useConferenceTheme } from "../Chakra/ChakraCustomProvider";
import ChatRedirectPage from "../Chat/ChatRedirectPage";
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
import MyRecordingsPage from "./Attend/Recordings/MyRecordingsPage";
import RegistrantListPage from "./Attend/Registrant/RegistrantListPage";
import RoomPage from "./Attend/Room/RoomPage";
import RoomListPageV1 from "./Attend/Rooms/V1/RoomListPage";
import Schedule from "./Attend/Schedule/v1/Schedule";
import ScheduleV2 from "./Attend/Schedule/v2/WholeSchedule";
import SwagBags from "./Attend/SwagBag/SwagBags";
import AnalyticsDashboard from "./Manage/Analytics/AnalyticsDashboard";
import ManageBroadcast from "./Manage/Broadcast/ManageBroadcasts";
import ManageModeration from "./Manage/Chat/Moderation/ManageModeration";
import ChecklistPage from "./Manage/Checklist/ChecklistPage";
import ManageContent from "./Manage/Content/ManageContent";
import ManageEmail from "./Manage/Email/ManageEmail";
import ManageExport from "./Manage/Export/ManageExport";
import ManageImport from "./Manage/Import/ManageImport";
import ManageDetails from "./Manage/ManageDetails";
import ManageProgramPeople from "./Manage/ManageProgramPeople";
import ManagerLanding from "./Manage/ManagerLanding";
import ManageRooms from "./Manage/ManageRooms";
import ManageRegistrants from "./Manage/Registrants/ManageRegistrants";
import ManageSchedule from "./Manage/Schedule/ManageSchedule";
import ManageShuffle from "./Manage/Shuffle/ManageShuffle";
import ManageTheme from "./Manage/Theme/ManageTheme";
import RequireRole from "./RequireRole";
import { useConference } from "./useConference";
import { useMaybeCurrentRegistrant } from "./useCurrentRegistrant";

export default function ConferenceRoutes(): JSX.Element {
    const conference = useConference();
    const { setTheme } = useConferenceTheme();
    const mUser = useMaybeCurrentUser();
    const mRegistrant = useMaybeCurrentRegistrant();

    const { path } = useRouteMatch();

    useEffect(() => {
        setTheme(conference.themeComponentColors?.[0]?.value);
    }, [conference.themeComponentColors, setTheme]);

    return (
        <Switch>
            <Route exact path={`${path}/profile/edit`} component={EditProfilePage} />

            <Route exact path={`${path}/profile/view`} component={ViewProfilePage} />

            {mUser.user ? (
                <Route exact path={`${path}/profile`}>
                    <Redirect to={`${path}/profile/edit`} />
                </Route>
            ) : undefined}

            {mRegistrant && mRegistrant.profile && !mRegistrant.profile.hasBeenEdited ? (
                <Route path={path}>
                    <Redirect to={`${path}/profile/edit`} />
                </Route>
            ) : undefined}

            {mRegistrant && <Route exact path={`${path}/profile/backstages`} component={MyBackstages} />}

            <Route exact path={`${path}/manage`}>
                <RequireRole organizerRole moderatorRole componentIfDenied={<PageNotFound />}>
                    <ManagerLanding />
                </RequireRole>
            </Route>
            <Route path={`${path}/manage/details`}>
                <ManageDetails />
            </Route>
            <Route path={`${path}/manage/registrants`}>
                <ManageRegistrants />
            </Route>
            <Route path={`${path}/manage/people`}>
                <ManageProgramPeople />
            </Route>
            <Route path={`${path}/manage/content`}>
                <ManageContent />
            </Route>
            <Route path={`${path}/manage/import`}>
                <ManageImport />
            </Route>
            <Route path={`${path}/manage/rooms`}>
                <ManageRooms />
            </Route>
            <Route path={`${path}/manage/shuffle`}>
                <ManageShuffle />
            </Route>
            <Route path={`${path}/manage/broadcasts`}>
                <ManageBroadcast />
            </Route>
            <Route path={`${path}/manage/export`}>
                <ManageExport />
            </Route>
            <Route path={`${path}/manage/schedule`}>
                <ManageSchedule />
            </Route>
            <Route path={`${path}/manage/chats/moderation`}>
                <ManageModeration />
            </Route>
            <Route path={`${path}/manage/chats`}>
                <PageNotImplemented />
            </Route>
            <Route path={`${path}/manage/email`}>
                <ManageEmail />
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
            <Route path={`${path}/manage/theme`}>
                <ManageTheme />
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
                <RequireRole componentIfDenied={<Redirect to={path} />} organizerRole>
                    <RegistrantListPage />
                </RequireRole>
            </Route>

            <Route path={`${path}/swag`}>
                <RequireRole componentIfDenied={<Redirect to={path} />} attendeeRole>
                    <SwagBags />
                </RequireRole>
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

            <Route path={`${path}/schedule/v2`}>
                <RequireRole componentIfDenied={<Redirect to={path} />} attendeeRole>
                    <ScheduleV2 />
                </RequireRole>
            </Route>

            <Route path={`${path}/schedule`}>
                <RequireRole componentIfDenied={<Redirect to={path} />} attendeeRole>
                    <Schedule />
                </RequireRole>
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
                        <Redirect to={path} />
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
                        <Redirect to={path} />
                    )
                }
            </Route>

            <Route path={`${path}/chat/:chatId`}>
                {(props) =>
                    props.match?.params.chatId ? (
                        <ChatRedirectPage chatId={props.match.params.chatId} />
                    ) : (
                        <Redirect to={path} />
                    )
                }
            </Route>
            <Route path={`${path}/shuffle`}>
                <RequireRole componentIfDenied={<Redirect to={path} />} attendeeRole>
                    <WaitingPage />
                </RequireRole>
            </Route>

            <Route path={`${path}/recordings`}>
                <RequireRole componentIfDenied={<PageNotFound />} attendeeRole>
                    <MyRecordingsPage />
                </RequireRole>
            </Route>

            <Route exact path={`${path}`}>
                <ConferenceLandingPage />
            </Route>

            <Route path={path}>
                <PageNotFound />
            </Route>
        </Switch>
    );
}
