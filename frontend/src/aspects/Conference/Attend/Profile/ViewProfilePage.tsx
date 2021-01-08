import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Badge, Box, Center, chakra, Divider, Heading, HStack, Image, Link, Spinner, VStack } from "@chakra-ui/react";
import React, { useEffect } from "react";
import { Redirect } from "react-router-dom";
import { Permission_Enum, useAttendeeByIdQuery } from "../../../../generated/graphql";
import BadgeList from "../../../Badges/BadgeList";
import PageFailedToLoad from "../../../Errors/PageFailedToLoad";
import PageNotFound from "../../../Errors/PageNotFound";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import FAIcon from "../../../Icons/FAIcon";
import usePrimaryMenuButtons from "../../../Menu/usePrimaryMenuButtons";
import PronounList from "../../../Pronouns/PronounList";
import { Markdown } from "../../../Text/Markdown";
import useMaybeCurrentUser from "../../../Users/CurrentUser/useMaybeCurrentUser";
import { useConference } from "../../useConference";
import { useConferenceCurrentUserActivePermissions } from "../../useConferenceCurrentUserActivePermissions";
import { Attendee, useMaybeCurrentAttendee } from "../../useCurrentAttendee";
import AttendeeExtraInfo from "./AttendeeExtraInfo";

function ViewProfilePageInner({ attendee }: { attendee: Attendee }): JSX.Element {
    const conference = useConference();
    const activePermissions = useConferenceCurrentUserActivePermissions();
    const maybeCurrentUser = useMaybeCurrentUser();
    const { setPrimaryMenuButtons } = usePrimaryMenuButtons();
    useEffect(() => {
        if (
            (maybeCurrentUser.user && attendee.userId === maybeCurrentUser.user.id) ||
            [
                Permission_Enum.ConferenceManageAttendees,
                Permission_Enum.ConferenceManageGroups,
                Permission_Enum.ConferenceManageRoles,
            ].some((permission) => activePermissions.has(permission))
        ) {
            setPrimaryMenuButtons([
                {
                    key: "conference-home",
                    action: `/conference/${conference.slug}`,
                    text: "Home",
                    label: "Home",
                },
                {
                    key: "edit-profile",
                    action: `/conference/${conference.slug}/profile/edit${
                        maybeCurrentUser.user && attendee.userId === maybeCurrentUser.user.id ? "" : `/${attendee.id}`
                    }`,
                    text: "Edit profile",
                    label: "Edit profile",
                    colorScheme: "blue",
                },
            ]);
        } else {
            setPrimaryMenuButtons([
                {
                    key: "conference-home",
                    action: `/conference/${conference.slug}`,
                    text: "Home",
                    label: "Home",
                },
            ]);
        }
    }, [
        activePermissions,
        attendee.id,
        attendee.userId,
        conference.slug,
        maybeCurrentUser.user,
        setPrimaryMenuButtons,
    ]);

    return (
        <VStack spacing={0} maxW={1100} w="100%">
            <HStack justifyContent="center" flexWrap="wrap" alignItems="stretch" spacing={0} pr={4} pt={4} w="100%">
                <Center
                    ml={[2, 4]}
                    mb={4}
                    maxW={350}
                    maxH={350}
                    borderStyle="solid"
                    borderWidth={2}
                    borderColor="gray.400"
                    overflow="hidden"
                    p={0}
                    borderRadius={10}
                    flex="0 1 350px"
                >
                    {attendee.profile.photoURL_350x350 ? (
                        <Image
                            w="100%"
                            h="100%"
                            src={attendee.profile.photoURL_350x350}
                            fallbackSrc="https://via.placeholder.com/350"
                        />
                    ) : (
                        <FAIcon iconStyle="s" icon="cat" fontSize="150px" />
                    )}
                </Center>
                <VStack pl={4} h="100%" justifyContent="flex-start" alignItems="flex-start" spacing={4} flex="1 1 50%">
                    <Heading as="h1">{attendee.displayName}</Heading>
                    {attendee.profile.pronouns ? (
                        <Box>
                            <PronounList pronouns={attendee.profile.pronouns} />
                        </Box>
                    ) : undefined}
                    {attendee.profile.affiliation || attendee.profile.affiliationURL ? (
                        <Box m={0}>
                            {attendee.profile.affiliation && attendee.profile.affiliationURL ? (
                                <Link h="auto" isExternal href={`https://${attendee.profile.affiliationURL}`}>
                                    <Badge
                                        colorScheme="blue"
                                        variant="outline"
                                        fontSize="1rem"
                                        pt={1}
                                        pb={1}
                                        pl={2}
                                        pr={2}
                                    >
                                        <FAIcon iconStyle="s" icon="link" fontSize="0.8rem" mb={1} />{" "}
                                        {attendee.profile.affiliation}{" "}
                                        <chakra.sup>
                                            <ExternalLinkIcon />
                                        </chakra.sup>
                                    </Badge>
                                </Link>
                            ) : attendee.profile.affiliation ? (
                                <Badge colorScheme="blue" variant="outline" fontSize="1rem" pt={1} pb={1} pl={2} pr={2}>
                                    {attendee.profile.affiliation}
                                </Badge>
                            ) : undefined}
                        </Box>
                    ) : undefined}
                    {attendee.profile.badges ? <BadgeList badges={attendee.profile.badges} /> : undefined}
                    <Box alignSelf="flex-start" pb={4}>
                        {attendee.profile.bio ? (
                            <Markdown restrictHeadingSize>{attendee.profile.bio}</Markdown>
                        ) : undefined}
                    </Box>
                </VStack>
            </HStack>
            <Divider pt={4} />
            <AttendeeExtraInfo pt={4} attendee={attendee} />
        </VStack>
    );
}

function ViewProfilePage_FetchAttendee({ attendeeId }: { attendeeId: string }): JSX.Element {
    const conference = useConference();
    const { loading, error, data } = useAttendeeByIdQuery({
        variables: {
            attendeeId,
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(error);

    if (loading && !data) {
        return (
            <Box>
                <Spinner />
            </Box>
        );
    }

    if (error) {
        return (
            <PageFailedToLoad>
                Sorry, we were unable to load the page due to an unrecognised error. Please try again later or contact
                our support teams if this error persists.
            </PageFailedToLoad>
        );
    }

    if (!data?.Attendee[0] || !data.Attendee[0].profile) {
        return (
            <Box>
                <Spinner />
            </Box>
        );
    }

    return (
        <ViewProfilePageInner
            attendee={{
                ...data.Attendee[0],
                profile: data.Attendee[0].profile,
            }}
        />
    );
}

export default function ViewProfilePage({ attendeeId }: { attendeeId?: string }): JSX.Element {
    const conference = useConference();
    const activePermissions = useConferenceCurrentUserActivePermissions();
    const maybeCurrentAttendee = useMaybeCurrentAttendee();
    const maybeCurrentUser = useMaybeCurrentUser();

    if (
        (!maybeCurrentUser.user ||
            !maybeCurrentAttendee ||
            maybeCurrentAttendee.userId !== maybeCurrentUser.user.id ||
            maybeCurrentAttendee?.id !== attendeeId) &&
        ![
            Permission_Enum.ConferenceViewAttendees,
            Permission_Enum.ConferenceManageAttendees,
            Permission_Enum.ConferenceManageGroups,
            Permission_Enum.ConferenceManageRoles,
        ].some((permission) => activePermissions.has(permission))
    ) {
        return <Redirect to={`/conference/${conference.slug}`} />;
    }

    if (attendeeId) {
        return <ViewProfilePage_FetchAttendee attendeeId={attendeeId} />;
    } else if (maybeCurrentAttendee) {
        return <ViewProfilePageInner attendee={maybeCurrentAttendee} />;
    } else {
        return <PageNotFound />;
    }
}
