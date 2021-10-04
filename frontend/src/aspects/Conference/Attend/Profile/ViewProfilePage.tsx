import { gql } from "@apollo/client";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
    Badge,
    Box,
    ButtonGroup,
    Center,
    chakra,
    Divider,
    Heading,
    HStack,
    Image,
    Link,
    Spinner,
    VStack,
} from "@chakra-ui/react";
import React from "react";
import { Redirect } from "react-router-dom";
import { Permissions_Permission_Enum, useRegistrantByIdQuery } from "../../../../generated/graphql";
import BadgeList from "../../../Badges/BadgeList";
import { LinkButton } from "../../../Chakra/LinkButton";
import PageFailedToLoad from "../../../Errors/PageFailedToLoad";
import PageNotFound from "../../../Errors/PageNotFound";
import useQueryErrorToast from "../../../GQL/useQueryErrorToast";
import FAIcon from "../../../Icons/FAIcon";
import PronounList from "../../../Pronouns/PronounList";
import { Markdown } from "../../../Text/Markdown";
import useMaybeCurrentUser from "../../../Users/CurrentUser/useMaybeCurrentUser";
import { useTitle } from "../../../Utils/useTitle";
import { useConference } from "../../useConference";
import { useConferenceCurrentUserActivePermissions } from "../../useConferenceCurrentUserActivePermissions";
import { Registrant, useMaybeCurrentRegistrant } from "../../useCurrentRegistrant";
import RegistrantExtraInfo from "./RegistrantExtraInfo";
import RegistrantItems from "./RegistrantItems";

gql`
    query ProfilePage_Items($registrantId: uuid!) {
        content_Item(where: { itemPeople: { person: { registrantId: { _eq: $registrantId } } } }) {
            ...SearchPanel_Item
        }
    }
`;

function ViewProfilePageInner({ registrant }: { registrant: Registrant }): JSX.Element {
    const conference = useConference();
    const activePermissions = useConferenceCurrentUserActivePermissions();
    const maybeCurrentUser = useMaybeCurrentUser();

    const title = useTitle(`${registrant.displayName} at ${conference.shortName}`);

    return (
        <>
            {title}
            <VStack spacing={0} maxW={1100} w="100%" m={2}>
                {(maybeCurrentUser.user && registrant.userId === maybeCurrentUser.user.id) ||
                [
                    Permissions_Permission_Enum.ConferenceManageAttendees,
                    Permissions_Permission_Enum.ConferenceManageGroups,
                    Permissions_Permission_Enum.ConferenceManageRoles,
                ].some((permission) => activePermissions.has(permission)) ? (
                    <ButtonGroup variant="outline">
                        <LinkButton to={`/conference/${conference.slug}`} colorScheme="EditProfilePage-ContinueButton">
                            Continue to {conference.shortName}
                        </LinkButton>
                        <LinkButton
                            to={`/conference/${conference.slug}/profile/edit${
                                maybeCurrentUser.user && registrant.userId === maybeCurrentUser.user.id
                                    ? ""
                                    : `/${registrant.id}`
                            }`}
                            colorScheme="PrimaryActionButton"
                        >
                            Edit profile
                        </LinkButton>
                    </ButtonGroup>
                ) : undefined}
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
                        {registrant.profile.photoURL_350x350 ? (
                            <Image
                                w="100%"
                                h="100%"
                                src={registrant.profile.photoURL_350x350}
                                fallbackSrc="https://via.placeholder.com/350"
                                overflow="hidden"
                                alt={`Profile picture of ${registrant.displayName}`}
                            />
                        ) : (
                            <FAIcon iconStyle="s" icon="cat" fontSize="150px" />
                        )}
                    </Center>
                    <VStack
                        pl={4}
                        h="100%"
                        justifyContent="flex-start"
                        alignItems="flex-start"
                        spacing={4}
                        flex="1 1 50%"
                    >
                        <Heading as="h1" id="page-heading">
                            {registrant.displayName}
                        </Heading>
                        {registrant.profile.pronouns ? (
                            <Box>
                                <PronounList pronouns={registrant.profile.pronouns} />
                            </Box>
                        ) : undefined}
                        {registrant.profile.affiliation || registrant.profile.affiliationURL ? (
                            <Box m={0}>
                                {registrant.profile.affiliation && registrant.profile.affiliationURL ? (
                                    <Link
                                        h="auto"
                                        isExternal
                                        href={`${
                                            !registrant.profile.affiliationURL.toLowerCase().startsWith("http://") &&
                                            !registrant.profile.affiliationURL.toLowerCase().startsWith("https://")
                                                ? "https://"
                                                : ""
                                        }${registrant.profile.affiliationURL}`}
                                    >
                                        <Badge
                                            colorScheme="Profile-AffiliationLink"
                                            variant="outline"
                                            fontSize="1rem"
                                            pt={1}
                                            pb={1}
                                            pl={2}
                                            pr={2}
                                        >
                                            <FAIcon iconStyle="s" icon="link" fontSize="0.8rem" mb={1} />{" "}
                                            {registrant.profile.affiliation}{" "}
                                            <chakra.sup>
                                                <ExternalLinkIcon />
                                            </chakra.sup>
                                        </Badge>
                                    </Link>
                                ) : registrant.profile.affiliation ? (
                                    <Badge
                                        colorScheme="Profile-AffiliationLink"
                                        variant="outline"
                                        fontSize="1rem"
                                        pt={1}
                                        pb={1}
                                        pl={2}
                                        pr={2}
                                    >
                                        {registrant.profile.affiliation}
                                    </Badge>
                                ) : undefined}
                            </Box>
                        ) : undefined}
                        {registrant.profile.badges ? <BadgeList badges={registrant.profile.badges} /> : undefined}
                        <Box alignSelf="flex-start" pb={4}>
                            {registrant.profile.bio ? (
                                <Markdown restrictHeadingSize>{registrant.profile.bio}</Markdown>
                            ) : undefined}
                        </Box>
                    </VStack>
                </HStack>
                <Divider pt={4} />
                <RegistrantExtraInfo pt={4} registrant={registrant} />
                <RegistrantItems registrantId={registrant.id} />
            </VStack>
        </>
    );
}

function ViewProfilePage_FetchRegistrant({ registrantId }: { registrantId: string }): JSX.Element {
    const conference = useConference();
    const { loading, error, data } = useRegistrantByIdQuery({
        variables: {
            registrantId,
            conferenceId: conference.id,
        },
    });
    useQueryErrorToast(error, false, "ViewProfilePage_FetchRegistrant");

    if (loading && !data) {
        return (
            <div>
                <Spinner />
            </div>
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

    if (!data?.registrant_Registrant[0] || !data.registrant_Registrant[0].profile) {
        return (
            <div>
                <Spinner />
            </div>
        );
    }

    return (
        <ViewProfilePageInner
            registrant={{
                ...data.registrant_Registrant[0],
                profile: data.registrant_Registrant[0].profile,
            }}
        />
    );
}

export default function ViewProfilePage({ registrantId }: { registrantId?: string }): JSX.Element {
    const conference = useConference();
    const activePermissions = useConferenceCurrentUserActivePermissions();
    const maybeCurrentRegistrant = useMaybeCurrentRegistrant();
    const maybeCurrentUser = useMaybeCurrentUser();

    if (
        (!maybeCurrentUser.user ||
            !maybeCurrentRegistrant ||
            maybeCurrentRegistrant.userId !== maybeCurrentUser.user.id ||
            maybeCurrentRegistrant?.id !== registrantId) &&
        ![
            Permissions_Permission_Enum.ConferenceViewAttendees,
            Permissions_Permission_Enum.ConferenceManageAttendees,
            Permissions_Permission_Enum.ConferenceManageGroups,
            Permissions_Permission_Enum.ConferenceManageRoles,
        ].some((permission) => activePermissions.has(permission))
    ) {
        return <Redirect to={`/conference/${conference.slug}`} />;
    }

    if (registrantId) {
        return <ViewProfilePage_FetchRegistrant registrantId={registrantId} />;
    } else if (maybeCurrentRegistrant) {
        return <ViewProfilePageInner registrant={maybeCurrentRegistrant} />;
    } else {
        return <PageNotFound />;
    }
}
