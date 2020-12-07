import { Flex, Heading, Text, useColorModeValue } from "@chakra-ui/react";
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
    colorScheme
}: {
    to: string;
    name: string;
    icon: string;
    description: string;
    permissions?: Permission_Enum[];
    colorScheme?: string;
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
                colorScheme={colorScheme ?? "blue"}
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
                    colorScheme="red"
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
                    colorScheme="red"
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
                    colorScheme="red"
                />
                <ManagementDashboardButton
                    to="content"
                    name="Content"
                    icon="align-left"
                    description="Manage your program content: papers, posters, keynotes, etc."
                    permissions={[
                        Permission_Enum.ConferenceManageContent
                    ]}
                    colorScheme="green"
                />
                <ManagementDashboardButton
                    to="schedule"
                    name="Schedule"
                    icon="calendar"
                    description="Manage your program schedule: events, sessions, rooms, etc."
                    permissions={[
                        Permission_Enum.ConferenceManageSchedule
                    ]}
                    colorScheme="green"
                />
                <ManagementDashboardButton
                    to="import"
                    name="Import"
                    icon="download"
                    description="Import your content and schedule from Researchr or CSV, XML or JSON files."
                    permissions={[
                        Permission_Enum.ConferenceManageContent,
                        Permission_Enum.ConferenceManageSchedule
                    ]}
                    colorScheme="green"
                />
                <ManagementDashboardButton
                    to="export"
                    name="Export"
                    icon="upload"
                    description="Export your conference data (events, public chats, analytics, etc)."
                    permissions={[
                        Permission_Enum.ConferenceManageContent
                    ]}
                    colorScheme="green"
                />
                <ManagementDashboardButton
                    to="sponsors"
                    name="Sponsors"
                    icon="star"
                    description="Manage your sponsors and their representatives."
                    permissions={[
                        Permission_Enum.ConferenceManageContent // TODO: Manage chats sponsors
                    ]}
                    colorScheme="purple"
                />
                <ManagementDashboardButton
                    to="chats"
                    name="Chats"
                    icon="comments"
                    description="Manage the conversations happening at your conference."
                    permissions={[
                        Permission_Enum.ConferenceManageContent // TODO: Manage chats permission
                    ]}
                    colorScheme="yellow"
                />
                <ManagementDashboardButton
                    to="rooms"
                    name="Rooms"
                    icon="coffee"
                    description="Manage the breakout rooms happening at your conference."
                    permissions={[
                        Permission_Enum.ConferenceManageContent // TODO: Manage rooms permission
                    ]}
                    colorScheme="yellow"
                />
                <ManagementDashboardButton
                    to="broadcasts"
                    name="Broadcasts"
                    icon="video"
                    description="Manage your livestreams and broadcasts, including post-conference archiving."
                    permissions={[
                        Permission_Enum.ConferenceManageContent // TODO: Manage broadcasts permission
                    ]}
                    colorScheme="yellow"
                />
                <ManagementDashboardButton
                    to="analytics"
                    name="Analytics"
                    icon="chart-line"
                    description="View live and historic data about (anonymous) activity at your conference."
                    permissions={[
                        Permission_Enum.ConferenceManageContent // TODO: View analytics permission
                    ]}
                    colorScheme="yellow"
                />
                <ManagementDashboardButton
                    to="support"
                    name="Support"
                    icon="question-circle"
                    description="Learn about how to use Clowdr's management tools and best practices."
                />
            </Flex>
        </>
    );
}
