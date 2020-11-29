import { Flex, Heading, Text } from "@chakra-ui/react";
import React from "react";
import { Permission_Enum } from "../../../generated/graphql";
import LinkButton from "../../Chakra/LinkButton";
import FAIcon from "../../Icons/FAIcon";
import {
    useNoPrimaryMenuButtons,
    usePrimaryMenuButton,
} from "../../Menu/usePrimaryMenuButtons";
import RequireAtLeastOnePermissionWrapper from "../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../useConference";

function ManagementDashboardButton({
    to,
    name,
    icon,
    description,
    permissions,
}: {
    to: string;
    name: string;
    icon: string;
    description: string;
    permissions: Permission_Enum[];
}): JSX.Element | null {
    const conference = useConference();

    return (
        <RequireAtLeastOnePermissionWrapper permissions={permissions}>
            <LinkButton
                to={`/conference/${conference.slug}/manage/${to}`}
                padding={5}
                overflow="hidden"
                whiteSpace="normal"
                linkProps={{
                    maxWidth: "calc(20% - 1rem)",
                    minWidth: "300px",
                }}
            >
                <Heading as="h2" fontSize="1.5rem" marginBottom="0.5rem">
                    <FAIcon iconStyle="s" icon={icon} />
                    <br />
                    {name}
                </Heading>
                <Text>{description}</Text>
            </LinkButton>
        </RequireAtLeastOnePermissionWrapper>
    );
}

export default function ManagerLandingPage(): JSX.Element {
    const conference = useConference();

    useNoPrimaryMenuButtons();
    usePrimaryMenuButton({
        key: `view-conference-${conference.slug}`,
        action: `/conference/${conference.slug}`,
        label: "View conference",
        text: "View conference",
    });

    return (
        <>
            <Heading as="h1">Manage {conference.shortName}</Heading>
            <Flex
                flexDirection="row"
                flexWrap="wrap"
                gridGap={["0.3rem", "0.3rem", "1rem"]}
                alignItems="stretch"
                justifyContent="center"
            >
                <ManagementDashboardButton
                    to="name"
                    name="Name"
                    icon="signature"
                    description="Manage the name, short name and url of your conference."
                    permissions={[Permission_Enum.ConferenceManageName]}
                />
                <ManagementDashboardButton
                    to="roles"
                    name="Roles"
                    icon="lock"
                    description="Manage the roles people at your conference can take on."
                    permissions={[Permission_Enum.ConferenceManageRoles]}
                />
                <ManagementDashboardButton
                    to="groups"
                    name="Groups"
                    icon="user-cog"
                    description="Manage the groups of people at your conference and the times they can access the conference."
                    permissions={[
                        Permission_Enum.ConferenceManageRoles,
                        Permission_Enum.ConferenceManageGroups,
                    ]}
                />
                <ManagementDashboardButton
                    to="people"
                    name="People"
                    icon="users"
                    description="Manage the people at your conference: attendees, moderators, authors, presenters, organisers and more."
                    permissions={[
                        Permission_Enum.ConferenceManageRoles,
                        Permission_Enum.ConferenceManageGroups,
                        Permission_Enum.ConferenceManageAttendees,
                    ]}
                />
            </Flex>
        </>
    );
}
