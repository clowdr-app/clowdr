import React from "react";
import { Route, Switch } from "react-router-dom";
import AttendeeLandingPage from "./Attend/AttendeeLandingPage";
import ConferenceProvider from "./ConferenceProvider";
import ManagerLandingPage from "./Manage/ManagerLandingPage";

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
                    <AttendeeLandingPage />
                </Route>
                <Route exact path={`${rootUrl}/manage`}>
                    <ManagerLandingPage />
                </Route>
            </Switch>
        </ConferenceProvider>
    );
}
