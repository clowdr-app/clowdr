import { Flex, Heading, VStack } from "@chakra-ui/react";
import React from "react";
import { useTitle } from "../../Hooks/useTitle";
import { useConference } from "../useConference";
import RestrictedDashboardButton from "./RestrictedDashboardButton";

export default function ManagerLandingPage(): JSX.Element {
    const conference = useConference();
    const title = useTitle(`Manage ${conference.shortName}`);
    return (
        <>
            {title}
            <VStack w="100%" alignItems="flex-start" px={8} spacing={8}>
                <Heading as="h1" id="page-heading" mt={4} textAlign="left" w="100%" fontSize="4xl">
                    Manage {conference.shortName}
                </Heading>
                <Heading as="h2" mt={4} textAlign="left" w="100%" fontSize="2xl">
                    Program
                </Heading>
                <Flex
                    flexWrap="wrap"
                    alignItems="stretch"
                    justifyContent="flex-start"
                    w="100%"
                    gridRowGap="1em"
                    gridColumnGap="1em"
                >
                    <RestrictedDashboardButton
                        to="content"
                        name="Content"
                        icon="align-left"
                        description="Manage your program content: papers, posters, keynotes, etc."
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
                    />
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
                </Flex>
                <Heading as="h2" mt={4} textAlign="left" w="100%" fontSize="2xl">
                    Data
                </Heading>
                <Flex
                    flexWrap="wrap"
                    alignItems="stretch"
                    justifyContent="flex-start"
                    w="100%"
                    gridRowGap="1em"
                    gridColumnGap="1em"
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
                </Flex>
                <Heading as="h2" mt={4} textAlign="left" w="100%" fontSize="2xl">
                    Social
                </Heading>
                <Flex
                    flexWrap="wrap"
                    alignItems="stretch"
                    justifyContent="flex-start"
                    w="100%"
                    gridRowGap="1em"
                    gridColumnGap="1em"
                >
                    <RestrictedDashboardButton
                        to="rooms"
                        name="Rooms"
                        icon="coffee"
                        description="Manage and prioritise rooms."
                        organizerRole
                        colorScheme="purple"
                    />
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
                </Flex>
                <Heading as="h2" mt={4} textAlign="left" w="100%" fontSize="2xl">
                    Registration
                </Heading>
                <Flex
                    flexWrap="wrap"
                    alignItems="stretch"
                    justifyContent="flex-start"
                    w="100%"
                    gridRowGap="1em"
                    gridColumnGap="1em"
                >
                    <RestrictedDashboardButton
                        to="groups"
                        name="Groups"
                        icon="user-cog"
                        description="Manage groups of registrants."
                        organizerRole
                        colorScheme="purple"
                    />
                    <RestrictedDashboardButton
                        to="registrants"
                        name="Registrants"
                        icon="users"
                        description="Manage who can log in and access your conference, e.g. registrants, presenters and speakers."
                        organizerRole
                        colorScheme="purple"
                    />
                </Flex>
                <Heading as="h2" mt={4} textAlign="left" w="100%" fontSize="2xl">
                    Customize
                </Heading>
                <Flex
                    flexWrap="wrap"
                    alignItems="stretch"
                    justifyContent="flex-start"
                    w="100%"
                    gridRowGap="1em"
                    gridColumnGap="1em"
                >
                    <RestrictedDashboardButton
                        to="theme"
                        name="Theme"
                        icon="palette"
                        description="Customise the theme for attendees."
                        organizerRole
                        colorScheme="purple"
                    />
                    <RestrictedDashboardButton
                        to="email"
                        name="Email"
                        icon="envelope-open-text"
                        description="Manage templates for submission requests, invitations, etc."
                        organizerRole
                        colorScheme="purple"
                    />
                    <RestrictedDashboardButton
                        to="details"
                        name="Details"
                        icon="signature"
                        description="Manage name, short name and url."
                        organizerRole
                        colorScheme="purple"
                    />
                    <RestrictedDashboardButton
                        to="settings"
                        name="Settings"
                        icon="cog"
                        description="Manage global configuration of your conference."
                        organizerRole
                        colorScheme="purple"
                    />
                </Flex>
                {/* <RestrictedDashboardButton
                    to="chats"
                    name="Chats"
                    icon="comments"
                    description="Manage and moderate conversations."
                    organizerRole
                    colorScheme="purple"
                /> */}

                {/* <RestrictedDashboardButton
                    to="broadcasts"
                    name="Broadcasts"
                    icon="video"
                    description="Manage your livestreams and broadcasts, including post-conference archiving."
                    organizerRole
                    colorScheme="gray"
                /> */}
                <Heading as="h2" mt={4} textAlign="left" w="100%" fontSize="2xl">
                    Check &amp; Monitor
                </Heading>
                <Flex
                    flexWrap="wrap"
                    alignItems="stretch"
                    justifyContent="flex-start"
                    w="100%"
                    gridRowGap="1em"
                    gridColumnGap="1em"
                >
                    <RestrictedDashboardButton
                        to="checklist"
                        name="Checklist"
                        icon="check-circle"
                        description="Run the automatic checker to see if you're ready for the start of your conference."
                        organizerRole
                        colorScheme="purple"
                    />
                    <RestrictedDashboardButton
                        to="analytics"
                        name="Analytics"
                        icon="chart-line"
                        description="View activity at your conference."
                        organizerRole
                        colorScheme="purple"
                    />
                </Flex>
            </VStack>
            {/* 
                <RestrictedDashboardButton
                    to="support"
                    name="Support"
                    icon="question-circle"
                    description="Learn about how to use Midspace's management tools and best practices."
                /> */}
        </>
    );
}
