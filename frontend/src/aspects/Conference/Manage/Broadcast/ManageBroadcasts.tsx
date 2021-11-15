import { Heading, Tab, TabList, TabPanel, TabPanels, Tabs } from "@chakra-ui/react";
import React from "react";
import PageNotFound from "../../../Errors/PageNotFound";
import { useTitle } from "../../../Utils/useTitle";
import RequireRole from "../../RequireRole";
import { useConference } from "../../useConference";
import { BroadcastRooms } from "./BroadcastRooms";
import { Configuration as ConferenceConfiguration } from "./ConferenceConfiguration";
import { EventVonageControls } from "./EventVonageControls";
import LivestreamMonitoring from "./LivestreamMonitoring";
import { PrepareJobsList } from "./PrepareJobsList";

export default function ManageBroadcast(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage broadcasts at ${conference.shortName}`);

    return (
        <RequireRole organizerRole componentIfDenied={<PageNotFound />}>
            {title}
            <Heading mt={4} as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" id="page-heading" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Broadcasts
            </Heading>
            <Tabs isLazy w="100%">
                <TabList>
                    <Tab>Monitor streams</Tab>
                    <Tab>Configuration</Tab>
                    <Tab>Prepare broadcasts</Tab>
                    <Tab>Rooms</Tab>
                    <Tab>RTMP broadcast recovery</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        <LivestreamMonitoring />
                    </TabPanel>
                    <TabPanel>
                        <ConferenceConfiguration conferenceId={conference.id} />
                    </TabPanel>
                    <TabPanel>
                        <PrepareJobsList conferenceId={conference.id} />
                    </TabPanel>
                    <TabPanel>
                        <BroadcastRooms conferenceId={conference.id} />
                    </TabPanel>
                    <TabPanel>
                        <EventVonageControls conferenceId={conference.id} />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </RequireRole>
    );
}
