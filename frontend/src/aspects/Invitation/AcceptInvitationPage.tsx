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
        Invitation(where: { inviteCode: { _eq: $inviteCode } }) {
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

// async function digest(inviteCode: string, email: string) {
//     const encoder = new TextEncoder();
//     const data = encoder.encode(inviteCode + email);
//     const hashBuffer = await crypto.subtle.digest("SHA-256", data);
//     const hashArray = Array.from(new Uint8Array(hashBuffer));
//     const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
//     return hashHex;
// }

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
    const duplicateAttendeeError =
        errorMsg ===
        // eslint-disable-next-line quotes
        'Uniqueness violation. duplicate key value violates unique constraint "Attendee_conferenceId_userId_key"';

    useEffect(() => {
        if (errorMsg === "true" || errorMsg.includes("same user") || duplicateAttendeeError) {
            assert(data?.invitationConfirmCurrent?.confSlug);
            history.push(`/conference/${data?.invitationConfirmCurrent?.confSlug}`);
        }
    }, [data?.invitationConfirmCurrent?.confSlug, duplicateAttendeeError, errorMsg, history]);

    return (
        <>
            <Heading as="h1" fontSize="4.25rem" lineHeight="4.25rem" fontWeight="thin" marginBottom="2rem">
                {loading && !error ? "Accepting invitation..." : "Failed to accept invitation"}
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
            ) : errorMsg !== "true" && !errorMsg.includes("same user") && !duplicateAttendeeError ? (
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
                                    ? "The invitation code (shown below) has already been used. Perhaps you are logged into the wrong account? If you believe somebody else has used your invite code, please contact your conference organiser."
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
                <Heading as="h1" fontSize="4.25rem" lineHeight="4.25rem" fontWeight="thin" marginBottom="2rem">
                    Welcome to Clowdr
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
                                    <chakra.span fontWeight="bold">Sign up to a Clowdr account</chakra.span> or log into
                                    an existing one.
                                </Text>
                                <Text fontSize="sm">
                                    When you sign up you will be asked to confirm your email address.
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
                                <Text fontSize="sm">
                                    After confirming your email address, you&apos;ll be asked for your invite code.
                                </Text>
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
                            inviteData?.Invitation.length ? inviteData.Invitation[0].invitedEmailAddress : undefined
                        }
                    />
                    <LoginButton
                        size="lg"
                        isLoading={inviteLoading}
                        emailHint={
                            inviteData?.Invitation.length ? inviteData.Invitation[0].invitedEmailAddress : undefined
                        }
                    />
                </HStack>
            </>
        );
    }
}

//     const toast = useToast();
//     const { user, loading: isUserLoading } = useMaybeCurrentUser();
//     const { loading, error, data } = useSelectInvitationForAcceptQuery({
//         context: {
//             headers: {
//                 "SEND-WITHOUT-AUTH": true,
//                 "x-hasura-invite-code": inviteCode,
//             },
//         },
//         variables: {
//             inviteCode,
//         },
//         fetchPolicy: "network-only",
//     });
//     useQueryErrorToast(error, false, "AcceptInvitationPage");

//     const [hashOK, setHashOK] = useState<boolean>();
//     useEffect(() => {
//         (async () => {
//             if (inviteCode && user && data?.Invitation) {
//                 const email = user.email;
//                 assert(email);
//                 const hashToCheck = await digest(inviteCode, email);
//                 if (hashToCheck === data.Invitation[0].hash) {
//                     setHashOK(true);
//                 } else {
//                     setHashOK(false);
//                 }
//             }
//         })();
//     }, [data?.Invitation, inviteCode, user]);

//     const [confirmWithCodeMutation] = useInvitation_ConfirmWithCodeMutation();
//     const [sendInitialEmailMutation] = useSendInitialConfirmationEmailMutation();
//     const [sendRepeatEmailMutation] = useSendRepeatConfirmationEmailMutation();

//     if (!inviteCode) {
//         return <Redirect to="/" />;
//     }

//     if (loading || isUserLoading) {
//         return (
//             <Box>
//                 {title}
//                 <Spinner />
//             </Box>
//         );
//     }

//     if (user) {
//         if (error || !data) {
//             return (
//                 <>
//                     {title}
//                     <PageFailedToLoad>
//                         Sorry, we were unable to load the page due to an unrecognised error. Please try again later or
//                         contact our support teams if this error persists.
//                     </PageFailedToLoad>
//                 </>
//             );
//         } else if (!data.Invitation.length) {
//             setCachedInviteCode(null);
//             if (user.attendees.length > 0) {
//                 toast({
//                     description:
//                         "Invitation code not found - did you already use it? You might see your conference listed below.",
//                     status: "info",
//                     title: "Invite code not found",
//                     duration: 5000,
//                     isClosable: true,
//                     position: "top",
//                 });
//                 return <Redirect to="/user" />;
//             } else {
//                 return (
//                     <GenericErrorPage heading="Invitation not found">
//                         <>
//                             {title}
//                             <Text fontSize="xl" lineHeight="revert" fontWeight="light">
//                                 Sorry, that invitation no longer exists. If you already accepted your invitation, please
//                                 check <a href="/">your list of conferences</a>. Please also make sure you are logged in
//                                 with the right email address.
//                             </Text>
//                         </>
//                     </GenericErrorPage>
//                 );
//             }
//         } else {
//             if (hashOK === undefined) {
//                 return (
//                     <Box>
//                         {title}
//                         <Spinner />
//                     </Box>
//                 );
//             } else {
//                 if (hashOK) {
//                     return (
//                         <>
//                             {title}
//                             <Heading
//                                 as="h1"
//                                 fontSize="4.25rem"
//                                 lineHeight="4.25rem"
//                                 fontWeight="thin"
//                                 marginBottom="4rem"
//                             >
//                                 Confirming invitation
//                             </Heading>
//                             <Text>Please wait, you will be taken to your conference shortly.</Text>
//                             <Box>
//                                 <Spinner />
//                             </Box>
//                         </>
//                     );
//                 } else {

// Dead code for using the extra "confirm your email" step:
// TODO: (Noted 2021-02-02 by Ed): Delete this at some point once we know it's not needed
//                     return (
//                         <>
//                             {title}
//                             <Heading
//                                 as="h1"
//                                 fontSize="4.25rem"
//                                 lineHeight="4.25rem"
//                                 fontWeight="thin"
//                                 marginBottom="2rem"
//                             >
//                                 Confirmation email
//                             </Heading>
//                             <Text maxW={800}>
//                                 Since you are using a different email address to log into Clowdr ({user.email}) from the
//                                 email address your invitation was sent to, we just need to confirm who you are.
//                             </Text>
//                             <Text maxW={800}>
//                                 We have sent a confirmation code to the same email address as your invitation. This may
//                                 take a few minutes to arrive. Please also check your spam/junk folder.
//                             </Text>
//                             <Formik
//                                 initialValues={{
//                                     code: "",
//                                 }}
//                                 onSubmit={async (values) => {
//                                     const result = await confirmWithCodeMutation({
//                                         variables: {
//                                             inviteCode,
//                                             confirmationCode: values.code.trim().toLowerCase(),
//                                         },
//                                     });

//                                     if (result.data?.invitationConfirmWithCode?.ok) {
//                                         assert(result.data?.invitationConfirmWithCode?.confSlug);
//                                         setConfirmedConfSlug(result.data?.invitationConfirmWithCode?.confSlug);
//                                     } else {
//                                         toast({
//                                             description:
//                                                 "We were unable to confirm your invitation. Please double check your confirmation code or try again later.",
//                                             isClosable: true,
//                                             status: "error",
//                                             title: "Unable to confirm invitation",
//                                         });
//                                     }
//                                 }}
//                             >
//                                 {(_props) => (
//                                     <Form>
//                                         <Field name="code" validate={(v: string) => v.length < 35}>
//                                             {({ field, form }: FieldProps<string>) => (
//                                                 <FormControl isInvalid={!!form.errors.code && !!form.touched.code}>
//                                                     <FormLabel htmlFor="name">Confirmation code</FormLabel>
//                                                     <InputGroup>
//                                                         <Input {...field} id="code" placeholder="Confirmation code" />
//                                                         <InputRightAddon padding={0}>
//                                                             <Button
//                                                                 type="submit"
//                                                                 margin={0}
//                                                                 borderTopLeftRadius={0}
//                                                                 borderBottomLeftRadius={0}
//                                                                 aria-label="Submit confirmation code"
//                                                                 isDisabled={!form.isValid}
//                                                                 colorScheme="green"
//                                                             >
//                                                                 Submit
//                                                             </Button>
//                                                         </InputRightAddon>
//                                                     </InputGroup>
//                                                     <FormErrorMessage>{form.errors.code}</FormErrorMessage>
//                                                 </FormControl>
//                                             )}
//                                         </Field>
//                                     </Form>
//                                 )}
//                             </Formik>
//                             <Button
//                                 aria-label="Resend confirmation email"
//                                 onClick={async (_ev) => {
//                                     const result = await sendRepeatEmailMutation({
//                                         variables: {
//                                             inviteCode,
//                                         },
//                                     });

//                                     if (result.data?.invitationConfirmSendRepeatEmail?.sent) {
//                                         toast({
//                                             description:
//                                                 "We have resent your confirmation email. This email may take a few minutes to be delivered. Please check both your inbox and/or spam folders.",
//                                             isClosable: true,
//                                             duration: 8000,
//                                             status: "success",
//                                         });
//                                     } else {
//                                         toast({
//                                             description:
//                                                 "We were unable to resend your confirmation email. Please try again later.",
//                                             isClosable: true,
//                                             status: "error",
//                                         });
//                                     }
//                                 }}
//                             >
//                                 Resend confirmation email
//                             </Button>
//                         </>
//                     );
//                 }
//             }
//         }
