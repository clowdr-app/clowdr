import { Flex, Heading, HStack, Link, Spacer, VStack } from "@chakra-ui/react";
import React from "react";
import { Link as ReactLink } from "react-router-dom";
import { useAuthParameters } from "../../GQL/AuthParameters";
import { useTitle } from "../../Hooks/useTitle";
import RequireRole from "../RequireRole";
import { useConference } from "../useConference";
import RestrictedDashboardButton from "./RestrictedDashboardButton";

export default function ManagerLandingPage(): JSX.Element {
    const conference = useConference();
    const { conferencePath } = useAuthParameters();
    const title = useTitle(`Manage ${conference.shortName}`);
    return (
        <>
            {title}
            <VStack
                w="100%"
                alignItems="flex-start"
                px={[4, 4, 8]}
                pb={[4, 4, 8]}
                spacing={8}
                maxW="calc(902px + (2 * var(--chakra-space-8)))"
            >
                <Heading as="h1" id="page-heading" mt={4} textAlign="left" w="100%" fontSize="4xl">
                    Manage {conference.shortName}
                </Heading>
                <HStack w="100%" alignItems="flex-end">
                    <Heading as="h2" mt={4} textAlign="left" w="100%" fontSize="2xl">
                        Program
                    </Heading>
                    <Spacer w="auto" />
                    <RequireRole organizerRole={true}>
                        <Link as={ReactLink} to={`${conferencePath}/manage/checklist`} fontSize="lg">
                            Checklist
                        </Link>
                    </RequireRole>
                </HStack>
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
                    />
                    <RestrictedDashboardButton
                        to="schedule"
                        name="Schedule"
                        icon="calendar"
                        description="Manage your program schedule: your events."
                        organizerRole
                    />
                    <RestrictedDashboardButton
                        to="people"
                        name="Program People"
                        icon="people-arrows"
                        description="Manage people listed in your program (authors, speakers, etc) and their links to registrants."
                        organizerRole
                    />
                    <RestrictedDashboardButton
                        to="content"
                        name={conference.sponsorsLabel?.[0]?.value ?? "Sponsors"}
                        icon="star"
                        description={`Manage your ${
                            conference.sponsorsLabel?.[0]?.value ?? "sponsors"
                        }, their booths and representatives.`}
                        organizerRole
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
                    />
                    <RestrictedDashboardButton
                        to="export"
                        name="Export"
                        icon="upload"
                        description="Export your conference data (events, public chats, analytics, etc)."
                        organizerRole
                    />
                    <RestrictedDashboardButton
                        to="analytics"
                        name="Analytics"
                        icon="chart-line"
                        description="View activity at your conference."
                        organizerRole
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
                    />
                    <RestrictedDashboardButton
                        to="shuffle"
                        name="Shuffle"
                        icon="random"
                        description="Manage randomised, time-limited networking, aka. shuffle periods."
                        organizerRole
                    />
                    <RestrictedDashboardButton
                        to="chats/moderation"
                        name="Chat Moderation"
                        icon="comments"
                        description="Moderate conversations."
                        moderatorRole
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
                    />
                    <RestrictedDashboardButton
                        to="registrants"
                        name="Registrants"
                        icon="users"
                        description="Manage who can log in and access your conference, e.g. registrants, presenters and speakers."
                        organizerRole
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
                    />
                    <RestrictedDashboardButton
                        to="email"
                        name="Email"
                        icon="envelope-open-text"
                        description="Manage templates for submission requests, invitations, etc."
                        organizerRole
                    />
                    <RestrictedDashboardButton
                        to="settings"
                        name="Settings"
                        icon="cog"
                        description="Manage global configuration of your conference."
                        organizerRole
                    />
                </Flex>
                {/* <RestrictedDashboardButton
                    to="broadcasts"
                    name="Broadcasts"
                    icon="video"
                    description="Manage your livestreams and broadcasts, including post-conference archiving."
                    organizerRole
                    colorScheme="gray"
                /> */}
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
