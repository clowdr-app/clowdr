import { Link, Text } from "@chakra-ui/react";
import React from "react";
import { Permissions_Permission_Enum } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import { DashboardPage } from "../DashboardPage";
import { ConnectYouTubeAccount } from "./YouTube/ConnectYouTubeAccount";
import { UploadYouTubeVideos } from "./YouTube/UploadYouTubeVideos";
import { YouTubeExportProvider } from "./YouTube/YouTubeExportContext";

export function YouTubeExport(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Export to YouTube from ${conference.shortName}`);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permissions_Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            <DashboardPage title="Export to YouTube">
                {title}
                <Text>
                    By using Midspace to export videos to YouTube, you agree to{" "}
                    <Link isExternal href="https://www.youtube.com/t/terms">
                        YouTube&apos;s Terms of Service
                    </Link>
                    .
                </Text>
                <YouTubeExportProvider>
                    <ConnectYouTubeAccount my={4} />
                    <UploadYouTubeVideos />
                </YouTubeExportProvider>
            </DashboardPage>
        </RequireAtLeastOnePermissionWrapper>
    );
}
