import React from "react";
import { Redirect, Route, RouteComponentProps, Switch } from "react-router-dom";
import ProtectedRoute from "../auth0/ProtectedRoute";
import UserProfileInfo from "../auth0/UserProfileInfo";
import Echo from "../echo/echo";
import ProtectedEcho from "../echo/protectedEcho";
import ChatsPage from "./ChatsPage";

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
