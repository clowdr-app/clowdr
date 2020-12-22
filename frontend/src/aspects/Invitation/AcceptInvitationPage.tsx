import { gql } from "@apollo/client";
import {
    Box,
    Button,
    Code,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Heading,
    HStack,
    Input,
    InputGroup,
    InputRightAddon,
    List,
    ListItem,
    Spinner as UnboxedSpinner,
    Text,
    useToast,
} from "@chakra-ui/react";
import assert from "assert";
import { Field, FieldProps, Form, Formik } from "formik";
import React, { useEffect, useState } from "react";
import { Redirect, useHistory } from "react-router-dom";
import {
    useInvitation_ConfirmCurrentMutation,
    useInvitation_ConfirmWithCodeMutation,
    useSelectInvitationForAcceptQuery,
    useSendInitialConfirmationEmailMutation,
    useSendRepeatConfirmationEmailMutation,
} from "../../generated/graphql";
import LoginButton from "../Auth/Buttons/LoginButton";
import SignupButton from "../Auth/Buttons/SignUpButton";
import GenericErrorPage from "../Errors/GenericErrorPage";
import PageFailedToLoad from "../Errors/PageFailedToLoad";
import useQueryErrorToast from "../GQL/useQueryErrorToast";
import FAIcon from "../Icons/FAIcon";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import { getCachedInviteCode, setCachedInviteCode } from "../Users/NewUser/InviteCodeLocalStorage";

interface Props {
    inviteCode?: string;
}

gql`
    query SelectInvitationForAccept($inviteCode: uuid!) {
        Invitation(where: { inviteCode: { _eq: $inviteCode } }) {
            hash
        }
    }

    mutation Invitation_ConfirmCurrent($inviteCode: uuid!) {
        invitationConfirmCurrent(inviteCode: $inviteCode) {
            confSlug
            ok
        }
    }

    mutation Invitation_ConfirmWithCode($inviteCode: uuid!, $confirmationCode: String!) {
        invitationConfirmWithCode(inviteInput: { inviteCode: $inviteCode, confirmationCode: $confirmationCode }) {
            confSlug
            ok
        }
    }

    mutation SendInitialConfirmationEmail($inviteCode: uuid!) {
        invitationConfirmSendInitialEmail(inviteInput: { inviteCode: $inviteCode }) {
            sent
        }
    }

    mutation SendRepeatConfirmationEmail($inviteCode: uuid!) {
        invitationConfirmSendRepeatEmail(inviteInput: { inviteCode: $inviteCode }) {
            sent
        }
    }
`;

const Spinner = () => (
    <Box>
        <UnboxedSpinner />
    </Box>
);

async function digest(inviteCode: string, email: string) {
    const encoder = new TextEncoder();
    const data = encoder.encode(inviteCode + email);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return hashHex;
}

export default function AcceptInvitationPage(props: Props): JSX.Element {
    const toast = useToast();

    const inviteCode = (props.inviteCode ?? getCachedInviteCode())?.trim()?.toLowerCase();
    useEffect(() => {
        if (props.inviteCode) {
            setCachedInviteCode(props.inviteCode);
        }
    }, [props.inviteCode]);

    const { user, loading: isUserLoading } = useMaybeCurrentUser();

    const { loading, error, data } = useSelectInvitationForAcceptQuery({
        context: {
            headers: {
                "SEND-WITHOUT-AUTH": true,
                "x-hasura-invite-code": inviteCode,
            },
        },
        variables: {
            inviteCode,
        },
    });
    useQueryErrorToast(error);

    const [hashOK, setHashOK] = useState<boolean>();
    useEffect(() => {
        (async () => {
            if (inviteCode && user && data?.Invitation) {
                const email = user.email;
                assert(email);
                const hashToCheck = await digest(inviteCode, email);
                if (hashToCheck === data.Invitation[0].hash) {
                    setHashOK(true);
                } else {
                    setHashOK(false);
                }
            }
        })();
    }, [data?.Invitation, inviteCode, user]);

    const [confirmCurrentMutation] = useInvitation_ConfirmCurrentMutation();
    const [confirmWithCodeMutation] = useInvitation_ConfirmWithCodeMutation();
    const [sendInitialEmailMutation] = useSendInitialConfirmationEmailMutation();
    const [sendRepeatEmailMutation] = useSendRepeatConfirmationEmailMutation();

    const [confirmedConfSlug, setConfirmedConfSlug] = useState<string>();
    useEffect(() => {
        (async () => {
            if (user && !error && data) {
                if (hashOK) {
                    const result = await confirmCurrentMutation({
                        variables: {
                            inviteCode,
                        },
                    });
                    if (result.data?.invitationConfirmCurrent?.ok) {
                        assert(result.data?.invitationConfirmCurrent?.confSlug);
                        setConfirmedConfSlug(result.data?.invitationConfirmCurrent?.confSlug);
                    } else {
                        toast({
                            description:
                                "We were unable to confirm your invitation due to an unknown error. Please contact technical support.",
                            isClosable: true,
                            status: "error",
                            title: "Unable to confirm invitation",
                        });
                    }
                } else {
                    const result = await sendInitialEmailMutation({
                        variables: {
                            inviteCode,
                        },
                    });

                    if (!result.data?.invitationConfirmSendInitialEmail?.sent) {
                        toast({
                            description: "We were unable to your initial confirmation email. Please try again later.",
                            isClosable: true,
                            status: "error",
                        });
                    }
                }
            }
        })();
    }, [confirmCurrentMutation, data, error, hashOK, inviteCode, sendInitialEmailMutation, toast, user]);

    const history = useHistory();
    useEffect(() => {
        if (confirmedConfSlug) {
            setCachedInviteCode(null);
            history.push(`/conference/${confirmedConfSlug}`);
        }
    }, [confirmedConfSlug, history]);

    if (!inviteCode) {
        return <Redirect to="/" />;
    }

    if (loading || isUserLoading) {
        return <Spinner />;
    }

    if (user) {
        if (error || !data) {
            return (
                <PageFailedToLoad>
                    Sorry, we were unable to load the page due to an unrecognised error. Please try again later or
                    contact our support teams if this error persists.
                </PageFailedToLoad>
            );
        } else if (!data.Invitation.length) {
            setCachedInviteCode(null);
            return (
                <GenericErrorPage heading="Invitation not found">
                    <Text fontSize="xl" lineHeight="revert" fontWeight="light">
                        Sorry, that invitation no longer exists. If you already accepted your invitation, please check{" "}
                        <a href="/">your list of conferences</a>. Please also make sure you are logged in with the right
                        email address.
                    </Text>
                </GenericErrorPage>
            );
        } else {
            if (hashOK === undefined) {
                return <Spinner />;
            } else {
                if (hashOK) {
                    return (
                        <>
                            <Heading
                                as="h1"
                                fontSize="4.25rem"
                                lineHeight="4.25rem"
                                fontWeight="thin"
                                marginBottom="4rem"
                            >
                                Confirming invitation
                            </Heading>
                            <Text>Please wait, you will be taken to your conference shortly.</Text>
                            <Box>
                                <Spinner />
                            </Box>
                        </>
                    );
                } else {
                    return (
                        <>
                            <Heading
                                as="h1"
                                fontSize="4.25rem"
                                lineHeight="4.25rem"
                                fontWeight="thin"
                                marginBottom="2rem"
                            >
                                Confirmation email
                            </Heading>
                            <Text maxW={800}>
                                Since you are using a different email address to log into Clowdr (
                                {user.email}) from the email address your invitation was sent to, we just
                                need to confirm who you are.
                            </Text>
                            <Text maxW={800}>
                                We have sent a confirmation code to the same email address as your invitation. This may
                                take a few minutes to arrive. Please also check your spam/junk folder.
                            </Text>
                            <Formik
                                initialValues={{
                                    code: "",
                                }}
                                onSubmit={async (values) => {
                                    const result = await confirmWithCodeMutation({
                                        variables: {
                                            inviteCode,
                                            confirmationCode: values.code.trim().toLowerCase(),
                                        },
                                    });

                                    if (result.data?.invitationConfirmWithCode?.ok) {
                                        assert(result.data?.invitationConfirmWithCode?.confSlug);
                                        setConfirmedConfSlug(result.data?.invitationConfirmWithCode?.confSlug);
                                    } else {
                                        toast({
                                            description:
                                                "We were unable to confirm your invitation. Please double check your confirmation code or try again later.",
                                            isClosable: true,
                                            status: "error",
                                            title: "Unable to confirm invitation",
                                        });
                                    }
                                }}
                            >
                                {(_props) => (
                                    <Form>
                                        <Field name="code" validate={(v: string) => v.length < 35}>
                                            {({ field, form }: FieldProps<string>) => (
                                                <FormControl isInvalid={!!form.errors.code && !!form.touched.code}>
                                                    <FormLabel htmlFor="name">Confirmation code</FormLabel>
                                                    <InputGroup>
                                                        <Input {...field} id="code" placeholder="Confirmation code" />
                                                        <InputRightAddon padding={0}>
                                                            <Button
                                                                type="submit"
                                                                margin={0}
                                                                borderTopLeftRadius={0}
                                                                borderBottomLeftRadius={0}
                                                                aria-label="Submit confirmation code"
                                                                isDisabled={!form.isValid}
                                                                colorScheme="green"
                                                            >
                                                                Submit
                                                            </Button>
                                                        </InputRightAddon>
                                                    </InputGroup>
                                                    <FormErrorMessage>{form.errors.code}</FormErrorMessage>
                                                </FormControl>
                                            )}
                                        </Field>
                                    </Form>
                                )}
                            </Formik>
                            <Button
                                aria-label="Resend confirmation email"
                                onClick={async (_ev) => {
                                    const result = await sendRepeatEmailMutation({
                                        variables: {
                                            inviteCode,
                                        },
                                    });

                                    if (result.data?.invitationConfirmSendRepeatEmail?.sent) {
                                        toast({
                                            description:
                                                "We have resent your confirmation email. This email may take a few minutes to be delivered. Please check both your inbox and/or spam folders.",
                                            isClosable: true,
                                            duration: 8000,
                                            status: "success",
                                        });
                                    } else {
                                        toast({
                                            description:
                                                "We were unable to resend your confirmation email. Please try again later.",
                                            isClosable: true,
                                            status: "error",
                                        });
                                    }
                                }}
                            >
                                Resend confirmation email
                            </Button>
                        </>
                    );
                }
            }
        }
    } else {
        return (
            <>
                <Heading as="h1" fontSize="4.25rem" lineHeight="4.25rem" fontWeight="thin" marginBottom="2rem">
                    Accept an invitation
                </Heading>
                <Box>
                    <Text fontStyle="italic" marginBottom="0.2rem">
                        Your invite code is:
                    </Text>
                    <Code padding="1rem" fontSize="1.25rem" aria-label="Your invite code" marginBottom="1rem">
                        {inviteCode}
                    </Code>
                </Box>
                <Heading as="h2" fontSize="2.25rem" lineHeight="2.75rem" fontWeight="thin" maxW={650}>
                    Welcome to Clowdr, you&apos;re almost ready to join your conference.
                </Heading>
                <Text maxW={650}>
                    To accept your invitation please sign in to your existing Clowdr account or create a new one by
                    signing up.
                </Text>
                <List maxW={650} spacing={5}>
                    <ListItem>
                        <HStack spacing={3}>
                            <FAIcon iconStyle="s" icon="check" />
                            <Text>
                                If you use the same email address as your invitation, you&apos;ll be ready to go right
                                away.
                            </Text>
                        </HStack>
                    </ListItem>
                    <ListItem>
                        <HStack spacing={3}>
                            <FAIcon iconStyle="s" icon="envelope" />
                            <Text>
                                If you use a different email address, we will send a confirmation email to your
                                invitation address, just to check it&apos;s you.
                            </Text>
                        </HStack>
                    </ListItem>
                </List>
                <HStack>
                    <LoginButton />
                    <SignupButton />
                </HStack>
            </>
        );
    }
}
