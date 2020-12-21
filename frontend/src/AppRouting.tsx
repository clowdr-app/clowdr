import { Text } from "@chakra-ui/react";
import React from "react";
import { Redirect, Route, RouteComponentProps, Switch } from "react-router-dom";
import LoggedOutPage from "./aspects/Auth/LoggedOutPage";
import ProtectedRoute from "./aspects/Auth/ProtectedRoute";
import ConferenceRoutes from "./aspects/Conference/ConferenceRoutes";
import SubmitItemPage from "./aspects/Content/SubmitItemPage";
import CRUDTestPage from "./aspects/CRUDTable/CRUDTestPage";
import GenericErrorPage from "./aspects/Errors/GenericErrorPage";
import PageNotFound from "./aspects/Errors/PageNotFound";
import AcceptInvitationPage from "./aspects/Invitation/AcceptInvitationPage";
import CurrentUserPage from "./aspects/Users/CurrentUser/CurrentUserPage";
import ExistingUserLandingPage from "./aspects/Users/ExistingUser/LandingPage";
import NewUserLandingPage from "./aspects/Users/NewUser/LandingPage";

export default function Routing(): JSX.Element {
    return (
        <Switch>
            <Route exact path="/auth0/email-verification-required">
                <GenericErrorPage heading="Please verify your email">
                    <Text fontSize="xl" lineHeight="revert" fontWeight="light" maxW={600}>
                        Before you can login you must verify your email address.{" "}
                        <b>
                            You should have received an email from&nbsp;
                            <i>no-reply@auth0user.net</i>
                        </b>
                        &nbsp;with your verification link. After verifying your email, please log in again.
                    </Text>
                </GenericErrorPage>
            </Route>
            <Route
                path="/auth0/logged-in"
                render={(props) => {
                    if (props.location.search.includes("error")) {
                        if (props.location.search.includes("verify")) {
                            return <Redirect to="/auth0/email-verification-required" />;
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
                        return <Redirect to="/user" />;
                    }
                }}
            />
            <Route exact path="/auth0/logged-in/stay-on-page">
                Staying on this page so you can debug.
            </Route>
            <Route exact path="/auth0/logged-out">
                <Redirect to="/logged-out" />
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

            <Route
                path="/conference/:confSlug"
                component={(
                    props: RouteComponentProps<{
                        confSlug: string;
                    }>
                ) => <ConferenceRoutes rootUrl={props.match.url} confSlug={props.match.params.confSlug} />}
            />

            <Route
                path="/upload/:id/:token"
                component={(
                    props: RouteComponentProps<{
                        token: string;
                        id: string;
                    }>
                ) => (
                    <SubmitItemPage
                        magicToken={props.match.params.token}
                        requiredContentItemId={props.match.params.id}
                    />
                )}
            />

            {/*

            <Route exact path="/echo">
                <Echo />
            </Route>
            <Route exact path="/protectedEcho">
                <ProtectedEcho />
            </Route>

            <Route
                exact
                path="/chat/:chatId"
                component={(p: RouteComponentProps<any>) => (
                    <ChatsPage chatId={p.match.params.chatId} />
                )}
            />

            <ProtectedRoute exact path="/profile" component={UserProfileInfo} /> */}

            <Route path="/">
                <PageNotFound />
            </Route>
        </Switch>
    );
}
