import { Flex, Heading, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import { Permission_Enum } from "../../../generated/graphql";
import { useTitle } from "../../Utils/useTitle";
import { useConference } from "../useConference";
import RestrictedDashboardButton from "./RestrictedDashboardButton";

export default function ManagerLandingPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage ${conference.shortName}`);

    const green = useColorModeValue("green.500", "green.200");
    const red = useColorModeValue("red.500", "red.200");

    const greenHover = useColorModeValue("green.600", "green.300");
    const redHover = useColorModeValue("red.600", "red.300");
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
                maxW={1100}
            >
                <RestrictedDashboardButton
                    to="import"
                    name="Import"
                    icon="download"
                    description="Import your content, schedule and registrants."
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
                    to="content"
                    name="Content"
                    icon="align-left"
                    description="Manage your program content: papers, posters, keynotes, etc."
                    permissions={[Permission_Enum.ConferenceManageContent]}
                    colorScheme="green"
                />
                <RestrictedDashboardButton
                    to="rooms"
                    name="Rooms"
                    icon="coffee"
                    description="Manage and prioritise rooms."
                    permissions={[
                        Permission_Enum.ConferenceManageContent, // TODO: Manage rooms permission
                    ]}
                    colorScheme="green"
                />
                <RestrictedDashboardButton
                    to="schedule"
                    name="Schedule"
                    icon="calendar"
                    description="Manage your program schedule: your events."
                    permissions={[Permission_Enum.ConferenceManageSchedule]}
                    colorScheme="green"
                />
                <RestrictedDashboardButton
                    to="people"
                    name="Program People"
                    icon="people-arrows"
                    description="Manage people listed in your program (authors, speakers, etc) and their links to registrants."
                    permissions={[Permission_Enum.ConferenceManageContent, Permission_Enum.ConferenceManageSchedule]}
                    colorScheme="green"
                    bgGradient={`linear(${green} 20%, ${red} 80%)`}
                    _hover={{
                        bgGradient: `linear(${greenHover} 20%, ${redHover} 80%)`,
                    }}
                />
                <RestrictedDashboardButton
                    to="roles"
                    name="Permissions"
                    icon="lock"
                    description="Manage sets of permissions that can be assigned to groups."
                    permissions={[Permission_Enum.ConferenceManageRoles]}
                    colorScheme="red"
                />
                <RestrictedDashboardButton
                    to="groups"
                    name="Groups"
                    icon="user-cog"
                    description="Manage groups of registrants."
                    permissions={[Permission_Enum.ConferenceManageRoles, Permission_Enum.ConferenceManageGroups]}
                    colorScheme="red"
                />
                <RestrictedDashboardButton
                    to="registrants"
                    name="Registrants"
                    icon="users"
                    description="Manage who can log in and access your conference, e.g. attendees, presenters and speakers."
                    permissions={[
                        Permission_Enum.ConferenceManageRoles,
                        Permission_Enum.ConferenceManageGroups,
                        Permission_Enum.ConferenceManageAttendees,
                    ]}
                    colorScheme="red"
                />
                <RestrictedDashboardButton
                    to="sponsors"
                    name="Sponsors"
                    icon="star"
                    description="Manage your sponsors, their booths and representatives."
                    permissions={[
                        Permission_Enum.ConferenceManageContent, // TODO: Manage sponsors permission
                    ]}
                    colorScheme="purple"
                />
                {/* <RestrictedDashboardButton
                    to="chats"
                    name="Chats"
                    icon="comments"
                    description="Manage and moderate conversations."
                    permissions={[
                        Permission_Enum.ConferenceManageContent, // TODO: Manage chats permission
                    ]}
                    colorScheme="yellow"
                /> */}
                <RestrictedDashboardButton
                    to="shuffle"
                    name="Shuffle"
                    icon="random"
                    description="Manage randomised, time-limited networking, aka. shuffle periods."
                    permissions={[Permission_Enum.ConferenceManageShuffle]}
                    colorScheme="yellow"
                />
                <RestrictedDashboardButton
                    to="email"
                    name="Email"
                    icon="envelope-open-text"
                    description="Manage templates for submission requests, invitations, etc."
                    permissions={[Permission_Enum.ConferenceManageContent]}
                    colorScheme="blue"
                />
                <RestrictedDashboardButton
                    to="name"
                    name="Name"
                    icon="signature"
                    description="Manage name, short name and url."
                    permissions={[Permission_Enum.ConferenceManageName]}
                    colorScheme="gray"
                />
                <RestrictedDashboardButton
                    to="broadcasts"
                    name="Broadcasts"
                    icon="video"
                    description="Manage your livestreams and broadcasts, including post-conference archiving."
                    permissions={[
                        Permission_Enum.ConferenceManageContent, // TODO: Manage broadcasts permission
                    ]}
                    colorScheme="gray"
                />
                {/* <RestrictedDashboardButton
                    to="analytics"
                    name="Analytics"
                    icon="chart-line"
                    description="View live and historic data about activity at your conference."
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
                /> */}
            </Flex>
        </>
    );
}
