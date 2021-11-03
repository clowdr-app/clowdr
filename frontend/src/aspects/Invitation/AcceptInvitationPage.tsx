import { gql } from "@apollo/client";
import {
    Alert,
    AlertDescription,
    AlertIcon,
    AlertTitle,
    Box,
    chakra,
    Code,
    Heading,
    HStack,
    List,
    ListItem,
    Spinner as UnboxedSpinner,
    Text,
    VStack,
} from "@chakra-ui/react";
import assert from "assert";
import React, { useEffect } from "react";
import { Redirect, useHistory } from "react-router-dom";
import { useInvitation_ConfirmCurrentMutation, useSelectInvitationForAcceptQuery } from "../../generated/graphql";
import LoginButton from "../Auth/Buttons/LoginButton";
import SignupButton from "../Auth/Buttons/SignUpButton";
import FAIcon from "../Icons/FAIcon";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import { setCachedInviteCode } from "../Users/NewUser/InviteCodeLocalStorage";
import { useTitle } from "../Utils/useTitle";

interface Props {
    inviteCode?: string;
}

gql`
    query SelectInvitationForAccept($inviteCode: uuid!) {
        registrant_Invitation(where: { inviteCode: { _eq: $inviteCode } }) {
            id
            invitedEmailAddress
        }
    }

    mutation Invitation_ConfirmCurrent($inviteCode: uuid!) {
        invitationConfirmCurrent(inviteCode: $inviteCode) {
            confSlug
            ok
        }
    }
`;

const Spinner = () => (
    <Box>
        <UnboxedSpinner />
    </Box>
);

function AcceptInvitationPage_LoggedIn_WithCode({ inviteCode }: { inviteCode: string }): JSX.Element {
    const [confirmCurrentMutation, { loading, error, data }] = useInvitation_ConfirmCurrentMutation();

    useEffect(() => {
        confirmCurrentMutation({
            variables: {
                inviteCode,
            },
        });
    }, [confirmCurrentMutation, inviteCode]);

    const history = useHistory();
    const errorMsg = data?.invitationConfirmCurrent?.ok ?? error?.message ?? "An unknown error";
    const duplicateRegistrantError =
        errorMsg ===
        // eslint-disable-next-line quotes
        'Uniqueness violation. duplicate key value violates unique constraint "Registrant_conferenceId_userId_key"';

    useEffect(() => {
        if (errorMsg === "true" || errorMsg.includes("same user") || duplicateRegistrantError) {
            assert(data?.invitationConfirmCurrent?.confSlug);
            history.push(`/conference/${data?.invitationConfirmCurrent?.confSlug}`);
        }
    }, [data?.invitationConfirmCurrent?.confSlug, duplicateRegistrantError, errorMsg, history]);

    return (
        <>
            <Heading
                as="h1"
                id="page-heading"
                fontSize="4.25rem"
                lineHeight="4.25rem"
                fontWeight="thin"
                marginBottom="2rem"
            >
                {!error ? "Accepting invitation..." : "Failed to accept invitation"}
            </Heading>
            {loading && !error ? (
                <Box>
                    <Text fontStyle="italic" marginBottom="0.2rem">
                        Please wait while we accept this invite:
                    </Text>
                    <Code padding="1rem" fontSize="1.1rem" aria-label="Your invite code" marginBottom="1rem">
                        {inviteCode}
                    </Code>
                </Box>
            ) : undefined}
            {loading && !error ? (
                <Spinner />
            ) : errorMsg !== "true" && !errorMsg.includes("same user") && !duplicateRegistrantError ? (
                <Alert
                    status="error"
                    variant="subtle"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    textAlign="center"
                    maxW={650}
                >
                    <AlertIcon boxSize="40px" mr={0} mt={4} />
                    <AlertTitle mt={4} mb={1} fontSize="lg">
                        {errorMsg}
                    </AlertTitle>
                    <AlertDescription>
                        <Box>
                            <Text textAlign="left">
                                {errorMsg === "Invitation already used"
                                    ? "The invitation code (shown below) has already been used. If you have an existing account, please try logging in (you don't need to use the invite code a second time). If you believe somebody else has used your invite code, please contact your conference organiser."
                                    : "We were unable to accept your invitation. Please contact technical support with a copy of the error message (shown above) and your invite code (shown below)."}
                            </Text>
                            <Code
                                mt={4}
                                padding="1rem"
                                fontSize="1.1rem"
                                aria-label="Your invite code"
                                marginBottom="1rem"
                            >
                                {inviteCode}
                            </Code>
                        </Box>
                    </AlertDescription>
                </Alert>
            ) : (
                <Spinner />
            )}
        </>
    );
}

export default function AcceptInvitationPage({ inviteCode }: Props): JSX.Element {
    const title = useTitle("Accept invitation");
    const { user, loading } = useMaybeCurrentUser();

    const { loading: inviteLoading, data: inviteData } = useSelectInvitationForAcceptQuery({
        context: {
            headers: {
                "SEND-WITHOUT-AUTH": true,
                "x-hasura-invite-code": inviteCode,
            },
        },
        variables: {
            inviteCode,
        },
        fetchPolicy: "network-only",
    });

    if (loading) {
        return (
            <Box>
                {title}
                <Spinner />
            </Box>
        );
    }

    if (user) {
        setCachedInviteCode(null);

        if (inviteCode) {
            return (
                <>
                    {title}
                    <AcceptInvitationPage_LoggedIn_WithCode inviteCode={inviteCode} />
                </>
            );
        } else {
            return <Redirect to="/join" />;
        }
    } else {
        setCachedInviteCode(inviteCode ?? null);

        return (
            <>
                {title}
                <Heading
                    as="h1"
                    id="page-heading"
                    fontSize="4.25rem"
                    lineHeight="4.25rem"
                    fontWeight="thin"
                    marginBottom="2rem"
                >
                    Sign up to Midspace
                </Heading>
                <Heading as="h2" fontSize="2.25rem" lineHeight="2.75rem" fontWeight="thin">
                    You&apos;re almost ready to join your conference.
                </Heading>
                <List maxW={650} spacing={5}>
                    <ListItem>
                        <HStack spacing={3} alignItems="flex-start">
                            <HStack>
                                <Text fontSize="lg" as="span">
                                    1.
                                </Text>
                                <FAIcon iconStyle="s" icon="user-plus" />
                            </HStack>
                            <VStack alignItems="flex-start">
                                <Text fontSize="lg">
                                    <chakra.span fontWeight="bold">Sign up for a Midspace account</chakra.span> or log
                                    into an existing one.
                                </Text>
                            </VStack>
                        </HStack>
                    </ListItem>
                    <ListItem>
                        <HStack spacing={3} alignItems="flex-start">
                            <HStack>
                                <Text fontSize="lg" as="span">
                                    2.
                                </Text>
                                <FAIcon iconStyle="s" icon="envelope" />
                            </HStack>
                            <VStack alignItems="flex-start">
                                <Text fontSize="lg" fontWeight="bold">
                                    Use your invite code
                                </Text>
                                <Text fontSize="sm">After logging in, you may be asked for your invite code.</Text>
                            </VStack>
                        </HStack>
                    </ListItem>
                    <ListItem>
                        <HStack spacing={3} alignItems="flex-start">
                            <HStack>
                                <Text fontSize="lg" as="span">
                                    3.
                                </Text>
                                <FAIcon iconStyle="s" icon="check" />
                            </HStack>
                            <VStack alignItems="flex-start">
                                <Text fontSize="lg" fontWeight="bold">
                                    Join your conference
                                </Text>
                                <Text fontSize="sm">
                                    After using you&apos;re invite code, you&apos;ll be ready to set up your profile and
                                    start attending your conference.
                                </Text>
                            </VStack>
                        </HStack>
                    </ListItem>
                </List>
                <HStack pt={5} maxW={650} spacing={4}>
                    <SignupButton
                        size="lg"
                        isLoading={inviteLoading}
                        emailHint={
                            inviteData?.registrant_Invitation.length
                                ? inviteData.registrant_Invitation[0].invitedEmailAddress
                                : undefined
                        }
                    />
                    <LoginButton
                        size="lg"
                        isLoading={inviteLoading}
                        emailHint={
                            inviteData?.registrant_Invitation.length
                                ? inviteData.registrant_Invitation[0].invitedEmailAddress
                                : undefined
                        }
                    />
                </HStack>
            </>
        );
    }
}
