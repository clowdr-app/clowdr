import { Box, Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import type { IntermediaryRegistrantData } from "@midspace/shared-types/import/intermediary";
import { JSONataToIntermediaryRegistrant } from "@midspace/shared-types/import/intermediary";
import React, { useMemo, useState } from "react";
import { LinkButton } from "../../../../Chakra/LinkButton";
import PageNotFound from "../../../../Errors/PageNotFound";
import type { ParsedData } from "../../../../Files/useCSVJSONXMLParser";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { useTitle } from "../../../../Hooks/useTitle";
import RequireRole from "../../../RequireRole";
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
[$[$trim(Name) != ""].{
    "name": $exists(name) ? $trim(name) : $trim(Name),
    "email": $exists(email) ? $trim(email) : $trim(Email),
    "group": $exists(group) and $trim(group) != "" ? $trim(group) : $exists(Group) and $trim(Group) != "" ? $trim(Group) : undefined
}]
`;

const presetJSONata_JSON = `
[$[$trim(Name) != ""].{
    "name": $exists(name) ? $trim(name) : $trim(Name),
    "email": $exists(email) ? $trim(email) : $trim(Email),
    "group": $exists(group) and $trim(group) != "" ? $trim(group) : $exists(Group) and $trim(Group) != "" ? $trim(Group) : undefined
}]
`;

const presetJSONata_CSV = `
[$[$trim(Name) != ""].{
    "name": $exists(name) ? $trim(name) : $trim(Name),
    "email": $exists(email) ? $trim(email) : $trim(Email),
    "group": $exists(group) and $trim(group) != "" ? $trim(group) : $exists(Group) and $trim(Group) != "" ? $trim(Group) : undefined
}]
`;

export default function ImportRegistrantsPage(): JSX.Element {
    const conference = useConference();
    const { conferencePath } = useAuthParameters();
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
    const reviewPanel = useMemo(
        () => <ReviewPanel data={intermediaryData} defaultQuery={defaultReviewQuery} />,
        [intermediaryData]
    );
    const importPanel = useMemo(() => <ImportPanel data={intermediaryData} />, [intermediaryData]);

    return (
        <RequireRole organizerRole componentIfDenied={<PageNotFound />}>
            {title}
            <Box mb="auto" w="100%" minH="100vh">
                <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                    Manage {conference.shortName}
                </Heading>
                <Heading id="page-heading" as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                    Import Registrants
                </Heading>
                <LinkButton to={`${conferencePath}/manage/registrants`} colorScheme="red">
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
        </RequireRole>
    );
}
