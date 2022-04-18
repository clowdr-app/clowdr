import { chakra, Flex, Heading, HStack, Link, Spacer, Text, VStack } from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { useMemo } from "react";
import { Link as ReactLink } from "react-router-dom";
import { gql } from "urql";
import { useConferenceTechSupportAddressQuery } from "../../../generated/graphql";
import { useAuthParameters } from "../../GQL/AuthParameters";
import { makeContext } from "../../GQL/make-context";
import RequireRole from "../RequireRole";
import { useConference } from "../useConference";
import { DashboardPage } from "./DashboardPage";
import RestrictedDashboardButton from "./RestrictedDashboardButton";

gql`
    query ConferenceTechSupportAddress($conferenceId: uuid!) {
        supportAddress: conference_Configuration_by_pk(conferenceId: $conferenceId, key: SUPPORT_ADDRESS) {
            conferenceId
            key
            value
        }
        techSupportAddress: conference_Configuration_by_pk(conferenceId: $conferenceId, key: TECH_SUPPORT_ADDRESS) {
            conferenceId
            key
            value
        }
    }
`;

export default function ManagerLandingPage(): JSX.Element {
    const conference = useConference();
    const { conferencePath, subconferenceId } = useAuthParameters();
    const context = useMemo(
        () =>
            makeContext(
                {
                    [AuthHeader.Role]: subconferenceId
                        ? HasuraRoleName.SubconferenceOrganizer
                        : HasuraRoleName.ConferenceOrganizer,
                },
                ["conference_Configuration"]
            ),
        [subconferenceId]
    );
    const [techSupportAddressResponse] = useConferenceTechSupportAddressQuery({
        variables: {
            conferenceId: conference.id,
        },
        context,
    });
    const supportAddress =
        techSupportAddressResponse.data?.supportAddress?.value ??
        import.meta.env.VITE_TECH_SUPPORT_ADDRESS ??
        "support@midspace.app";
    const techSupportAddress =
        techSupportAddressResponse.data?.techSupportAddress?.value ??
        import.meta.env.VITE_TECH_SUPPORT_ADDRESS ??
        "support@midspace.app";
    const primarySupportAddress = subconferenceId ? supportAddress : techSupportAddress;

    const confTitle = useMemo(
        () =>
            (subconferenceId
                ? conference.subconferences.find((x) => x.id === subconferenceId)?.shortName
                : undefined) ?? conference.shortName,
        [conference.shortName, conference.subconferences, subconferenceId]
    );
    return (
        <DashboardPage title={`Manage ${confTitle}`}>
            <VStack
                w="100%"
                alignItems="flex-start"
                px={[4, 4, 8]}
                pb={[4, 4, 8]}
                spacing={8}
                maxW="calc(902px + (2 * var(--chakra-space-8)))"
            >
                <Text>
                    <chakra.span fontWeight="bold">Need help?</chakra.span> Contact{" "}
                    {subconferenceId ? "your conference organizing team at: " : "our support team at: "}
                    <Link wordBreak="keep-all" whiteSpace="nowrap" href={`mailto:${primarySupportAddress}`}>
                        {primarySupportAddress}
                    </Link>
                </Text>
                <HStack w="100%" alignItems="flex-end">
                    <Heading as="h2" mt={4} textAlign="left" w="100%" fontSize="2xl">
                        Program
                    </Heading>
                    <Spacer w="auto" />
                    <RequireRole organizerRole>
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
                        to="schedule/v2"
                        name="Schedule"
                        icon="calendar"
                        description="Manage your program schedule: your events."
                        organizerRole
                    />
                    <RestrictedDashboardButton
                        to="content"
                        name="Content"
                        icon="align-left"
                        description="Manage your program content: papers, posters, keynotes, etc."
                        organizerRole
                    />
                    <RestrictedDashboardButton
                        to="people"
                        name="Program People"
                        icon="people-arrows"
                        description="Manage people listed in your program (authors, speakers, etc) and their links to registrants."
                        organizerRole
                    />
                    {!subconferenceId ? (
                        <RestrictedDashboardButton
                            to="content"
                            name={conference.sponsorsLabel?.[0]?.value ?? "Sponsors"}
                            icon="star"
                            description={`Manage your ${
                                conference.sponsorsLabel?.[0]?.value ?? "sponsors"
                            }, their booths and representatives.`}
                            organizerRole
                        />
                    ) : undefined}
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
                    {!subconferenceId ? (
                        <RestrictedDashboardButton
                            to="analytics"
                            name="Analytics"
                            icon="chart-line"
                            description="View activity at your conference."
                            organizerRole
                        />
                    ) : undefined}
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
                        name="Networking"
                        icon="random"
                        description="Manage randomised, time-limited networking, aka. shuffle periods."
                        organizerRole
                    />
                    {!subconferenceId ? (
                        <RestrictedDashboardButton
                            to="chats/moderation"
                            name="Chat Moderation"
                            icon="comments"
                            description="Moderate conversations."
                            moderatorRole
                        />
                    ) : undefined}
                </Flex>
                {!subconferenceId ? (
                    <>
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
                    </>
                ) : undefined}
                {!subconferenceId ? (
                    <>
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
                    </>
                ) : undefined}
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
        </DashboardPage>
    );
}
