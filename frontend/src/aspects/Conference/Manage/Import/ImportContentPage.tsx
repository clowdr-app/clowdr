import { Box, Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import React, { useMemo } from "react";
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

    const dataPanel = useMemo(() => <DataPanel />, []);
    const configPanel = useMemo(() => <ConfigPanel />, []);
    const reviewPanel = useMemo(() => <ReviewPanel />, []);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            <Box mb="auto" w="100%" minH="100vh">
                <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                    Manage {conference.shortName}
                </Heading>
                <Heading as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                    Import Content
                </Heading>
                <Tabs defaultIndex={0} w="100%">
                    <TabList>
                        <Tab>Data</Tab>
                        <Tab>Configure</Tab>
                        <Tab>Review</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>
                            {dataPanel}
                        </TabPanel>

                        <TabPanel>
                            {configPanel}
                        </TabPanel>

                        <TabPanel>
                            {reviewPanel}
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>
        </RequireAtLeastOnePermissionWrapper>
    );
}
