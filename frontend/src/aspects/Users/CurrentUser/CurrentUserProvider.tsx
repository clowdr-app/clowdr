import { gql } from "@apollo/client";
import { Spinner } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { useSelectCurrentUserQuery, useTermsConfigsQuery } from "../../../generated/graphql";
import useUserId from "../../Auth/useUserId";
import { useRestorableState } from "../../Generic/useRestorableState";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";
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

    query SelectCurrentUser($userId: String!) {
        User_by_pk(id: $userId) {
            id
            email
            lastName
            firstName
            attendees {
                ...AttendeeFields
            }
            acceptedTermsAt
            acceptedPrivacyPolicyAt
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
    const ctx: UserInfo = useMemo(
        () => ({
            loading,
            user: value ? value?.User_by_pk ?? false : value,
            refetchUser: refetch,
        }),
        [loading, refetch, value]
    );

    const acceptedTermsAt = useMemo(() => ctx.user && Date.parse(ctx.user.acceptedTermsAt), [ctx.user]);
    const acceptedPPAt = useMemo(() => ctx.user && Date.parse(ctx.user.acceptedPrivacyPolicyAt), [ctx.user]);
    const [acceptedCookiesAt, setAcceptedCookiesAt] = useRestorableState<number | null>(
        "COOKIE_POLICY_ACCEPTED_AT",
        null,
        (x) => (x === null ? "" : x.toFixed(0)),
        (x) => (x === "" ? null : parseInt(x, 10))
    );

    if (termsLoading) {
        return <Spinner label="Loading terms configuration" />;
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
    return <>TODO: Accept cookies</>;
}

function TermsAndPPCompliance({
    ppURL,
    termsURL,
    hostOrganisationName,
}: {
    ppURL: string;
    termsURL: string;
    hostOrganisationName: string;
}) {
    return <>TODO: Terms and privacy policy</>;
}
