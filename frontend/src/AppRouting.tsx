import React from "react";
import { Redirect, Route, RouteComponentProps, Switch } from "react-router-dom";
import ProtectedRoute from "./aspects/Auth/ProtectedRoute";
import ChatsPage from "./aspects/Chat/ChatsPage";
import Echo from "./aspects/Echo/Echo";
import ProtectedEcho from "./aspects/Echo/ProtectedEcho";
import UserProfileInfo from "./aspects/Users/CurrentUser/UserProfileInfo";

export default function Routing(): JSX.Element {
    return (
        <Switch>
            <Route exact path="/auth0/logged-in">
                <Redirect to="/profile" />
            </Route>
            <Route exact path="/auth0/logged-in/stay-on-page">
                Staying on this page so you can debug.
            </Route>
            <Route exact path="/auth0/logged-out">
                <Redirect to="/logged-out" />
            </Route>
            <Route exact path="/logged-out">
                You have been logged out.
            </Route>
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
            <ProtectedRoute
                altIfNotAuthed={
                    <Route exact path="/">
                        Home page
                    </Route>
                }
                exact
                path="/"
                component={ChatsPage}
            />
            <ProtectedRoute exact path="/profile" component={UserProfileInfo} />
        </Switch>
    );
}
