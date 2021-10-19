import { Heading, Link, Text } from "@chakra-ui/react";
import React from "react";
import { Permissions_Permission_Enum } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import { Breadcrumbs } from "../Breadcrumbs";

export function YouTubeExport(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Export to YouTube from ${conference.shortName}`);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permissions_Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            {title}
            <Breadcrumbs />
            <Heading mt={4} as="h1" fontSize="4xl">
                Manage {conference.shortName}
            </Heading>
            <Heading id="page-heading" as="h2" fontSize="2xl" fontStyle="italic">
                Upload to YouTube
            </Heading>
            <Text>
                By using this &ldquo;Export to YouTube&rdquo; feature of Midspace, you agree to{" "}
                <Link isExternal href="https://www.youtube.com/t/terms">
                    YouTube&apos;s Terms of Service
                </Link>
                .
            </Text>
        </RequireAtLeastOnePermissionWrapper>
    );
}
