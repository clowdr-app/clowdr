import { Link, Text } from "@chakra-ui/react";
import React from "react";
import { Route, Switch, useRouteMatch } from "react-router-dom";
import { Permissions_Permission_Enum } from "../../../../generated/graphql";
import { LinkButton } from "../../../Chakra/LinkButton";
import PageNotFound from "../../../Errors/PageNotFound";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import { DashboardPage } from "../DashboardPage";
import { ConnectYouTubeAccount } from "./YouTube/ConnectYouTubeAccount";
import { Finished } from "./YouTube/Finished";
import { UploadedPage } from "./YouTube/UploadedPage";
import { UploadYouTubeVideos } from "./YouTube/UploadYouTubeVideos";
import { YouTubeExportProvider } from "./YouTube/YouTubeExportContext";

export function YouTubeExportPage(): JSX.Element {
    const conference = useConference();
    const { path } = useRouteMatch();
    const title = useTitle(`Export to YouTube from ${conference.shortName}`);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permissions_Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            <Switch>
                <Route path={`${path}/uploads`}>
                    <UploadedPage />
                </Route>
                <Route path={`${path}/`}>
                    <DashboardPage title="Export to YouTube">
                        {title}
                        <Text>
                            By using Midspace to export videos to YouTube, you agree to{" "}
                            <Link isExternal href="https://www.youtube.com/t/terms">
                                YouTube&apos;s Terms of Service
                            </Link>
                            .
                        </Text>
                        <LinkButton
                            to={`/conference/${conference.slug}/manage/export/youtube/uploads`}
                            colorScheme="PrimaryActionButton"
                            mt={4}
                            size="md"
                        >
                            Existing exports
                        </LinkButton>
                        <YouTubeExportProvider>
                            <ConnectYouTubeAccount my={4} />
                            <UploadYouTubeVideos />
                            <Finished />
                        </YouTubeExportProvider>
                    </DashboardPage>
                </Route>
            </Switch>
        </RequireAtLeastOnePermissionWrapper>
    );
}
