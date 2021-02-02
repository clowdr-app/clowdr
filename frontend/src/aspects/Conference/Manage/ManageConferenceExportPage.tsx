import { gql } from "@apollo/client";
import { Button, Heading, List, ListItem, Tab, TabList, TabPanel, TabPanels, Tabs, useToast } from "@chakra-ui/react";
import React from "react";
import {
    ManageConferenceExportPage_AttendeeGoogleAccountFragment,
    Permission_Enum,
    useManageConferenceExportPage_GetAttendeeGoogleAccountsQuery,
    useManageConferenceExportPage_GetGoogleOAuthUrlMutation,
} from "../../../generated/graphql";
import PageNotFound from "../../Errors/PageNotFound";
import ApolloQueryWrapper from "../../GQL/ApolloQueryWrapper";
import FAIcon from "../../Icons/FAIcon";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import useCurrentAttendee from "../useCurrentAttendee";
import { UploadYouTubeVideos } from "./Export/UploadYouTubeVideos";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

gql`
    mutation ManageConferenceExportPage_GetGoogleOAuthUrl($scopes: [String!]!) {
        getGoogleOAuthUrl(scopes: $scopes) {
            url
        }
    }

    query ManageConferenceExportPage_GetAttendeeGoogleAccounts($attendeeId: uuid!) {
        AttendeeGoogleAccount(where: { attendeeId: { _eq: $attendeeId } }) {
            ...ManageConferenceExportPage_AttendeeGoogleAccount
        }
    }

    fragment ManageConferenceExportPage_AttendeeGoogleAccount on AttendeeGoogleAccount {
        id
        googleAccountEmail
    }
`;

export default function ManageConferenceExportPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Export data from ${conference.shortName}`);

    useDashboardPrimaryMenuButtons();

    const toast = useToast();

    const [mutation] = useManageConferenceExportPage_GetGoogleOAuthUrlMutation();

    const attendee = useCurrentAttendee();
    const result = useManageConferenceExportPage_GetAttendeeGoogleAccountsQuery({
        variables: {
            attendeeId: attendee?.id,
        },
    });

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Heading as="h1" fontSize="4xl">
                Manage {conference.shortName}
            </Heading>
            <Heading as="h2" fontSize="2xl" fontStyle="italic">
                Exports
            </Heading>
            <Tabs width="100%">
                <TabList>
                    <Tab>Connected YouTube accounts</Tab>
                    <Tab>Upload videos to YouTube</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        <Heading as="h3" size="md" textAlign="left" mb={2}>
                            Connected accounts
                        </Heading>
                        <ApolloQueryWrapper getter={(data) => data.AttendeeGoogleAccount} queryResult={result}>
                            {(accounts: readonly ManageConferenceExportPage_AttendeeGoogleAccountFragment[]) => (
                                <List>
                                    {accounts.map((account) => (
                                        <ListItem key={account.id}>{account.googleAccountEmail}</ListItem>
                                    ))}
                                </List>
                            )}
                        </ApolloQueryWrapper>
                        <Button
                            onClick={async () => {
                                try {
                                    const urlResult = await mutation({
                                        variables: {
                                            scopes: [
                                                "https://www.googleapis.com/auth/youtube.upload",
                                                "https://www.googleapis.com/auth/youtube.readonly",
                                            ],
                                        },
                                    });

                                    if (!urlResult.data?.getGoogleOAuthUrl) {
                                        throw new Error("Could not retrieve Google OAuth URL");
                                    }

                                    window.location.href = urlResult.data?.getGoogleOAuthUrl?.url;
                                } catch (e) {
                                    console.error("Failed to connect to YouTube", e);
                                    toast({
                                        title: "Failed to connect to YouTube",
                                        status: "error",
                                    });
                                }
                            }}
                            mt={2}
                        >
                            <FAIcon icon="plus" iconStyle="s" mr={2} />
                            Connect to YouTube
                        </Button>
                    </TabPanel>
                    <TabPanel>
                        <UploadYouTubeVideos />
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </RequireAtLeastOnePermissionWrapper>
    );
}
