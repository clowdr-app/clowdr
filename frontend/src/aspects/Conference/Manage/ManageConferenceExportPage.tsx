import { Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import React from "react";
import { Permission_Enum } from "../../../generated/graphql";
import PageNotFound from "../../Errors/PageNotFound";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import { ConnectYouTubeAccount } from "./Export/ConnectYouTubeAccount";
import { UploadedYouTubeVideos } from "./Export/UploadedYouTubeVideos";
import { UploadYouTubeVideos } from "./Export/UploadYouTubeVideos";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

export default function ManageConferenceExportPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Export data from ${conference.shortName}`);

    useDashboardPrimaryMenuButtons();

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" fontSize="4xl">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" fontSize="2xl" fontStyle="italic">
                Exports
            </Heading>
            <Tabs width="100%">
                <TabList>
                    <Tab>Connected YouTube accounts</Tab>
                    <Tab>Upload videos to YouTube</Tab>
                    <Tab>Uploaded videos</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        <ConnectYouTubeAccount />
                    </TabPanel>
                    <TabPanel>
                        <UploadYouTubeVideos />
                    </TabPanel>
                    <TabPanel>
                        <UploadedYouTubeVideos />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </RequireAtLeastOnePermissionWrapper>
    );
}
