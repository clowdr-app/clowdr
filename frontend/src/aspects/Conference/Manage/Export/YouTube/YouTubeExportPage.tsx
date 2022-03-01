import { Link, Text } from "@chakra-ui/react";
import React from "react";
import { Route, Switch, useRouteMatch } from "react-router-dom";
import { LinkButton } from "../../../../Chakra/LinkButton";
import PageNotFound from "../../../../Errors/PageNotFound";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { useTitle } from "../../../../Hooks/useTitle";
import RequireRole from "../../../RequireRole";
import { useConference } from "../../../useConference";
import { DashboardPage } from "../../DashboardPage";
import { ConnectYouTubeAccount } from "./ConnectYouTubeAccount";
import { Finished } from "./Finished";
import { UploadedPage } from "./UploadedPage";
import { UploadYouTubeVideos } from "./UploadYouTubeVideos";
import { YouTubeExportProvider } from "./YouTubeExportContext";

export function YouTubeExportPage(): JSX.Element {
    const conference = useConference();
    const { conferencePath } = useAuthParameters();
    const { path } = useRouteMatch();
    const title = useTitle(`Export to YouTube from ${conference.shortName}`);

    return (
        <RequireRole organizerRole componentIfDenied={<PageNotFound />}>
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
                            to={`${conferencePath}/manage/export/youtube/uploads`}
                            colorScheme="PrimaryActionButton"
                            mt={4}
                            size="md"
                        >
                            Previous exports
                        </LinkButton>
                        <YouTubeExportProvider>
                            <ConnectYouTubeAccount my={4} />
                            <UploadYouTubeVideos />
                            <Finished />
                        </YouTubeExportProvider>
                    </DashboardPage>
                </Route>
            </Switch>
        </RequireRole>
    );
}
