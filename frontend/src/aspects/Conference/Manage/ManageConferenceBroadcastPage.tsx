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
} from "@chakra-ui/react";
import React from "react";
import { Permission_Enum, useCreateConferencePrepareJobMutation } from "../../../generated/graphql";
import PageNotFound from "../../Errors/PageNotFound";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import { BroadcastRooms } from "./Broadcast/BroadcastRooms";
import { ConferenceConfiguration } from "./Broadcast/ConferenceConfiguration";
import { EventVonageControls } from "./Broadcast/EventVonageControls";
import { PrepareJobsList } from "./Broadcast/PrepareJobsList";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

export default function ManageConferenceBroadcastPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage broadcasts at ${conference.shortName}`);

    useDashboardPrimaryMenuButtons();
    const [create, { loading, error }] = useCreateConferencePrepareJobMutation();
    useQueryErrorToast(error, false);
    const toast = useToast();

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" fontSize="1.7rem" lineHeight="2.4rem" fontStyle="italic">
                Broadcasts
            </Heading>
            <Tabs>
                <TabList>
                    <Tab>Configuration</Tab>
                    <Tab>Prepare broadcasts</Tab>
                    <Tab>RTMP broadcast recovery</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        <ConferenceConfiguration conferenceId={conference.id} />
                    </TabPanel>
                    <TabPanel>
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
                    </TabPanel>
                    <TabPanel>
                        <EventVonageControls conferenceId={conference.id} />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </RequireAtLeastOnePermissionWrapper>
    );
}
