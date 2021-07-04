import { Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import React from "react";
import { Permissions_Permission_Enum } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import { ConnectYouTubeAccount } from "./ConnectYouTubeAccount";
import { UploadedYouTubeVideos } from "./UploadedYouTubeVideos";
import { UploadYouTubeVideos } from "./UploadYouTubeVideos";

export default function ManageExport(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Export data from ${conference.shortName}`);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permissions_Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" fontSize="4xl">
                Manage {conference.shortName}
            </Heading>
            <Heading id="page-heading" as="h2" fontSize="2xl" fontStyle="italic">
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
