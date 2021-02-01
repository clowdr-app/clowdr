import { gql } from "@apollo/client";
import { Button, Heading, Tab, TabList, TabPanel, TabPanels, Tabs, useToast } from "@chakra-ui/react";
import React from "react";
import { Permission_Enum, useManageConferenceExportPage_GetGoogleOAuthUrlMutation } from "../../../generated/graphql";
import PageNotFound from "../../Errors/PageNotFound";
import { useTitle } from "../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

gql`
    mutation ManageConferenceExportPage_GetGoogleOAuthUrl($scopes: [String!]!) {
        getGoogleOAuthUrl(scopes: $scopes) {
            url
        }
    }
`;

export default function ManageConferenceExportPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Export data from ${conference.shortName}`);

    useDashboardPrimaryMenuButtons();

    const toast = useToast();

    const [mutation] = useManageConferenceExportPage_GetGoogleOAuthUrlMutation();

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
                    <Tab>Export videos to YouTube</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        <Button
                            onClick={async () => {
                                try {
                                    const urlResult = await mutation({
                                        variables: {
                                            scopes: ["https://www.googleapis.com/auth/youtube.upload"],
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
                        >
                            Connect to YouTube
                        </Button>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </RequireAtLeastOnePermissionWrapper>
    );
}
