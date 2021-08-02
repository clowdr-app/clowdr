import { Text } from "@chakra-ui/react";
import React from "react";
import { Redirect, Route, RouteComponentProps, Switch } from "react-router-dom";
import EmailVerificationRequiredPage from "./aspects/Auth/EmailVerificationRequiredPage";
import LoggedOutPage from "./aspects/Auth/LoggedOutPage";
import PasswordResetResultPage from "./aspects/Auth/PasswordResetResultPage";
import ProtectedRoute from "./aspects/Auth/ProtectedRoute";
import { LinkButton } from "./aspects/Chakra/LinkButton";
import { VideoTestPage } from "./aspects/Conference/Attend/Room/Video/VideoTestPage";
import ConferenceRoutes from "./aspects/Conference/ConferenceRoutes";
import UseInviteOrCreateView from "./aspects/Conference/UseInviteOrCreateView";
import SubmitItemPage from "./aspects/Content/SubmitItemPage";
import CRUDTestPage from "./aspects/CRUDTable/CRUDTestPage";
import GenericErrorPage from "./aspects/Errors/GenericErrorPage";
import PageNotFound from "./aspects/Errors/PageNotFound";
import { GoogleOAuth, GoogleOAuthRedirect } from "./aspects/Google/GoogleOAuth";
import AcceptInvitationPage from "./aspects/Invitation/AcceptInvitationPage";
import PushNotificationSettings from "./aspects/PushNotifications/PushNotificationSettings";
import CurrentUserPage from "./aspects/Users/CurrentUser/CurrentUserPage";
import ExistingUserLandingPage from "./aspects/Users/ExistingUser/LandingPage";
import NewUserLandingPage from "./aspects/Users/NewUser/LandingPage";

export default function Routing({ confSlug }: { confSlug?: string }): JSX.Element {
    return (
        <Switch>
            <ProtectedRoute component={PushNotificationSettings} exact path="/user/pushNotifications" />

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
            <ProtectedRoute
                altIfNotAuthed={
                    <Route exact path="/">
                        <NewUserLandingPage />
                    </Route>
                }
                exact
                path="/"
                component={ExistingUserLandingPage}
            />

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

            <Route exact path="/crud/test" component={CRUDTestPage} />

            <ProtectedRoute altIfNotAuthed={<Redirect to="/" />} exact path="/join" component={UseInviteOrCreateView} />

            <ProtectedRoute altIfNotAuthed={<Redirect to="/" />} exact path="/googleoauth2" component={GoogleOAuth} />

            {confSlug && <ConferenceRoutes />}

            {/* A page for easy testing of the HLS video player */}
            <Route path="/video-player" component={VideoTestPage} />

            <Route
                path="/upload/:id/:token"
                component={(
                    props: RouteComponentProps<{
                        token: string;
                        id: string;
                    }>
                ) => <SubmitItemPage magicToken={props.match.params.token} />}
            />

            <Route exact path="/googleoauth" component={GoogleOAuthRedirect} />

            <Route path="/">
                <PageNotFound />
            </Route>
        </Switch>
    );
}
