import React from "react";
import { Route } from "react-router";
import { Switch, useRouteMatch } from "react-router-dom";
import { Dashboard } from "./Dashboard";
import { DownloadVideos } from "./DownloadVideos";
import { YouTubeExport } from "./YouTubeExport";

export default function ManageExport(): JSX.Element {
    const { path } = useRouteMatch();
    return (
        <Switch>
            <Route path={`${path}/youtube`}>
                <YouTubeExport />
            </Route>
            <Route path={`${path}/download-videos`}>
                <DownloadVideos />
            </Route>
            <Route path="/">
                <Dashboard />
            </Route>
        </Switch>
    );
}
