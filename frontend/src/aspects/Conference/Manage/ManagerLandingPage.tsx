import { Flex, Heading, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import { Permissions_Permission_Enum } from "../../../generated/graphql";
import { useTitle } from "../../Utils/useTitle";
import { useConference } from "../useConference";
import RestrictedDashboardButton from "./RestrictedDashboardButton";

export default function ManagerLandingPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage ${conference.shortName}`);

    const green = useColorModeValue("purple.500", "purple.200");
    const red = useColorModeValue("blue.500", "blue.200");

    const greenHover = useColorModeValue("purple.600", "purple.300");
    const redHover = useColorModeValue("blue.600", "blue.300");

    const greenFocus = useColorModeValue("purple.700", "purple.400");
    const redFocus = useColorModeValue("blue.700", "blue.400");
    return (
        <>
            {title}
            <Heading as="h1" id="page-heading">
                Manage {conference.shortName}
            </Heading>
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
                    permissions={[
                        Permissions_Permission_Enum.ConferenceManageContent,
                        Permissions_Permission_Enum.ConferenceManageSchedule,
                    ]}
                    colorScheme="purple"
                />
                <RestrictedDashboardButton
                    to="export"
                    name="Export"
                    icon="upload"
                    description="Export your conference data (events, public chats, analytics, etc)."
                    permissions={[Permissions_Permission_Enum.ConferenceManageContent]}
                    colorScheme="purple"
                />
                <RestrictedDashboardButton
                    to="content"
                    name="Content"
                    icon="align-left"
                    description="Manage your program content: papers, posters, keynotes, etc."
                    permissions={[Permissions_Permission_Enum.ConferenceManageContent]}
                    colorScheme="purple"
                />
                <RestrictedDashboardButton
                    to="rooms"
                    name="Rooms"
                    icon="coffee"
                    description="Manage and prioritise rooms."
                    permissions={[
                        Permissions_Permission_Enum.ConferenceManageContent, // TODO: Manage rooms permission
                    ]}
                    colorScheme="purple"
                />
                <RestrictedDashboardButton
                    to="schedule"
                    name="Schedule"
                    icon="calendar"
                    description="Manage your program schedule: your events."
                    permissions={[Permissions_Permission_Enum.ConferenceManageSchedule]}
                    colorScheme="purple"
                />
                <RestrictedDashboardButton
                    to="people"
                    name="Program People"
                    icon="people-arrows"
                    description="Manage people listed in your program (authors, speakers, etc) and their links to registrants."
                    permissions={[
                        Permissions_Permission_Enum.ConferenceManageContent,
                        Permissions_Permission_Enum.ConferenceManageSchedule,
                    ]}
                    colorScheme="purple"
                    bgGradient={`linear(${green} 20%, ${red} 80%)`}
                    _hover={{
                        bgGradient: `linear(${greenHover} 20%, ${redHover} 80%)`,
                    }}
                    _focus={{
                        bgGradient: `linear(${greenFocus} 20%, ${redFocus} 80%)`,
                    }}
                    _active={{
                        bgGradient: `linear(${greenFocus} 20%, ${redFocus} 80%)`,
                    }}
                />
                <RestrictedDashboardButton
                    to="roles"
                    name="Permissions"
                    icon="lock"
                    description="Manage sets of permissions that can be assigned to groups."
                    permissions={[Permissions_Permission_Enum.ConferenceManageRoles]}
                    colorScheme="blue"
                />
                <RestrictedDashboardButton
                    to="groups"
                    name="Groups"
                    icon="user-cog"
                    description="Manage groups of registrants."
                    permissions={[
                        Permissions_Permission_Enum.ConferenceManageRoles,
                        Permissions_Permission_Enum.ConferenceManageGroups,
                    ]}
                    colorScheme="blue"
                />
                <RestrictedDashboardButton
                    to="registrants"
                    name="Registrants"
                    icon="users"
                    description="Manage who can log in and access your conference, e.g. registrants, presenters and speakers."
                    permissions={[
                        Permissions_Permission_Enum.ConferenceManageRoles,
                        Permissions_Permission_Enum.ConferenceManageGroups,
                        Permissions_Permission_Enum.ConferenceManageAttendees,
                    ]}
                    colorScheme="blue"
                />
                <RestrictedDashboardButton
                    to="sponsors"
                    name="Sponsors"
                    icon="star"
                    description="Manage your sponsors, their booths and representatives."
                    permissions={[
                        Permissions_Permission_Enum.ConferenceManageContent, // TODO: Manage sponsors permission
                    ]}
                    colorScheme="yellow"
                />
                {/* <RestrictedDashboardButton
                    to="chats"
                    name="Chats"
                    icon="comments"
                    description="Manage and moderate conversations."
                    permissions={[
                        Permissions_Permission_Enum.ConferenceManageContent, // TODO: Manage chats permission
                    ]}
                    colorScheme="yellow"
                /> */}
                <RestrictedDashboardButton
                    to="shuffle"
                    name="Shuffle"
                    icon="random"
                    description="Manage randomised, time-limited networking, aka. shuffle periods."
                    permissions={[Permissions_Permission_Enum.ConferenceManageShuffle]}
                    colorScheme="purple"
                />
                <RestrictedDashboardButton
                    to="email"
                    name="Email"
                    icon="envelope-open-text"
                    description="Manage templates for submission requests, invitations, etc."
                    permissions={[Permissions_Permission_Enum.ConferenceManageContent]}
                    colorScheme="gray"
                />
                <RestrictedDashboardButton
                    to="name"
                    name="Name"
                    icon="signature"
                    description="Manage name, short name and url."
                    permissions={[Permissions_Permission_Enum.ConferenceManageName]}
                    colorScheme="gray"
                />
                <RestrictedDashboardButton
                    to="broadcasts"
                    name="Broadcasts"
                    icon="video"
                    description="Manage your livestreams and broadcasts, including post-conference archiving."
                    permissions={[
                        Permissions_Permission_Enum.ConferenceManageContent, // TODO: Manage broadcasts permission
                    ]}
                    colorScheme="gray"
                />
                <RestrictedDashboardButton
                    to="checklist"
                    name="Checklist"
                    icon="check-circle"
                    description="Run the automatic checker to see if you're ready for the start of your conference."
                    permissions={[
                        Permissions_Permission_Enum.ConferenceManageContent,
                        Permissions_Permission_Enum.ConferenceManageSchedule,
                    ]}
                    colorScheme="green"
                />
                <RestrictedDashboardButton
                    to="analytics"
                    name="Analytics"
                    icon="chart-line"
                    description="View activity at your conference."
                    permissions={[Permissions_Permission_Enum.ConferenceManageSchedule]}
                    colorScheme="green"
                />
                {/* 
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
