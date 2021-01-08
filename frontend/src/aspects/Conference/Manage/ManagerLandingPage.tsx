import { Flex, Heading } from "@chakra-ui/react";
import React, { useEffect } from "react";
import { Permission_Enum } from "../../../generated/graphql";
import usePrimaryMenuButtons from "../../Menu/usePrimaryMenuButtons";
import { useTitle } from "../../Utils/useTitle";
import { useConference } from "../useConference";
import RestrictedDashboardButton from "./RestrictedDashboardButton";

export default function ManagerLandingPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage ${conference.shortName}`);

    const { setPrimaryMenuButtons } = usePrimaryMenuButtons();
    useEffect(() => {
        setPrimaryMenuButtons([
            {
                key: `view-conference-${conference.slug}`,
                action: `/conference/${conference.slug}`,
                label: "View conference",
                text: "View conference",
            },
        ]);
    }, [conference.slug, setPrimaryMenuButtons]);

    return (
        <>
            {title}
            <Heading as="h1">Manage {conference.shortName}</Heading>
            <Flex
                flexDirection="row"
                flexWrap="wrap"
                gridGap={["0.3rem", "0.3rem", "1rem"]}
                alignItems="stretch"
                justifyContent="center"
            >
                <RestrictedDashboardButton
                    to="name"
                    name="Name"
                    icon="signature"
                    description="Manage the name, short name and url of your conference."
                    permissions={[Permission_Enum.ConferenceManageName]}
                />
                <RestrictedDashboardButton
                    to="roles"
                    name="Roles"
                    icon="lock"
                    description="Manage the roles people at your conference can take on."
                    permissions={[Permission_Enum.ConferenceManageRoles]}
                    colorScheme="red"
                />
                <RestrictedDashboardButton
                    to="groups"
                    name="Groups"
                    icon="user-cog"
                    description="Manage the groups of people at your conference and the times they can access the conference."
                    permissions={[Permission_Enum.ConferenceManageRoles, Permission_Enum.ConferenceManageGroups]}
                    colorScheme="red"
                />
                <RestrictedDashboardButton
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
                <RestrictedDashboardButton
                    to="content"
                    name="Content"
                    icon="align-left"
                    description="Manage your program content: papers, posters, keynotes, etc."
                    permissions={[Permission_Enum.ConferenceManageContent]}
                    colorScheme="green"
                />
                <RestrictedDashboardButton
                    to="schedule"
                    name="Schedule"
                    icon="calendar"
                    description="Manage your program schedule: events, sessions, rooms, etc."
                    permissions={[Permission_Enum.ConferenceManageSchedule]}
                    colorScheme="green"
                />
                <RestrictedDashboardButton
                    to="import"
                    name="Import"
                    icon="download"
                    description="Import your content and schedule from Researchr or CSV, XML or JSON files."
                    permissions={[Permission_Enum.ConferenceManageContent, Permission_Enum.ConferenceManageSchedule]}
                    colorScheme="green"
                />
                <RestrictedDashboardButton
                    to="export"
                    name="Export"
                    icon="upload"
                    description="Export your conference data (events, public chats, analytics, etc)."
                    permissions={[Permission_Enum.ConferenceManageContent]}
                    colorScheme="green"
                />
                <RestrictedDashboardButton
                    to="sponsors"
                    name="Sponsors"
                    icon="star"
                    description="Manage your sponsors and their representatives."
                    permissions={[
                        Permission_Enum.ConferenceManageContent, // TODO: Manage sponsors permission
                    ]}
                    colorScheme="purple"
                />
                <RestrictedDashboardButton
                    to="chats"
                    name="Chats"
                    icon="comments"
                    description="Manage the conversations happening at your conference."
                    permissions={[
                        Permission_Enum.ConferenceManageContent, // TODO: Manage chats permission
                    ]}
                    colorScheme="yellow"
                />
                <RestrictedDashboardButton
                    to="rooms"
                    name="Rooms"
                    icon="coffee"
                    description="Manage the breakout rooms happening at your conference."
                    permissions={[
                        Permission_Enum.ConferenceManageContent, // TODO: Manage rooms permission
                    ]}
                    colorScheme="yellow"
                />
                <RestrictedDashboardButton
                    to="broadcasts"
                    name="Broadcasts"
                    icon="video"
                    description="Manage your livestreams and broadcasts, including post-conference archiving."
                    permissions={[
                        Permission_Enum.ConferenceManageContent, // TODO: Manage broadcasts permission
                    ]}
                    colorScheme="yellow"
                />
                <RestrictedDashboardButton
                    to="analytics"
                    name="Analytics"
                    icon="chart-line"
                    description="View live and historic data about (anonymous) activity at your conference."
                    permissions={[
                        Permission_Enum.ConferenceManageContent, // TODO: View analytics permission
                    ]}
                    colorScheme="yellow"
                />
                <RestrictedDashboardButton
                    to="support"
                    name="Support"
                    icon="question-circle"
                    description="Learn about how to use Clowdr's management tools and best practices."
                />
            </Flex>
        </>
    );
}
