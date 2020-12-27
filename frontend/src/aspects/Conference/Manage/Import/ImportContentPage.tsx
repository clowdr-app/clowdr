import { Box, Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import type { IntermediaryData } from "@clowdr-app/shared-types/build/import/intermediary";
import React, { useMemo, useState } from "react";
import { Permission_Enum } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import type { ParsedData } from "../../../Files/useCSVJSONXMLParser";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import useDashboardPrimaryMenuButtons from "../useDashboardPrimaryMenuButtons";
import ConfigPanel from "./Content/ConfigPanel";
import DataPanel, { ParsedContentData } from "./Content/DataPanel";
import MergePanel from "./Content/MergePanel";
import ReviewPanel from "./Content/ReviewPanel";

export default function ImportContentPage(): JSX.Element {
    const conference = useConference();
    useDashboardPrimaryMenuButtons();

    const [data, setData] = useState<ParsedData<ParsedContentData>[]>();
    const [intermediaryData, setIntermediaryData] = useState<Record<string, IntermediaryData>>({});

    const dataPanel = useMemo(() => <DataPanel onData={setData} />, []);
    const configPanel = useMemo(() => data && <ConfigPanel data={data} onChange={setIntermediaryData} />, [data]);
    const reviewPanel = useMemo(() => <ReviewPanel data={intermediaryData} />, [intermediaryData]);
    const mergePanel = useMemo(() => <MergePanel data={intermediaryData} />, [intermediaryData]);

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
                        <Tab isDisabled={!data || data.length === 0}>Configure</Tab>
                        <Tab isDisabled={!data || data.length === 0}>Review</Tab>
                        <Tab isDisabled={!data || data.length === 0}>Merge</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>{dataPanel}</TabPanel>
                        <TabPanel>{configPanel}</TabPanel>
                        <TabPanel>{reviewPanel}</TabPanel>
                        <TabPanel>{mergePanel}</TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>
        </RequireAtLeastOnePermissionWrapper>
    );
}
