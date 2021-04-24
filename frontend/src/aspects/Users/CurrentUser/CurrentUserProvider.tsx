import { gql } from "@apollo/client";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { Box, Button, Center, Checkbox, Container, Heading, Link, Text, Tooltip, VStack } from "@chakra-ui/react";
import React, { useCallback, useMemo, useState } from "react";
import {
    useAgreeToTermsMutation,
    UserInfoFragment,
    useSelectCurrentUserQuery,
    useTermsConfigsQuery,
} from "../../../generated/graphql";
import useUserId from "../../Auth/useUserId";
import CenteredSpinner from "../../Chakra/CenteredSpinner";
import { useRestorableState } from "../../Generic/useRestorableState";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import FAIcon from "../../Icons/FAIcon";
import { CurrentUserContext, defaultCurrentUserContext, UserInfo } from "./useMaybeCurrentUser";

gql`
    fragment AttendeeFields on Attendee {
        id
        userId
        conferenceId
        displayName
        createdAt
        updatedAt
        profile {
            attendeeId
            photoURL_50x50
        }
        conference {
            id
            name
            shortName
            slug
        }
        groupAttendees {
            id
            group {
                id
                enabled
                name
                groupRoles {
                    id
                    role {
                        id
                        name
                        rolePermissions {
                            id
                            permissionName
                        }
                    }
                }
            }
        }
    }

    fragment UserInfo on User {
        id
        email
        lastName
        firstName
        acceptedTermsAt
        acceptedPrivacyPolicyAt
        attendees {
            ...AttendeeFields
        }
    }

    query SelectCurrentUser($userId: String!) {
        User_by_pk(id: $userId) {
            ...UserInfo
        }
    }
`;

export default function CurrentUserProvider({
    children,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
}): JSX.Element {
    const userId = useUserId();

    if (userId) {
        return <CurrentUserProvider_IsAuthenticated userId={userId}>{children}</CurrentUserProvider_IsAuthenticated>;
    } else {
        return <CurrentUserProvider_NotAuthenticated>{children}</CurrentUserProvider_NotAuthenticated>;
    }
}

function CurrentUserProvider_NotAuthenticated({ children }: { children: string | JSX.Element | Array<JSX.Element> }) {
    const ctx = useMemo(
        () => ({
            ...defaultCurrentUserContext,
            loading: false,
        }),
        []
    );
    return <CurrentUserContext.Provider value={ctx}>{children}</CurrentUserContext.Provider>;
}

gql`
    query TermsConfigs {
        hostOrganisationName: system_Configuration_by_pk(key: HOST_ORGANISATION_NAME) {
            key
            value
            updated_at
        }
        termsTimestamp: system_Configuration_by_pk(key: TERMS_LATEST_REVISION_TIMESTAMP) {
            key
            value
            updated_at
        }
        termsURL: system_Configuration_by_pk(key: TERMS_URL) {
            key
            value
            updated_at
        }
        ppTimestamp: system_Configuration_by_pk(key: PRIVACY_POLICY_LATEST_REVISION_TIMESTAMP) {
            key
            value
            updated_at
        }
        ppURL: system_Configuration_by_pk(key: PRIVACY_POLICY_URL) {
            key
            value
            updated_at
        }
        cookiesTimestamp: system_Configuration_by_pk(key: COOKIE_POLICY_LATEST_REVISION_TIMESTAMP) {
            key
            value
            updated_at
        }
        cookiesURL: system_Configuration_by_pk(key: COOKIE_POLICY_URL) {
            key
            value
            updated_at
        }
    }
`;

function CurrentUserProvider_IsAuthenticated({
    children,
    userId,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
    userId: string;
}) {
    const { loading, error, data, refetch } = useSelectCurrentUserQuery({
        variables: {
            userId,
        },
        nextFetchPolicy: "cache-first",
    });
    useQueryErrorToast(error, false, "useSelectCurrentUserQuery");

    const { loading: termsLoading, data: termsData } = useTermsConfigsQuery();

    const value = loading ? undefined : error ? false : data;
    const ctx = useMemo(() => {
        const result: UserInfo = {
            loading,
            user: value ? (value?.User_by_pk as UserInfoFragment) ?? false : value,
            refetchUser: refetch,
        };

        return result;
    }, [loading, refetch, value]);

    const acceptedTermsAt = useMemo(() => ctx.user && Date.parse(ctx.user.acceptedTermsAt), [ctx.user]);
    const acceptedPPAt = useMemo(() => ctx.user && Date.parse(ctx.user.acceptedPrivacyPolicyAt), [ctx.user]);
    const [acceptedCookiesAt, setAcceptedCookiesAt] = useRestorableState<number | null>(
        "COOKIE_POLICY_ACCEPTED_AT",
        null,
        (x) => (x === null ? "" : x.toFixed(0)),
        (x) => (x === "" ? null : parseInt(x, 10))
    );

    if (termsLoading || loading) {
        return <CenteredSpinner spinnerProps={{ label: "Loading terms configuration" }} />;
    }

    if (termsData && termsData.hostOrganisationName) {
        if (termsData.cookiesTimestamp && termsData.cookiesURL) {
            const cookiesTimestamp: number = termsData.cookiesTimestamp.value;
            const cookiesURL: string = termsData.cookiesURL.value;
            if (!acceptedCookiesAt || cookiesTimestamp > acceptedCookiesAt) {
                return (
                    <CookiePolicyCompliance
                        cookiesURL={cookiesURL}
                        setAcceptedCookiesAt={setAcceptedCookiesAt}
                        hostOrganisationName={termsData.hostOrganisationName.value}
                    />
                );
            }
        }

        if (termsData.ppTimestamp && termsData.ppURL && termsData.termsTimestamp && termsData.termsURL) {
            const ppTimestamp: number = termsData.ppTimestamp.value;
            const termsTimestamp: number = termsData.termsTimestamp.value;

            if (!acceptedPPAt || !acceptedTermsAt || ppTimestamp > acceptedPPAt || termsTimestamp > acceptedTermsAt) {
                return (
                    <TermsAndPPCompliance
                        hostOrganisationName={termsData.hostOrganisationName.value}
                        ppURL={termsData.ppURL.value}
                        termsURL={termsData.termsURL.value}
                        userId={userId}
                    />
                );
            }
        }
    }

    return <CurrentUserContext.Provider value={ctx}>{children}</CurrentUserContext.Provider>;
}

function CookiePolicyCompliance({
    cookiesURL,
    setAcceptedCookiesAt,
    hostOrganisationName,
}: {
    cookiesURL: string;
    setAcceptedCookiesAt: React.Dispatch<React.SetStateAction<number | null>>;
    hostOrganisationName: string;
}) {
    return (
        <Center mt={10}>
            <Container>
                <VStack spacing={4}>
                    <Heading as="h1">Cookies</Heading>
                    <Text>
                        The Clowdr software (hosted by {hostOrganisationName}) requires the use of cookies in order to
                        deliver the software service to you. Please{" "}
                        <Link isExternal href={cookiesURL}>
                            read the cookie policy
                            <ExternalLinkIcon ml={1} fontSize="xs" />
                        </Link>{" "}
                        before continuining.
                    </Text>
                    <Text>
                        By clicking &ldquo;Agree and continue&rdquo;, you agree to the use of cookies in accordance with{" "}
                        <Link isExternal href={cookiesURL}>
                            the policy
                            <ExternalLinkIcon ml={1} fontSize="xs" />
                        </Link>
                        .
                    </Text>
                    <Button colorScheme="green" onClick={() => setAcceptedCookiesAt(Date.now())}>
                        <FAIcon iconStyle="r" icon="check-square" aria-hidden mr={2} />
                        Agree and continue
                    </Button>
                </VStack>
            </Container>
        </Center>
    );
}

gql`
    mutation AgreeToTerms($userId: String!, $at: timestamptz!) {
        update_User_by_pk(pk_columns: { id: $userId }, _set: { acceptedTermsAt: $at, acceptedPrivacyPolicyAt: $at }) {
            id
            acceptedTermsAt
            acceptedPrivacyPolicyAt
        }
    }
`;

function TermsAndPPCompliance({
    ppURL,
    termsURL,
    hostOrganisationName,
    userId,
}: {
    ppURL: string;
    termsURL: string;
    hostOrganisationName: string;
    userId: string;
}): JSX.Element {
    const [termsChecked, setTermsChecked] = useState<boolean>(false);
    const [ppChecked, setPPChecked] = useState<boolean>(false);
    const [agreeToTerms, agreeToTermsResponse] = useAgreeToTermsMutation();

    const agreeAndContinue = useCallback(() => {
        agreeToTerms({
            variables: {
                userId,
                at: new Date().toISOString(),
            },
        });
    }, [agreeToTerms, userId]);

    return (
        <Center mt={10}>
            <Container>
                <VStack spacing={4}>
                    <Heading as="h1">Terms of Service</Heading>
                    <Text>
                        Please read and agree to the{" "}
                        <Link isExternal href={termsURL}>
                            terms and conditions
                            <ExternalLinkIcon ml={1} fontSize="xs" />
                        </Link>{" "}
                        and{" "}
                        <Link isExternal href={ppURL}>
                            privacy policy
                            <ExternalLinkIcon ml={1} fontSize="xs" />
                        </Link>{" "}
                        before continuing to use the Clowdr software hosted by {hostOrganisationName}.
                    </Text>
                    <VStack alignItems="flex-start">
                        <Checkbox isChecked={termsChecked} onChange={(ev) => setTermsChecked(ev.target.checked)}>
                            I agree to the {hostOrganisationName}{" "}
                            <Link isExternal href={termsURL}>
                                terms and conditions.
                                <ExternalLinkIcon ml={1} fontSize="xs" />
                            </Link>
                        </Checkbox>
                        <Checkbox isChecked={ppChecked} onChange={(ev) => setPPChecked(ev.target.checked)}>
                            I agree to the {hostOrganisationName}{" "}
                            <Link isExternal href={ppURL}>
                                privacy policy.
                                <ExternalLinkIcon ml={1} fontSize="xs" />
                            </Link>
                        </Checkbox>
                    </VStack>
                    <Tooltip
                        label={
                            !termsChecked
                                ? "Please agree to the terms and conditions"
                                : !ppChecked
                                ? "Please agree to the privacy policy"
                                : undefined
                        }
                    >
                        <Box>
                            <Button
                                colorScheme="green"
                                onClick={() => agreeAndContinue()}
                                isDisabled={!termsChecked || !ppChecked}
                                isLoading={agreeToTermsResponse.loading}
                            >
                                <FAIcon iconStyle="s" icon="signature" aria-hidden mr={2} />
                                Confirm and continue
                            </Button>
                        </Box>
                    </Tooltip>
                </VStack>
            </Container>
        </Center>
    );
}
