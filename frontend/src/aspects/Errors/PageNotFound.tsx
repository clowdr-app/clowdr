import { ExternalLinkIcon } from "@chakra-ui/icons";
import { ButtonGroup, Link, Text } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Link as ReactLink, Route, Switch, useLocation } from "react-router-dom";
import LoginButton from "../Auth/Buttons/LoginButton";
import { ExternalLinkButton, LinkButton } from "../Chakra/LinkButton";
import { useMaybeConference } from "../Conference/useConference";
import { useMaybeCurrentRegistrant } from "../Conference/useCurrentRegistrant";
import { FAIcon } from "../Icons/FAIcon";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import { useTitle } from "../Utils/useTitle";
import GenericErrorPage from "./GenericErrorPage";

export default function PageNotFound(): JSX.Element {
    const title = useTitle("Page not found");
    const location = useLocation();
    const conferenceSlug = useMemo(() => {
        const matches = location.pathname.match(/^\/conference\/([^/]+)/);
        if (matches && matches.length > 1) {
            return matches[1];
        }
        return undefined;
    }, [location.pathname]);
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
                            <Route path={`/conference/${maybeConference.slug}/room/`}>
                                <Text fontSize="xl" lineHeight="revert" fontWeight="light" maxW={600}>
                                    You need to be a member of this room to access it. Please ask the room&apos;s owner
                                    or your conference organiser to add you to the room.
                                </Text>
                            </Route>
                            <Route path="/">
                                <Text fontSize="xl" lineHeight="revert" fontWeight="light" maxW={600}>
                                    You are logged in and registered for this conference but you cannot access this
                                    page. Either you do not have permission to access this page or the URL is invalid.
                                    Please contact your conference organiser for further information and assistance.
                                </Text>
                            </Route>
                        </Switch>
                    </>
                ) : conferenceSlug && loggedIn ? (
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
                    <Text fontSize="xl" lineHeight="revert" fontWeight="light" maxW={600}>
                        Please double check the URL, and if this error persists, please contact your conference
                        organiser.
                    </Text>
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
                        to={maybeConference ? `/conference/${maybeConference.slug}/` : "/"}
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
