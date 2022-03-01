import React from "react";
import PageNotFound from "../../../../Errors/PageNotFound";
import { useTitle } from "../../../../Hooks/useTitle";
import RequireRole from "../../../RequireRole";
import { useConference } from "../../../useConference";
import { DashboardPage } from "../../DashboardPage";
import { AllVideoElements } from "./AllVideoElements";
import { VideoDownloadProvider } from "./VideoDownloadContext";

export function DownloadVideosPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Download videos from ${conference.shortName}`);

    return (
        <RequireRole organizerRole componentIfDenied={<PageNotFound />}>
            <VideoDownloadProvider>
                <DashboardPage title="Download videos">
                    {title}
                    <AllVideoElements />
                </DashboardPage>
            </VideoDownloadProvider>
        </RequireRole>
    );
}
