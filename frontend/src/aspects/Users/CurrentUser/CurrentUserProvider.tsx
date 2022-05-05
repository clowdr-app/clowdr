import { ExternalLinkIcon } from "@chakra-ui/icons";
import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Center,
    Checkbox,
    Container,
    Heading,
    Link,
    Spacer,
    Text,
    Tooltip,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import React, { useCallback, useMemo, useState } from "react";
import type { UserInfoFragment } from "../../../generated/graphql";
import { useAgreeToTermsMutation, useSelectCurrentUserQuery, useTermsConfigsQuery } from "../../../generated/graphql";
import useUserId from "../../Auth/useUserId";
import CenteredSpinner from "../../Chakra/CenteredSpinner";
import FAIcon from "../../Chakra/FAIcon";
import { makeContext } from "../../GQL/make-context";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
import { useRestorableState } from "../../Hooks/useRestorableState";
import type { UserInfo } from "./useMaybeCurrentUser";
import { CurrentUserContext, defaultCurrentUserContext } from "./useMaybeCurrentUser";

gql`
    fragment UserInfo on User {
        id
        email
        acceptedTermsAt
        acceptedPrivacyPolicyAt
    }

    query SelectCurrentUser($userId: String!, $refresh: Boolean!) @cached(refresh: $refresh) {
        User_by_pk(id: $userId) {
            ...UserInfo
        }
    }
`;

export default function CurrentUserProvider({
    children,
}: {
    children: (children?: JSX.Element) => JSX.Element;
}): JSX.Element {
    const userId = useUserId();

    if (userId) {
        return <CurrentUserProvider_IsAuthenticated userId={userId}>{children}</CurrentUserProvider_IsAuthenticated>;
    } else {
        return <CurrentUserProvider_NotAuthenticated>{children}</CurrentUserProvider_NotAuthenticated>;
    }
}

function CurrentUserProvider_NotAuthenticated({ children }: { children: (children?: JSX.Element) => JSX.Element }) {
    const ctx = useMemo(
        () => ({
            ...defaultCurrentUserContext,
            loading: false,
        }),
        []
    );
    return <CurrentUserContext.Provider value={ctx}>{children()}</CurrentUserContext.Provider>;
}

gql`
    query TermsConfigs @cached {
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
    children: (children?: JSX.Element) => JSX.Element;
    userId: string;
}) {
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.User,
                NoConferenceId: "true",
            }),
        []
    );
    const [refreshCurrentUser, setRefreshCurrentUser] = useState<boolean>(false);
    const [{ fetching: loading, error, data }, refreshSelectCurrentUser] = useSelectCurrentUserQuery({
        variables: {
            userId,
            refresh: refreshCurrentUser,
        },
        context,
    });
    useQueryErrorToast(error, false, "useSelectCurrentUserQuery");
    // TODO: remove this hack once the cache is fixed to immediately reflect result of the `AgreeToTerms` mutation.
    const forceRefresh = useCallback(() => {
        setRefreshCurrentUser(true);
        setTimeout(() => {
            refreshSelectCurrentUser({
                requestPolicy: "network-only",
            });
        }, 10);
    }, [refreshSelectCurrentUser]);

    const [{ fetching: termsLoading, data: termsData }] = useTermsConfigsQuery();

    const value = loading ? undefined : error ? false : data;
    const ctx = useMemo(() => {
        const result: UserInfo = {
            loading,
            user: value ? (value?.User_by_pk as UserInfoFragment) ?? false : value,
        };

        return result;
    }, [loading, value]);

    const acceptedTermsAt = useMemo(() => ctx.user && Date.parse(ctx.user.acceptedTermsAt), [ctx.user]);
    const acceptedPPAt = useMemo(() => ctx.user && Date.parse(ctx.user.acceptedPrivacyPolicyAt), [ctx.user]);
    const [acceptedCookiesAt, setAcceptedCookiesAt] = useRestorableState<number | null>(
        "COOKIE_POLICY_ACCEPTED_AT",
        null,
        (x) => (x === null ? "" : x.toFixed(0)),
        (x) => (x === "" ? null : parseInt(x, 10))
    );

    if (termsLoading || loading) {
        return (
            <CurrentUserContext.Provider value={ctx}>
                {children(
                    <CenteredSpinner
                        caller="CurrentUserProvider:179"
                        spinnerProps={{ label: "Loading terms configuration" }}
                    />
                )}
            </CurrentUserContext.Provider>
        );
    }

    if (termsData && termsData.hostOrganisationName) {
        if (termsData.cookiesTimestamp && termsData.cookiesURL) {
            const cookiesTimestamp: number = termsData.cookiesTimestamp.value;
            const cookiesURL: string = termsData.cookiesURL.value;
            if (!acceptedCookiesAt || cookiesTimestamp > acceptedCookiesAt) {
                return (
                    <CurrentUserContext.Provider value={ctx}>
                        {children(
                            <CookiePolicyCompliance
                                cookiesURL={cookiesURL}
                                setAcceptedCookiesAt={setAcceptedCookiesAt}
                                hostOrganisationName={termsData.hostOrganisationName.value}
                                policyChanged={!!acceptedCookiesAt && cookiesTimestamp > acceptedCookiesAt}
                            />
                        )}
                    </CurrentUserContext.Provider>
                );
            }
        }

        if (termsData.ppTimestamp && termsData.ppURL && termsData.termsTimestamp && termsData.termsURL) {
            const ppTimestamp: number = termsData.ppTimestamp.value;
            const termsTimestamp: number = termsData.termsTimestamp.value;

            if (!acceptedPPAt || !acceptedTermsAt || ppTimestamp > acceptedPPAt || termsTimestamp > acceptedTermsAt) {
                return (
                    <CurrentUserContext.Provider value={ctx}>
                        {children(
                            <TermsAndPPCompliance
                                hostOrganisationName={termsData.hostOrganisationName.value}
                                ppURL={termsData.ppURL.value}
                                termsURL={termsData.termsURL.value}
                                userId={userId}
                                ppAcceptance={
                                    !acceptedPPAt ? "never" : ppTimestamp > acceptedPPAt ? "outdated" : "current"
                                }
                                termsAcceptance={
                                    !acceptedTermsAt
                                        ? "never"
                                        : termsTimestamp > acceptedTermsAt
                                        ? "outdated"
                                        : "current"
                                }
                                forceRefresh={forceRefresh}
                            />
                        )}
                    </CurrentUserContext.Provider>
                );
            }
        }
    }

    return <CurrentUserContext.Provider value={ctx}>{children()}</CurrentUserContext.Provider>;
}

function CookiePolicyCompliance({
    cookiesURL,
    setAcceptedCookiesAt,
    hostOrganisationName,
    policyChanged,
}: {
    cookiesURL: string;
    setAcceptedCookiesAt: React.Dispatch<React.SetStateAction<number | null>>;
    hostOrganisationName: string;
    policyChanged: boolean;
}) {
    return (
        <Center mt={10}>
            <Container>
                <VStack spacing={4}>
                    <Heading as="h1" id="page-heading">
                        Cookies
                    </Heading>
                    <Text>
                        The Midspace software (hosted by {hostOrganisationName}) requires the use of cookies in order to
                        deliver the software service to you. Please{" "}
                        <Link isExternal href={cookiesURL}>
                            read the cookie policy
                            <ExternalLinkIcon ml={1} fontSize="xs" />
                        </Link>{" "}
                        before continuing.
                    </Text>
                    <Text>
                        By clicking &ldquo;Agree and continue&rdquo;, you agree to the use of cookies in accordance with{" "}
                        <Link isExternal href={cookiesURL}>
                            the policy
                            <ExternalLinkIcon ml={1} fontSize="xs" />
                        </Link>
                        .
                    </Text>
                    {policyChanged ? (
                        <Alert status="info" fontSize="small" p={2}>
                            <AlertIcon />
                            We have updated our cookie policy. Please review the new policy before continuing.
                        </Alert>
                    ) : undefined}
                    <Button colorScheme="purple" onClick={() => setAcceptedCookiesAt(Date.now())}>
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
    termsAcceptance,
    ppAcceptance,
    forceRefresh,
}: {
    ppURL: string;
    termsURL: string;
    hostOrganisationName: string;
    userId: string;
    termsAcceptance: "never" | "current" | "outdated";
    ppAcceptance: "never" | "current" | "outdated";
    forceRefresh: () => void;
}): JSX.Element {
    const [termsChecked, setTermsChecked] = useState<boolean>(false);
    const [ppChecked, setPPChecked] = useState<boolean>(false);
    const [agreeToTermsResponse, agreeToTerms] = useAgreeToTermsMutation();

    const agreeAndContinue = useCallback(async () => {
        await agreeToTerms({
            userId,
            at: new Date().toISOString(),
        });
        forceRefresh();
    }, [agreeToTerms, forceRefresh, userId]);

    return (
        <Center mt={10}>
            <Container>
                <VStack spacing={4}>
                    <Heading as="h1" id="page-heading">
                        Terms of Service
                    </Heading>
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
                        before continuing to use the Midspace software hosted by {hostOrganisationName}.
                    </Text>
                    <VStack alignItems="flex-start">
                        <Checkbox isChecked={termsChecked} onChange={(ev) => setTermsChecked(ev.target.checked)}>
                            I agree to the {hostOrganisationName}{" "}
                            <Link isExternal href={termsURL}>
                                terms and conditions.
                                <ExternalLinkIcon ml={1} fontSize="xs" />
                            </Link>
                        </Checkbox>
                        {termsAcceptance === "outdated" ? (
                            <>
                                <Alert status="info" fontSize="small" p={2}>
                                    <AlertIcon />
                                    We have updated our terms and conditions. Please review the new terms before
                                    continuing.
                                </Alert>
                                <Spacer p={1} />
                            </>
                        ) : termsAcceptance === "current" ? (
                            <>
                                <Alert status="info" fontSize="small" p={2}>
                                    <AlertIcon />
                                    The terms and conditions have not changed since you last agreed to them.
                                </Alert>
                                <Spacer p={1} />
                            </>
                        ) : undefined}
                        <Checkbox isChecked={ppChecked} onChange={(ev) => setPPChecked(ev.target.checked)}>
                            I agree to the {hostOrganisationName}{" "}
                            <Link isExternal href={ppURL}>
                                privacy policy.
                                <ExternalLinkIcon ml={1} fontSize="xs" />
                            </Link>
                        </Checkbox>
                        {ppAcceptance === "outdated" ? (
                            <Alert status="info" fontSize="small" p={2}>
                                <AlertIcon />
                                We have updated our privacy policy. Please review the new policy before continuing.
                            </Alert>
                        ) : ppAcceptance === "current" ? (
                            <Alert status="info" fontSize="small" p={2}>
                                <AlertIcon />
                                The privacy policy has not changed since you last agreed to it.
                            </Alert>
                        ) : undefined}
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
                                colorScheme="purple"
                                onClick={() => agreeAndContinue()}
                                isDisabled={!termsChecked || !ppChecked}
                                isLoading={agreeToTermsResponse.fetching}
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
