import React from "react";
import { Redirect, Route, Switch } from "react-router-dom";
import LoggedOutPage from "./aspects/Auth/LoggedOutPage";
import ProtectedRoute from "./aspects/Auth/ProtectedRoute";
import PageNotFound from "./aspects/Errors/PageNotFound";
import PageNotImplemented from "./aspects/Errors/PageNotImplemented";
import ExistingUserLandingPage from "./aspects/Users/ExistingUser/LandingPage";
import NewUserLandingPage from "./aspects/Users/NewUser/LandingPage";

export default function Routing(): JSX.Element {
    return (
        <Switch>
            <Route exact path="/auth0/logged-in">
                <Redirect to="/user" />
            </Route>
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

            <Route exact path="/user">
                <PageNotImplemented />
            </Route>

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
