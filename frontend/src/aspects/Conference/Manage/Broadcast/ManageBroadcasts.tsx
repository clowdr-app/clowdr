import {
    Box,
    Button,
    Heading,
    Spinner,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    useToast,
    VStack,
} from "@chakra-ui/react";
import React from "react";
import { useCreateConferencePrepareJobMutation } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
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

    const [{ loading, error }, create] = useCreateConferencePrepareJobMutation();
    useQueryErrorToast(error, false);
    const toast = useToast();

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
                        <VStack>
                            <Button
                                mt={5}
                                aria-label="Prepare broadcasts"
                                onClick={async () => {
                                    await create({
                                        variables: {
                                            conferenceId: conference.id,
                                        },
                                    });
                                    toast({
                                        status: "success",
                                        description: "Started preparing broadcasts.",
                                    });
                                }}
                            >
                                Prepare broadcasts
                            </Button>
                            {loading ? (
                                <Spinner />
                            ) : error ? (
                                <Text mt={3}>Failed to start broadcast preparation.</Text>
                            ) : (
                                <></>
                            )}
                            <Box mt={5}>
                                <PrepareJobsList conferenceId={conference.id} />
                            </Box>
                            <Box mt={5}>
                                <BroadcastRooms conferenceId={conference.id} />
                            </Box>
                        </VStack>
                    </TabPanel>
                    <TabPanel>
                        <EventVonageControls conferenceId={conference.id} />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </RequireRole>
    );
}
