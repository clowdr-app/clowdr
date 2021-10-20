import React from "react";
import { Permissions_Permission_Enum } from "../../../../../generated/graphql";
import PageNotFound from "../../../../Errors/PageNotFound";
import { useTitle } from "../../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../../useConference";
import { DashboardPage } from "../../DashboardPage";
import { AllVideoElements } from "./AllVideoElements";
import { VideoDownloadProvider } from "./VideoDownloadContext";

export function DownloadVideosPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Download videos from ${conference.shortName}`);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permissions_Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            <VideoDownloadProvider>
                <DashboardPage title="Download videos">
                    {title}
                    <AllVideoElements />
                </DashboardPage>
            </VideoDownloadProvider>
        </RequireAtLeastOnePermissionWrapper>
    );
}
