import { Flex, Heading, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import { useTitle } from "../../Utils/useTitle";
import { useConference } from "../useConference";
import RestrictedDashboardButton from "./RestrictedDashboardButton";

export default function ManagerLandingPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage ${conference.shortName}`);

    const green = useColorModeValue("purple.500", "purple.200");
    const red = useColorModeValue("pink.500", "pink.200");

    const greenHover = useColorModeValue("purple.600", "purple.300");
    const redHover = useColorModeValue("pink.600", "pink.300");

    const greenFocus = useColorModeValue("purple.700", "purple.400");
    const redFocus = useColorModeValue("pink.700", "pink.400");
    return (
        <>
            {title}
            <Heading as="h1" id="page-heading" mt={4}>
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
                    organizerRole
                    colorScheme="purple"
                />
                <RestrictedDashboardButton
                    to="export"
                    name="Export"
                    icon="upload"
                    description="Export your conference data (events, public chats, analytics, etc)."
                    organizerRole
                    colorScheme="purple"
                />
                <RestrictedDashboardButton
                    to="content"
                    name="Content"
                    icon="align-left"
                    description="Manage your program content: papers, posters, keynotes, etc."
                    organizerRole
                    colorScheme="purple"
                />
                <RestrictedDashboardButton
                    to="rooms"
                    name="Rooms"
                    icon="coffee"
                    description="Manage and prioritise rooms."
                    organizerRole
                    colorScheme="purple"
                />
                <RestrictedDashboardButton
                    to="schedule"
                    name="Schedule"
                    icon="calendar"
                    description="Manage your program schedule: your events."
                    organizerRole
                    colorScheme="purple"
                />
                <RestrictedDashboardButton
                    to="people"
                    name="Program People"
                    icon="people-arrows"
                    description="Manage people listed in your program (authors, speakers, etc) and their links to registrants."
                    organizerRole
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
                {/* <RestrictedDashboardButton
                    to="roles"
                    name="Permissions"
                    icon="lock"
                    description="Manage sets of permissions that can be assigned to groups."
                    organizerRole
                    colorScheme="pink"
                /> */}
                <RestrictedDashboardButton
                    to="content"
                    name={conference.sponsorsLabel?.[0]?.value ?? "Sponsors"}
                    icon="star"
                    description={`Manage your ${
                        conference.sponsorsLabel?.[0]?.value ?? "sponsors"
                    }, their booths and representatives.`}
                    organizerRole
                    colorScheme="purple"
                />
                <RestrictedDashboardButton
                    to="groups"
                    name="Groups"
                    icon="user-cog"
                    description="Manage groups of registrants."
                    organizerRole
                    colorScheme="pink"
                />
                <RestrictedDashboardButton
                    to="registrants"
                    name="Registrants"
                    icon="users"
                    description="Manage who can log in and access your conference, e.g. registrants, presenters and speakers."
                    organizerRole
                    colorScheme="pink"
                />
                {/* <RestrictedDashboardButton
                    to="chats"
                    name="Chats"
                    icon="comments"
                    description="Manage and moderate conversations."
                    organizerRole
                    colorScheme="purple"
                /> */}
                <RestrictedDashboardButton
                    to="shuffle"
                    name="Shuffle"
                    icon="random"
                    description="Manage randomised, time-limited networking, aka. shuffle periods."
                    organizerRole
                    colorScheme="purple"
                />
                <RestrictedDashboardButton
                    to="chats/moderation"
                    name="Chat Moderation"
                    icon="comments"
                    description="Moderate conversations."
                    moderatorRole
                    colorScheme="purple"
                />
                <RestrictedDashboardButton
                    to="theme"
                    name="Theme"
                    icon="palette"
                    description="Customise the theme for attendees."
                    organizerRole
                    colorScheme="orange"
                />
                <RestrictedDashboardButton
                    to="email"
                    name="Email"
                    icon="envelope-open-text"
                    description="Manage templates for submission requests, invitations, etc."
                    organizerRole
                    colorScheme="gray"
                />
                <RestrictedDashboardButton
                    to="details"
                    name="Details"
                    icon="signature"
                    description="Manage name, short name and url."
                    organizerRole
                    colorScheme="gray"
                />
                <RestrictedDashboardButton
                    to="broadcasts"
                    name="Broadcasts"
                    icon="video"
                    description="Manage your livestreams and broadcasts, including post-conference archiving."
                    organizerRole
                    colorScheme="gray"
                />
                <RestrictedDashboardButton
                    to="checklist"
                    name="Checklist"
                    icon="check-circle"
                    description="Run the automatic checker to see if you're ready for the start of your conference."
                    organizerRole
                    colorScheme="green"
                />
                <RestrictedDashboardButton
                    to="analytics"
                    name="Analytics"
                    icon="chart-line"
                    description="View activity at your conference."
                    organizerRole
                    colorScheme="green"
                />
                {/* 
                <RestrictedDashboardButton
                    to="support"
                    name="Support"
                    icon="question-circle"
                    description="Learn about how to use Midspace's management tools and best practices."
                /> */}
            </Flex>
        </>
    );
}
