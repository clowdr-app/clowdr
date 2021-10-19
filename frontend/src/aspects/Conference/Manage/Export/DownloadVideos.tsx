import { Text } from "@chakra-ui/react";
import React from "react";
import { Permissions_Permission_Enum } from "../../../../generated/graphql";
import PageNotFound from "../../../Errors/PageNotFound";
import { useTitle } from "../../../Utils/useTitle";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import { DashboardPage } from "../DashboardPage";

export function DownloadVideos(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Download videos from ${conference.shortName}`);

    return (
        <RequireAtLeastOnePermissionWrapper
            permissions={[Permissions_Permission_Enum.ConferenceManageContent]}
            componentIfDenied={<PageNotFound />}
        >
            <DashboardPage title="Download videos">
                {title}
                <Text>foo</Text>
            </DashboardPage>
        </RequireAtLeastOnePermissionWrapper>
    );
}
