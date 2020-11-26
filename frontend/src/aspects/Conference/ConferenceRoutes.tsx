import React from "react";
import { Route, Switch } from "react-router-dom";

export default function ConferenceRoutes({
    confSlug,
    rootUrl,
}: {
    confSlug: string;
    rootUrl: string;
}): JSX.Element {
    return (
        <Switch>
            <Route exact path={`${rootUrl}/`}>
                <>Conference: {confSlug}</>
            </Route>
        </Switch>
    );
}
