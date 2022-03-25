import React from "react";
import PageNotFound from "../../../../Errors/PageNotFound";
import RequireRole from "../../../RequireRole";
import { DashboardPage } from "../../DashboardPage";
import { AllVideoElements } from "./AllVideoElements";
import { VideoDownloadProvider } from "./VideoDownloadContext";

export function DownloadVideosPage(): JSX.Element {
    return (
        <RequireRole organizerRole componentIfDenied={<PageNotFound />}>
            <VideoDownloadProvider>
                <DashboardPage title="Download videos">
                    <AllVideoElements />
                </DashboardPage>
            </VideoDownloadProvider>
        </RequireRole>
    );
}
