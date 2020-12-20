import { Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import React from "react";
import { Permission_Enum } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import useDashboardPrimaryMenuButtons from "../useDashboardPrimaryMenuButtons";
import ConfigPanel from "./Content/ConfigPanel";
import DataPanel from "./Content/DataPanel";
import ReviewPanel from "./Content/ReviewPanel";

export default function ImportContentPage(): JSX.Element {
    const conference = useConference();
    useDashboardPrimaryMenuButtons();

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Import Content
            </Heading>
            <Tabs defaultIndex={0}>
                <TabList>
                    <Tab>Data</Tab>
                    <Tab>Configure</Tab>
                    <Tab>Review</Tab>
                </TabList>

                <TabPanels>
                    <TabPanel>
                        <DataPanel />
                    </TabPanel>

                    <TabPanel>
                        <ConfigPanel />
                    </TabPanel>

                    <TabPanel>
                        <ReviewPanel />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </RequireAtLeastOnePermissionWrapper>
    );
}
