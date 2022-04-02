import React, { Suspense, useEffect } from "react";
import type { RouteComponentProps } from "react-router-dom";
import { Redirect, Route, Switch, useRouteMatch } from "react-router-dom";
import { Registrant_RegistrantRole_Enum } from "../../generated/graphql";
import CenteredSpinner from "../Chakra/CenteredSpinner";
import { useConferenceTheme } from "../Chakra/ChakraCustomProvider";
import { useAuthParameters } from "../GQL/AuthParameters";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import RequireRole from "./RequireRole";
import { useConference } from "./useConference";
import { useMaybeCurrentRegistrant } from "./useCurrentRegistrant";

const EditProfilePage = React.lazy(() => import("./Attend/Profile/EditProfilePage"));
const ViewProfilePage = React.lazy(() => import("./Attend/Profile/ViewProfilePage"));
const MyBackstages = React.lazy(() => import("./Attend/Profile/MyBackstages"));
const ItemPage = React.lazy(() => import("./Attend/Content/ItemPage"));
const ConferenceLandingPage = React.lazy(() => import("./Attend/ConferenceLandingPage"));
const ExhibitionPage = React.lazy(() => import("./Attend/Exhibition/ExhibitionPage"));
const ExhibitionsPage = React.lazy(() => import("./Attend/Exhibition/ExhibitionsPage"));
const MyRecordingsPage = React.lazy(() => import("./Attend/Recordings/MyRecordingsPage"));
const RegistrantListPage = React.lazy(() => import("./Attend/Registrant/RegistrantListPage"));
const RoomPage = React.lazy(() => import("./Attend/Room/RoomPage"));
const WholeSchedule = React.lazy(() => import("./Attend/Schedule/WholeSchedule"));
const SwagBags = React.lazy(() => import("./Attend/SwagBag/SwagBags"));
const ChatRedirectPage = React.lazy(() => import("../Chat/ChatRedirectPage"));
const WaitingPage = React.lazy(() => import("../ShuffleRooms/WaitingPage"));
const PageNotFound = React.lazy(() => import("../Errors/PageNotFound"));
const SearchPage = React.lazy(() => import("../Search/SearchPage"));
const SponsorsPage = React.lazy(() =>
    import("./Attend/Rooms/SponsorBooths").then((x) => ({ default: x.SponsorsPage }))
);
const SocialisePage = React.lazy(() =>
    import("./Attend/Rooms/SocialiseModal").then((x) => ({ default: x.SocialisePage }))
);

export default function ConferenceRoutes(): JSX.Element {
    const conference = useConference();
    const { setTheme } = useConferenceTheme();
    const mUser = useMaybeCurrentUser();
    const mRegistrant = useMaybeCurrentRegistrant();

    const { path, url } = useRouteMatch();

    useEffect(() => {
        setTheme(conference.themeComponentColors?.[0]?.value);
    }, [conference.themeComponentColors, setTheme]);

    const isOnManagementPage = useRouteMatch(`${path}/manage`);
    const { setIsOnManagementPage, setSubconferenceId, subconferenceId } = useAuthParameters();
    useEffect(() => {
        setIsOnManagementPage(Boolean(isOnManagementPage));
    }, [setIsOnManagementPage, isOnManagementPage]);
    useEffect(() => {
        if (
            isOnManagementPage &&
            subconferenceId &&
            mRegistrant &&
            !mRegistrant?.subconferenceMemberships?.find(
                (x) => x.subconferenceId === subconferenceId && x.role === Registrant_RegistrantRole_Enum.Organizer
            )
        ) {
            setSubconferenceId(null);
        }
    }, [isOnManagementPage, mRegistrant, setSubconferenceId, subconferenceId]);

    return (
        <Suspense fallback={<CenteredSpinner caller="ConferenceRoutes:56" />}>
            <Switch>
                <Route exact path={`${path}/profile/edit`} component={EditProfilePage} />

                <Route exact path={`${path}/profile/view`} component={ViewProfilePage} />

                {mUser.user ? (
                    <Route exact path={`${path}/profile`}>
                        <Redirect to={`${url}/profile/edit`} />
                    </Route>
                ) : undefined}

                {/* {mRegistrant && mRegistrant.profile && !mRegistrant.profile.hasBeenEdited ? (
                    <Route path={path}>
                        <Redirect to={`${url}/profile/edit`} />
                    </Route>
            ) : undefined} */}

                {mRegistrant && <Route exact path={`${path}/profile/backstages`} component={MyBackstages} />}

                <Route path={`${path}/manage`}>
                    <RequireRole
                        organizerRole
                        moderatorRole
                        permitIfAnySubconference
                        componentIfDenied={<PageNotFound />}
                    >
                        <ManageConferenceRoutes />
                    </RequireRole>
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

                <Route path={`${path}/sponsors`}>
                    <SponsorsPage />
                </Route>
                <Route path={`${path}/socialise`}>
                    <SocialisePage />
                </Route>

                <Route path={`${path}/registrants`}>
                    <RequireRole componentIfDenied={<Redirect to={url} />} organizerRole>
                        <RegistrantListPage />
                    </RequireRole>
                </Route>

                <Route path={`${path}/swag`}>
                    <RequireRole componentIfDenied={<Redirect to={url} />} attendeeRole>
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

                <Route path={`${path}/schedule`}>
                    <RequireRole componentIfDenied={<Redirect to={url} />} attendeeRole>
                        <WholeSchedule />
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
                            <Redirect to={url} />
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
                            <Redirect to={url} />
                        )
                    }
                </Route>

                <Route path={`${path}/chat/:chatId`}>
                    {(props) =>
                        props.match?.params.chatId ? (
                            <ChatRedirectPage chatId={props.match.params.chatId} />
                        ) : (
                            <Redirect to={url} />
                        )
                    }
                </Route>
                <Route path={`${path}/shuffle`}>
                    <RequireRole componentIfDenied={<Redirect to={url} />} attendeeRole>
                        <WaitingPage />
                    </RequireRole>
                </Route>

                <Route path={`${path}/recordings`}>
                    <RequireRole componentIfDenied={<PageNotFound />} attendeeRole>
                        <MyRecordingsPage />
                    </RequireRole>
                </Route>

                <Route path={`${path}/search/:searchTerm?`}>
                    {(props: RouteComponentProps<{ searchTerm?: string }>) => (
                        <SearchPage
                            searchTerm={
                                props.match.params.searchTerm && decodeURIComponent(props.match.params.searchTerm)
                            }
                        />
                    )}
                </Route>

                <Route exact path={`${path}`}>
                    <ConferenceLandingPage />
                </Route>

                <Route path={path}>
                    <PageNotFound />
                </Route>
            </Switch>
        </Suspense>
    );
}

const AnalyticsDashboard = React.lazy(() => import("./Manage/Analytics/AnalyticsDashboard"));
const ManageBroadcast = React.lazy(() => import("./Manage/Broadcast/ManageBroadcasts"));
const ManageModeration = React.lazy(() => import("./Manage/Chat/Moderation/ManageModeration"));
const ChecklistPage = React.lazy(() => import("./Manage/Checklist/ChecklistPage"));
const ManageContent = React.lazy(() => import("./Manage/Content/ManageContent"));
const ManageEmail = React.lazy(() => import("./Manage/Email/ManageEmail"));
const ManageExport = React.lazy(() => import("./Manage/Export/ManageExport"));
const ManageImport = React.lazy(() => import("./Manage/Import/ManageImport"));
const ManageGroups = React.lazy(() => import("./Manage/ManageGroups"));
const ManageProgramPeople = React.lazy(() => import("./Manage/ManageProgramPeople"));
const ManagerLanding = React.lazy(() => import("./Manage/ManagerLanding"));
const ManageRooms = React.lazy(() => import("./Manage/ManageRooms"));
const ManageRegistrants = React.lazy(() => import("./Manage/Registrants/ManageRegistrants"));
const ManageSchedule = React.lazy(() => import("./Manage/Schedule/ManageSchedule"));
const ManageScheduleV2 = React.lazy(() => import("./Manage/Schedule/ManageScheduleV2"));
const ManageShuffle = React.lazy(() => import("./Manage/Shuffle/ManageShuffle"));
const ManageTheme = React.lazy(() => import("./Manage/Theme/ManageTheme"));
const ManageConfig = React.lazy(() => import("./Manage/Configuration/ManageConfig"));
const PageNotImplemented = React.lazy(() => import("../Errors/PageNotImplemented"));

function ManageConferenceRoutes(): JSX.Element {
    const { path } = useRouteMatch();

    const { isOnManagementPage, subconferenceId } = useAuthParameters();
    return isOnManagementPage ? (
        <Suspense fallback={<CenteredSpinner caller="ConferenceRoutes:238" />}>
            <Switch>
                <Route exact path={path}>
                    <ManagerLanding />
                </Route>
                <Route path={`${path}/groups`}>
                    <ManageGroups />
                </Route>
                {!subconferenceId ? (
                    <Route path={`${path}/registrants`}>
                        <ManageRegistrants />
                    </Route>
                ) : undefined}
                <Route path={`${path}/people`}>
                    <ManageProgramPeople />
                </Route>
                <Route path={`${path}/content`}>
                    <ManageContent />
                </Route>
                <Route path={`${path}/import`}>
                    <ManageImport />
                </Route>
                <Route path={`${path}/rooms`}>
                    <ManageRooms />
                </Route>
                {!subconferenceId ? (
                    <Route path={`${path}/shuffle`}>
                        <ManageShuffle />
                    </Route>
                ) : undefined}
                <Route path={`${path}/broadcasts`}>
                    <ManageBroadcast />
                </Route>
                <Route path={`${path}/export`}>
                    <ManageExport />
                </Route>
                <Route path={`${path}/schedule/v2`}>
                    <ManageScheduleV2 />
                </Route>
                <Route path={`${path}/schedule`}>
                    <ManageSchedule />
                </Route>
                {!subconferenceId ? (
                    <Route path={`${path}/chats/moderation`}>
                        <ManageModeration />
                    </Route>
                ) : undefined}
                {!subconferenceId ? (
                    <Route path={`${path}/email`}>
                        <ManageEmail />
                    </Route>
                ) : undefined}
                <Route path={`${path}/checklist`}>
                    <ChecklistPage />
                </Route>
                {!subconferenceId ? (
                    <Route path={`${path}/analytics`}>
                        <AnalyticsDashboard />
                    </Route>
                ) : undefined}
                {!subconferenceId ? (
                    <Route path={`${path}/support`}>
                        <PageNotImplemented />
                    </Route>
                ) : undefined}
                {!subconferenceId ? (
                    <Route path={`${path}/theme`}>
                        <ManageTheme />
                    </Route>
                ) : undefined}
                {!subconferenceId ? (
                    <Route path={`${path}/settings`}>
                        <ManageConfig />
                    </Route>
                ) : undefined}

                <Route path="/">
                    <PageNotFound />
                </Route>
            </Switch>
        </Suspense>
    ) : (
        <CenteredSpinner caller="ConferenceRoute:290" />
    );
}
