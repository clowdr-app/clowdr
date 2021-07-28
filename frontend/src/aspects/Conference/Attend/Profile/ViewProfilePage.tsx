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
    List,
    ListItem,
    Spinner,
    VStack,
} from "@chakra-ui/react";
import * as R from "ramda";
import React, { useMemo } from "react";
import { Redirect } from "react-router-dom";
import {
    Permissions_Permission_Enum,
    SearchPanel_ItemFragment,
    useProfilePage_ItemsQuery,
    useRegistrantByIdQuery,
} from "../../../../generated/graphql";
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
import SearchResult_Item from "../Search/SearchResult_Item";
import RegistrantExtraInfo from "./RegistrantExtraInfo";

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
    const itemsResponse = useProfilePage_ItemsQuery({
        variables: {
            registrantId: registrant.id,
        },
    });
    const items = useMemo(
        () =>
            itemsResponse.data?.content_Item.length
                ? R.groupBy<SearchPanel_ItemFragment>(
                      (x) =>
                          x.itemPeople.find((y) => y.person.registrantId === registrant.id)?.roleName.toUpperCase() ??
                          "UNKNOWN",
                      R.sortBy((x) => x.title, itemsResponse.data?.content_Item)
                  )
                : undefined,
        [itemsResponse.data?.content_Item, registrant.id]
    );

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
                        <LinkButton to={`/conference/${conference.slug}`} colorScheme="purple">
                            Continue to {conference.shortName}
                        </LinkButton>
                        <LinkButton
                            to={`/conference/${conference.slug}/profile/edit${
                                maybeCurrentUser.user && registrant.userId === maybeCurrentUser.user.id
                                    ? ""
                                    : `/${registrant.id}`
                            }`}
                            colorScheme="blue"
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
                                    <Link h="auto" isExternal href={`https://${registrant.profile.affiliationURL}`}>
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
                                            {registrant.profile.affiliation}{" "}
                                            <chakra.sup>
                                                <ExternalLinkIcon />
                                            </chakra.sup>
                                        </Badge>
                                    </Link>
                                ) : registrant.profile.affiliation ? (
                                    <Badge
                                        colorScheme="blue"
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
                {items?.PRESENTER?.length ? (
                    <>
                        <Divider pt={4} />
                        <Heading as="h3" pt={4} textAlign="left" fontSize="lg" alignSelf="flex-start">
                            Presenter of:
                        </Heading>
                        <List pt={4} spacing={3} w="100%" px={2}>
                            {items.PRESENTER.map((item) => (
                                <ListItem key={item.id} w="100%">
                                    <SearchResult_Item item={item} />
                                </ListItem>
                            ))}
                        </List>
                    </>
                ) : undefined}
                {items?.AUTHOR?.length ? (
                    <>
                        <Divider pt={4} />
                        <Heading as="h3" pt={4} textAlign="left" fontSize="lg" alignSelf="flex-start">
                            Author of:
                        </Heading>
                        <List pt={4} spacing={3} w="100%" px={2}>
                            {items.AUTHOR.map((item) => (
                                <ListItem key={item.id} w="100%">
                                    <SearchResult_Item item={item} />
                                </ListItem>
                            ))}
                        </List>
                    </>
                ) : undefined}
                {items?.CHAIR?.length ? (
                    <>
                        <Divider pt={4} />
                        <Heading as="h3" pt={4} textAlign="left" fontSize="lg" alignSelf="flex-start">
                            Chair of:
                        </Heading>
                        <List pt={4} spacing={3} w="100%" px={2}>
                            {items.CHAIR.map((item) => (
                                <ListItem key={item.id} w="100%">
                                    <SearchResult_Item item={item} />
                                </ListItem>
                            ))}
                        </List>
                    </>
                ) : undefined}
                {items?.UNKNOWN?.length ? (
                    <>
                        <Divider pt={4} />
                        <List pt={4} spacing={3} w="100%" px={2}>
                            {items.UNKNOWN.map((item) => (
                                <ListItem key={item.id} w="100%">
                                    <SearchResult_Item item={item} />
                                </ListItem>
                            ))}
                        </List>
                    </>
                ) : undefined}
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
