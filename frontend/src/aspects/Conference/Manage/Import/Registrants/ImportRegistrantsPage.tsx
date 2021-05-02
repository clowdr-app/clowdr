import { Box, Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import {
    IntermediaryRegistrantData,
    JSONataToIntermediaryRegistrant,
} from "@clowdr-app/shared-types/build/import/intermediary";
import React, { useMemo, useState } from "react";
import { Permissions_Permission_Enum } from "../../../../../generated/graphql";
import { LinkButton } from "../../../../Chakra/LinkButton";
import PageNotFound from "../../../../Errors/PageNotFound";
import type { ParsedData } from "../../../../Files/useCSVJSONXMLParser";
import { useTitle } from "../../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../../useConference";
import ConfigPanel from "../Shared/ConfigPanel";
import DataPanel from "../Shared/DataPanel";
import ReviewPanel from "../Shared/ReviewPanel";
import ImportPanel from "./ImportPanel";

const defaultReviewQuery = `
$
`;

const presetJSONata_UnknownQuery = `
`;

const presetJSONata_XML = `
`;

const presetJSONata_JSON = `
`;

const presetJSONata_CSV = `
$.{
    "name": name,
    "email": email,
    "group": $exists(group) ? group : "Registrants"
 } 
`;

export default function ImportRegistrantsPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Import registrants to ${conference.shortName}`);

    const [data, setData] = useState<ParsedData<any[]>[]>();
    const [intermediaryData, setIntermediaryData] = useState<Record<string, IntermediaryRegistrantData[]>>({});

    const dataPanel = useMemo(() => <DataPanel onData={setData} />, []);
    const configPanel = useMemo(
        () =>
            data && (
                <ConfigPanel
                    data={data}
                    onChange={setIntermediaryData}
                    JSONataFunction={JSONataToIntermediaryRegistrant}
                    presetJSONataXMLQuery={presetJSONata_XML}
                    presetJSONataJSONQuery={presetJSONata_JSON}
                    presetJSONataCSVQuery={presetJSONata_CSV}
                    presetJSONataUnknownFileTypeQuery={presetJSONata_UnknownQuery}
                />
            ),
        [data]
    );
    const reviewPanel = useMemo(() => <ReviewPanel data={intermediaryData} defaultQuery={defaultReviewQuery} />, [
        intermediaryData,
    ]);
    const importPanel = useMemo(() => <ImportPanel data={intermediaryData} />, [intermediaryData]);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permissions_Permission_Enum.ConferenceManageAttendees]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Box mb="auto" w="100%" minH="100vh">
                <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                    Manage {conference.shortName}
                </Heading>
                <Heading as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                    Import Registrants
                </Heading>
                <LinkButton to={`/conference/${conference.slug}/manage/registrants`} colorScheme="red">
                    Go to Manage Registrants
                </LinkButton>
                <Tabs defaultIndex={0} w="100%" mt={4}>
                    <TabList>
                        <Tab>Data</Tab>
                        <Tab isDisabled={!data || data.length === 0}>Configure</Tab>
                        <Tab isDisabled={!data || data.length === 0}>Review</Tab>
                        <Tab isDisabled={!data || data.length === 0}>Import</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>{dataPanel}</TabPanel>
                        <TabPanel>{configPanel}</TabPanel>
                        <TabPanel>{reviewPanel}</TabPanel>
                        <TabPanel>{importPanel}</TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>
        </RequireAtLeastOnePermissionWrapper>
    );
}
