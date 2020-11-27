import React from "react";
import { Route, Switch } from "react-router-dom";
import ConferenceProvider from "./ConferenceProvider";

export default function ConferenceRoutes({
    confSlug,
    rootUrl,
}: {
    confSlug: string;
    rootUrl: string;
}): JSX.Element {
    return (
        <ConferenceProvider confSlug={confSlug}>
            <Switch>
                <Route exact path={`${rootUrl}/`}>
                    <>Attend conference: {confSlug}</>
                </Route>
                <Route exact path={`${rootUrl}/manage`}>
                    <>
                        Manage conference: {confSlug}
                        <ol>
                            <li>
                                Somehow initialise the static Permissions table
                            </li>
                            <li>Manage roles page</li>
                            <li>Manage groups page</li>
                            <li>Manage attendees page</li>
                        </ol>
                    </>
                </Route>
            </Switch>
        </ConferenceProvider>
    );
}
