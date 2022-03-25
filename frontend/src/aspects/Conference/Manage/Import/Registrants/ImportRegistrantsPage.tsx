import { Box, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import type { IntermediaryRegistrantData } from "@midspace/shared-types/import/registrant";
import { JSONataToIntermediaryRegistrant } from "@midspace/shared-types/import/registrant";
import React, { useMemo, useState } from "react";
import PageNotFound from "../../../../Errors/PageNotFound";
import type { ParsedData } from "../../../../Files/useCSVJSONXMLParser";
import RequireRole from "../../../RequireRole";
import { DashboardPage } from "../../DashboardPage";
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
[$[$trim(Name) != ""].{
    "name": $exists(name) ? $trim(name) : $trim(Name),
    "email": $exists(email) ? $trim(email) : $trim(Email),
    "group": $exists(group) and $trim(group) != "" ? $trim(group) : $exists(Group) and $trim(Group) != "" ? $trim(Group) : undefined,
    "subconference": $exists(subconference) and $trim(subconference) != "" ? $trim(subconference) : $exists(Subconference) and $trim(Subconference) != "" ? $trim(Subconference) : undefined
}]
`;

const presetJSONata_JSON = `
[$[$trim(Name) != ""].{
    "name": $exists(name) ? $trim(name) : $trim(Name),
    "email": $exists(email) ? $trim(email) : $trim(Email),
    "group": $exists(group) and $trim(group) != "" ? $trim(group) : $exists(Group) and $trim(Group) != "" ? $trim(Group) : undefined
    "subconference": $exists(subconference) and $trim(subconference) != "" ? $trim(subconference) : $exists(Subconference) and $trim(Subconference) != "" ? $trim(Subconference) : undefined
}]
`;

const presetJSONata_CSV = `
[$[$trim(Name) != ""].{
    "name": $exists(name) ? $trim(name) : $trim(Name),
    "email": $exists(email) ? $trim(email) : $trim(Email),
    "group": $exists(group) and $trim(group) != "" ? $trim(group) : $exists(Group) and $trim(Group) != "" ? $trim(Group) : undefined
    "subconference": $exists(subconference) and $trim(subconference) != "" ? $trim(subconference) : $exists(Subconference) and $trim(Subconference) != "" ? $trim(Subconference) : undefined
}]
`;

export default function ImportRegistrantsPage(): JSX.Element {
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
    const reviewPanel = useMemo(
        () => <ReviewPanel data={intermediaryData} defaultQuery={defaultReviewQuery} />,
        [intermediaryData]
    );
    const importPanel = useMemo(() => <ImportPanel data={intermediaryData} />, [intermediaryData]);

    return (
        <RequireRole organizerRole componentIfDenied={<PageNotFound />}>
            <DashboardPage title="Import Registrants" stickyHeader={false} autoOverflow={false}>
                <Box mb="auto" w="100%" minH="100vh">
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
            </DashboardPage>
        </RequireRole>
    );
}
