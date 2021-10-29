import React from "react";
import { Route, Switch, useRouteMatch } from "react-router-dom";
import { Dashboard } from "./Dashboard";
import { DownloadVideosPage } from "./Download/DownloadVideosPage";
import { YouTubeExportPage } from "./YouTube/YouTubeExportPage";

export default function ManageExport(): JSX.Element {
    const { path } = useRouteMatch();
    return (
        <Switch>
            <Route path={`${path}/youtube`}>
                <YouTubeExportPage />
            </Route>
            <Route path={`${path}/download-videos`}>
                <DownloadVideosPage />
            </Route>
            <Route path="/">
                <Dashboard />
            </Route>
        </Switch>
    );
}
