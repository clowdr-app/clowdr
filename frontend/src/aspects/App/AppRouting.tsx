import { chakra, Link, Text } from "@chakra-ui/react";
import React, { Suspense } from "react";
import type { RouteComponentProps } from "react-router-dom";
import { Redirect, Route, Switch } from "react-router-dom";
import ProtectedRoute from "../Auth/ProtectedRoute";
import CenteredSpinner from "../Chakra/CenteredSpinner";
import { LinkButton } from "../Chakra/LinkButton";
import ConferenceRoutes from "../Conference/ConferenceRoutes";
import { useAuthParameters } from "../GQL/AuthParameters";

const EmailVerificationRequiredPage = React.lazy(() => import("../Auth/EmailVerificationRequiredPage"));
const LoggedOutPage = React.lazy(() => import("../Auth/LoggedOutPage"));
const PasswordResetResultPage = React.lazy(() => import("../Auth/PasswordResetResultPage"));
const UseInviteOrCreateView = React.lazy(() => import("../Conference/UseInviteOrCreateView"));
const SubmitItemsPage = React.lazy(() => import("../Submissions/SubmitItemsPage"));
const SubmitItemPage = React.lazy(() => import("../Submissions/SubmitItemPage"));
const SubmitElementPage = React.lazy(() => import("../Submissions/SubmitElementPage"));
const PushNotificationSettings = React.lazy(() => import("../PushNotifications/PushNotificationSettings"));
const GenericErrorPage = React.lazy(() => import("../Errors/GenericErrorPage"));
const PageNotFound = React.lazy(() => import("../Errors/PageNotFound"));
const AcceptInvitationPage = React.lazy(() => import("../Invitation/AcceptInvitationPage"));
const SuperUserLandingPage = React.lazy(() => import("../SuperUser/LandingPage"));
const CurrentUserPage = React.lazy(() => import("../Users/CurrentUser/CurrentUserPage"));
const NewUserLandingPage = React.lazy(() => import("../Users/NewUser/LandingPage"));

const GoogleOAuth = React.lazy(() => import("../Google/GoogleOAuth").then((x) => ({ default: x.GoogleOAuth })));
const GoogleOAuthRedirect = React.lazy(() =>
    import("../Google/GoogleOAuth").then((x) => ({ default: x.GoogleOAuthRedirect }))
);
const VideoTestPage = React.lazy(() =>
    import("../Conference/Attend/Room/Video/VideoTestPage").then((x) => ({ default: x.VideoTestPage }))
);

export default function AppRouting(): JSX.Element {
    const { conferenceSlug: confSlug, conferenceId } = useAuthParameters();

    return (
        <Suspense fallback={<CenteredSpinner caller="AppRouting:39" />}>
            <Switch>
                <ProtectedRoute component={PushNotificationSettings} exact path="/user/pushNotifications" />
                <ProtectedRoute component={SuperUserLandingPage} exact path="/su" />

                <Route exact path="/auth0/email-verification/result">
                    {(props) => {
                        const searchParams = new URLSearchParams(props.location.search);
                        const success = searchParams.get("success");
                        const message = searchParams.get("message");
                        if (success === "true" || message === "This account is already verified.") {
                            return <EmailVerificationRequiredPage success={true} message={message} />;
                        }
                        return <EmailVerificationRequiredPage success={false} message={message} />;
                    }}
                </Route>
                <Route
                    path="/auth0/logged-in"
                    render={(props) => {
                        const searchParams = new URLSearchParams(props.location.search);

                        if (props.location.search.includes("error")) {
                            if (props.location.search.includes("verify")) {
                                return <Redirect to="/auth0/email-verification/result" />;
                            } else {
                                return (
                                    <GenericErrorPage heading="Authentication error">
                                        <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                                            Sorry, an authentication error has occurred. Please try again later.
                                        </Text>
                                        <Text fontSize="md" lineHeight="revert" fontWeight="light">
                                            <chakra.span fontStyle="italic" mr={1}>
                                                Signed in with Google?
                                            </chakra.span>
                                            <chakra.span>
                                                If you previously had an account with us and have signed in with Google
                                                for the first time, we may need to reconcile your accounts. Please
                                                contact our support team at{" "}
                                            </chakra.span>
                                            <Link
                                                wordBreak="keep-all"
                                                whiteSpace="nowrap"
                                                href={`mailto:${
                                                    import.meta.env.VITE_TECH_SUPPORT_ADDRESS ?? "support@midspace.app"
                                                }`}
                                            >
                                                {import.meta.env.VITE_TECH_SUPPORT_ADDRESS ?? "support@midspace.app"}
                                            </Link>
                                        </Text>
                                    </GenericErrorPage>
                                );
                            }
                        } else {
                            const redirecToRaw = searchParams.get("redirectTo");
                            const redirectTo = redirecToRaw ? decodeURI(redirecToRaw) : null;
                            if (redirectTo) {
                                return <Redirect to={redirectTo} />;
                            } else {
                                return <Redirect to="/user" />;
                            }
                        }
                    }}
                />
                <Route exact path="/auth0/logged-in/stay-on-page">
                    Staying on this page so you can debug.
                </Route>
                <Route exact path="/auth0/logged-out">
                    <Redirect to="/logged-out" />
                </Route>
                <Route exact path="/auth0/error">
                    <GenericErrorPage heading="Sorry, an authentication error occurred…">
                        <>
                            <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                                Please try again later
                            </Text>
                            <LinkButton aria-label="Go to home" to="/">
                                Go to home
                            </LinkButton>
                            <Text fontSize="md" lineHeight="revert" fontWeight="light">
                                <chakra.span fontStyle="italic" mr={1}>
                                    Signed in with Google?
                                </chakra.span>
                                <chakra.span>
                                    If you previously had an account with us and have signed in with Google for the
                                    first time, we may need to reconcile your accounts. Please contact our support team
                                    at{" "}
                                </chakra.span>
                                <Link
                                    wordBreak="keep-all"
                                    whiteSpace="nowrap"
                                    href={`mailto:${
                                        import.meta.env.VITE_TECH_SUPPORT_ADDRESS ?? "support@midspace.app"
                                    }`}
                                >
                                    {import.meta.env.VITE_TECH_SUPPORT_ADDRESS ?? "support@midspace.app"}
                                </Link>
                            </Text>
                        </>
                    </GenericErrorPage>
                </Route>
                <Route exact path="/auth0/blocked">
                    <GenericErrorPage heading="Sorry, your account has been blocked…">
                        <>
                            <LinkButton aria-label="Go to home" to="/">
                                Go to home
                            </LinkButton>
                        </>
                    </GenericErrorPage>
                </Route>
                <Route exact path="/auth0/password/reset/result">
                    {(props) => {
                        const searchParams = new URLSearchParams(props.location.search);
                        const success = searchParams.get("success");
                        const message = searchParams.get("message");
                        return <PasswordResetResultPage message={message} success={success === "true"} />;
                    }}
                </Route>
                <Route exact path="/logged-out">
                    <LoggedOutPage />
                </Route>

                <ProtectedRoute exact path="/user" component={CurrentUserPage} />

                <Route
                    exact
                    path="/invitation/accept/:inviteCode"
                    component={(
                        props: RouteComponentProps<{
                            inviteCode: string;
                        }>
                    ) => <AcceptInvitationPage inviteCode={props.match.params.inviteCode} />}
                />
                <Route exact path="/invitation/accept" component={AcceptInvitationPage} />

                <ProtectedRoute
                    altIfNotAuthed={<Redirect to="/" />}
                    exact
                    path="/join"
                    component={UseInviteOrCreateView}
                />

                <ProtectedRoute
                    altIfNotAuthed={<Redirect to="/" />}
                    exact
                    path="/googleoauth2"
                    component={GoogleOAuth}
                />

                {/* A page for easy testing of the HLS video player */}
                <Route path="/video-player" component={VideoTestPage} />

                <Route
                    path="/submissions/:token/item/:itemId/element/:elementId"
                    component={(
                        props: RouteComponentProps<{
                            token: string;
                            itemId: string;
                            elementId: string;
                        }>
                    ) => (
                        <SubmitElementPage
                            magicToken={props.match.params.token}
                            itemId={props.match.params.itemId}
                            elementId={props.match.params.elementId}
                        />
                    )}
                />

                <Route
                    path="/submissions/:token/item/:itemId"
                    component={(
                        props: RouteComponentProps<{
                            token: string;
                            itemId: string;
                        }>
                    ) => <SubmitItemPage magicToken={props.match.params.token} itemId={props.match.params.itemId} />}
                />
                <Route
                    path="/submissions/:token"
                    component={(
                        props: RouteComponentProps<{
                            token: string;
                        }>
                    ) => <SubmitItemsPage magicToken={props.match.params.token} />}
                />

                <Route exact path="/googleoauth" component={GoogleOAuthRedirect} />

                {!confSlug ? (
                    <Switch>
                        <ProtectedRoute
                            altIfNotAuthed={
                                <Route exact path="/">
                                    <NewUserLandingPage />
                                </Route>
                            }
                            exact
                            path="/"
                            component={() => <Redirect to="/user" />}
                        />
                        <Route path="/">
                            <PageNotFound />
                        </Route>
                    </Switch>
                ) : conferenceId ? (
                    conferenceId === "NONE" ? (
                        <PageNotFound />
                    ) : (
                        <ConferenceRoutes />
                    )
                ) : (
                    <CenteredSpinner centerProps={{ minHeight: "calc(100vh - 40px)" }} caller="AppRouting:329" />
                )}
            </Switch>
        </Suspense>
    );
}
