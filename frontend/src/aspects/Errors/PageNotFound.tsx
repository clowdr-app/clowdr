import { ExternalLinkIcon } from "@chakra-ui/icons";
import { ButtonGroup, Link, Text } from "@chakra-ui/react";
import { AuthHeader } from "@midspace/shared-types/auth";
import React, { useEffect, useMemo, useState } from "react";
import { Link as ReactLink, Route, Switch } from "react-router-dom";
import { useConferenceBySlugQuery } from "../../generated/graphql";
import { LoginButton } from "../Auth";
import CenteredSpinner from "../Chakra/CenteredSpinner";
import FAIcon from "../Chakra/FAIcon";
import { ExternalLinkButton, LinkButton } from "../Chakra/LinkButton";
import { useMaybeConference } from "../Conference/useConference";
import { useMaybeCurrentRegistrant } from "../Conference/useCurrentRegistrant";
import { useAuthParameters } from "../GQL/AuthParameters";
import { makeContext } from "../GQL/make-context";
import { useRestorableState } from "../Hooks/useRestorableState";
import { useTitle } from "../Hooks/useTitle";
import useCurrentUser from "../Users/CurrentUser/useCurrentUser";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import GenericErrorPage from "./GenericErrorPage";

export default function PageNotFound(): JSX.Element {
    const title = useTitle("Page not found");
    const { conferencePath } = useAuthParameters();
    const maybeCurrentUser = useMaybeCurrentUser();
    const loggedIn = !!maybeCurrentUser?.user;
    const maybeConference = useMaybeConference();
    const maybeCurrentRegistrant = useMaybeCurrentRegistrant();
    const registered = !!maybeCurrentRegistrant;

    return (
        <GenericErrorPage
            heading={
                maybeConference && !registered
                    ? `Welcome to ${maybeConference.shortName}`
                    : "Oops, this is not available at the moment."
            }
        >
            <>
                {title}
                {maybeConference && registered ? (
                    <>
                        <Switch>
                            {maybeConference ? (
                                <Route path={`${conferencePath}/room/`}>
                                    <Text fontSize="xl" lineHeight="revert" fontWeight="light" maxW={600}>
                                        You need to be a member of this room to access it. Please ask the room&apos;s
                                        owner or your conference organiser to add you to the room.
                                    </Text>
                                </Route>
                            ) : undefined}
                            <Route path="/">
                                <Text fontSize="xl" lineHeight="revert" fontWeight="light" maxW={600}>
                                    You are logged in and registered for this conference but you cannot access this
                                    page. Either you do not have permission to access this page or the URL is invalid.
                                    Please contact your conference organiser for further information and assistance.
                                </Text>
                            </Route>
                        </Switch>
                    </>
                ) : maybeConference && loggedIn ? (
                    <>
                        <Text fontSize="xl" lineHeight="revert" fontWeight="light" maxW={600}>
                            You are logged into Midspace but you will need an invitation code to access the full
                            conference.
                        </Text>
                        <Text
                            textAlign="center"
                            fontSize="xl"
                            lineHeight="revert"
                            fontWeight="light"
                            maxW={600}
                            fontStyle="italic"
                        >
                            Already received your invite code? Great!
                            <br />
                            <Link as={ReactLink} to="/join">
                                Join your conference <FAIcon iconStyle="s" icon="link" mb={1} fontSize="sm" />
                            </Link>
                            .
                        </Text>
                        <Text fontSize="xl" lineHeight="revert" fontWeight="light" maxW={600}>
                            When the conference starts, invite codes are sent via email by your conference organisers
                            within 24hrs.
                        </Text>
                    </>
                ) : loggedIn ? (
                    <RefreshRegistrationsCacheOrError />
                ) : (
                    <>
                        <Text fontSize="xl" lineHeight="revert" fontWeight="light" fontStyle="italic" maxW={600}>
                            Please log in{maybeConference?.registrationURL.length ? " or register " : ""}to continue
                        </Text>
                    </>
                )}
                <ButtonGroup pt={2} spacing={4} w="100%" flexWrap="wrap" alignItems="center" justifyContent="center">
                    {!registered && maybeConference?.registrationURL.length ? (
                        <ExternalLinkButton
                            to={maybeConference.registrationURL[0].value}
                            colorScheme="PrimaryActionButton"
                            mr={2}
                        >
                            <FAIcon iconStyle="s" icon="link" mr={2} />
                            Go to registration
                            <ExternalLinkIcon ml={1} />
                        </ExternalLinkButton>
                    ) : undefined}
                    {!loggedIn ? <LoginButton size="md" /> : undefined}
                    <LinkButton
                        to={maybeConference && conferencePath ? conferencePath : "/"}
                        colorScheme={
                            (!registered && maybeConference?.registrationURL.length) ||
                            maybeConference?.supportAddress.length
                                ? "gray"
                                : "PrimaryActionButton"
                        }
                    >
                        <FAIcon iconStyle="s" icon="home" mr={2} />
                        Go to home page
                    </LinkButton>
                    {maybeConference?.supportAddress.length ? (
                        <ExternalLinkButton
                            to={`mailto:${maybeConference.supportAddress[0].value}`}
                            colorScheme={
                                !registered && maybeConference?.registrationURL.length ? "gray" : "PrimaryActionButton"
                            }
                            ml={2}
                        >
                            <FAIcon iconStyle="s" icon="envelope" mr={2} />
                            Contact organisers
                        </ExternalLinkButton>
                    ) : undefined}
                </ButtonGroup>
            </>
        </GenericErrorPage>
    );
}

function RefreshRegistrationsCacheOrError() {
    const { conferenceSlug } = useAuthParameters();
    const currentUser = useCurrentUser();
    const [lastUserRefreshTime, setLastUserRefreshTime] = useRestorableState<number>(
        `UserRefresh-${currentUser.user.id}`,
        Date.now() - 60 * 60 * 1000,
        (x) => x.toString(),
        (x) => parseInt(x, 10)
    );

    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.RefreshRegistrationsCache]: "true",
            }),
        []
    );
    const [refreshResponse, refetchRefreshResponse] = useConferenceBySlugQuery({
        variables: {
            slug: conferenceSlug ?? "",
        },
        context,
        pause: true,
    });

    const shouldRefresh = conferenceSlug && Date.now() - lastUserRefreshTime > 60 * 1000;
    const [issuedRefresh, setIssuedRefresh] = useState<boolean>(false);
    useEffect(() => {
        if (shouldRefresh) {
            setIssuedRefresh(true);
            setLastUserRefreshTime(Date.now());
            refetchRefreshResponse();
        }
    }, [refetchRefreshResponse, setLastUserRefreshTime, shouldRefresh]);

    useEffect(() => {
        if (issuedRefresh && refreshResponse.data?.conference_Conference[0]?.slug) {
            window.location.reload();
        }
    }, [issuedRefresh, refreshResponse.data?.conference_Conference]);

    return shouldRefresh || refreshResponse.fetching || refreshResponse.data?.conference_Conference[0]?.slug ? (
        <CenteredSpinner caller="RefreshRegistrationsCacheOrError" />
    ) : (
        <>
            <Text fontSize="xl" lineHeight="revert" fontWeight="light" maxW={600}>
                Are you logged in with the same account you used with your invite code? Please ensure you are logged in
                with the correct account. Invitations are unique per registration and can only be used once by a single
                user.
            </Text>
            <Text fontSize="xl" lineHeight="revert" fontWeight="light" maxW={600}>
                If you are confident you are logged in with the right account, please double check the URL, and if this
                error persists, please contact your conference organiser.
            </Text>
        </>
    );
}
