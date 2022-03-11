import { Text, VStack } from "@chakra-ui/react";
import { assert } from "@midspace/assert";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import type { RequestPolicy } from "@urql/core";
import { gql } from "@urql/core";
import React, { useEffect, useMemo, useState } from "react";
import type { AuthdConferenceInfoFragment, PublicConferenceInfoFragment } from "../../generated/graphql";
import { useConferenceById_WithoutUserQuery, useConferenceById_WithUserQuery } from "../../generated/graphql";
import { AppError } from "../App";
import CenteredSpinner from "../Chakra/CenteredSpinner";
import { LinkButton } from "../Chakra/LinkButton";
import GenericErrorPage from "../Errors/GenericErrorPage";
import PageNotFound from "../Errors/PageNotFound";
import extractActualError from "../GQL/ExtractActualError";
import { makeContext } from "../GQL/make-context";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";

gql`
    query ConferenceById_WithUser($id: uuid!, $userId: String!) @cached {
        conference_Conference_by_pk(id: $id) {
            ...PublicConferenceInfo
            ...AuthdConferenceInfo
        }
    }

    query ConferenceById_WithoutUser($id: uuid!) @cached {
        conference_Conference_by_pk(id: $id) {
            ...PublicConferenceInfo
        }
    }

    fragment AuthdConferenceInfo on conference_Conference {
        announcementsChatId

        registrants(where: { userId: { _eq: $userId } }) {
            ...RegistrantData
        }

        myBackstagesNotice: configurations(where: { key: { _eq: MY_BACKSTAGES_NOTICE } }) {
            conferenceId
            key
            value
        }
    }

    fragment PublicConferenceInfo on conference_Conference {
        id
        name
        shortName
        slug

        supportAddress: configurations(where: { key: { _eq: SUPPORT_ADDRESS } }) {
            conferenceId
            key
            value
        }
        registrationURL: configurations(where: { key: { _eq: REGISTRATION_URL } }) {
            conferenceId
            key
            value
        }
        scheduleViewVersion: configurations(where: { key: { _eq: SCHEDULE_VIEW_VERSION } }) {
            conferenceId
            key
            value
        }
        scheduleEventBox_HideExhibitionPeople: configurations(
            where: { key: { _eq: EVENT_BOX_HIDE_EXHIBITION_PEOPLE } }
        ) {
            conferenceId
            key
            value
        }

        sponsorsLabel: configurations(where: { key: { _eq: SPONSORS_LABEL } }) {
            conferenceId
            key
            value
        }
        disableAllTimesForThisItem: configurations(where: { key: { _eq: DISABLE_ALL_EVENTS_FOR_ITEM } }) {
            conferenceId
            key
            value
        }
        disableNearbyEvents: configurations(where: { key: { _eq: DISABLE_NEARBY_EVENTS } }) {
            conferenceId
            key
            value
        }
        themeComponentColors: configurations(where: { key: { _eq: THEME_COMPONENT_COLORS } }) {
            conferenceId
            key
            value
        }

        visibleExhibitionsLabel: configurations(where: { key: { _eq: VISIBLE_EXHIBITIONS_LABEL } }) {
            conferenceId
            key
            value
        }
        hiddenExhibitionsLabel: configurations(where: { key: { _eq: HIDDEN_EXHIBITIONS_LABEL } }) {
            conferenceId
            key
            value
        }

        forceSponsorsMenuLink: configurations(where: { key: { _eq: FORCE_MENU_SPONSORS_LINK } }) {
            conferenceId
            key
            value
        }
    }

    fragment ProfileData on registrant_Profile {
        registrantId
        badges
        affiliation
        affiliationURL
        country
        timezoneUTCOffset
        bio
        website
        github
        twitter
        pronouns
        photoURL_50x50
        photoURL_350x350
        hasBeenEdited
    }

    fragment RegistrantData on registrant_Registrant {
        id
        userId
        conferenceId
        displayName
        conferenceRole
        profile {
            ...ProfileData
        }
    }
`;

export type ConferenceInfoFragment =
    | PublicConferenceInfoFragment
    | (PublicConferenceInfoFragment & AuthdConferenceInfoFragment);

const ConferenceContext = React.createContext<ConferenceInfoFragment | undefined>(undefined);

export function useConference(): ConferenceInfoFragment {
    const conf = React.useContext(ConferenceContext);
    assert.truthy(conf, "useConference: Context not available");
    return conf;
}

export function useMaybeConference(): ConferenceInfoFragment | undefined {
    return React.useContext(ConferenceContext);
}

function ConferenceProvider_WithoutUser({
    children,
    conferenceId,
}: {
    children: (error?: JSX.Element) => JSX.Element;
    conferenceId: string;
}): JSX.Element {
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.Unauthenticated,
            }),
        []
    );
    const [requestPolicy, setRequestPolicy] = useState<RequestPolicy | undefined>(undefined);
    const [{ fetching: loading, error, data, stale }] = useConferenceById_WithoutUserQuery({
        variables: {
            id: conferenceId,
        },
        context,
        requestPolicy,
    });
    useEffect(() => {
        if (!data?.conference_Conference_by_pk) {
            setRequestPolicy("cache-and-network");
        }
    }, [data?.conference_Conference_by_pk]);

    if ((loading || stale) && !data?.conference_Conference_by_pk) {
        return (
            <ConferenceContext.Provider value={undefined}>
                {children(<CenteredSpinner caller="useConference:175" />)}
            </ConferenceContext.Provider>
        );
    }

    if (error) {
        return (
            <ConferenceContext.Provider value={undefined}>
                {children(
                    <VStack>
                        <PageNotFound />
                    </VStack>
                )}
            </ConferenceContext.Provider>
        );
    }

    if (!data?.conference_Conference_by_pk) {
        return (
            <ConferenceContext.Provider value={undefined}>
                {children(
                    <VStack>
                        <PageNotFound />
                    </VStack>
                )}
            </ConferenceContext.Provider>
        );
    }

    return (
        <ConferenceContext.Provider value={data.conference_Conference_by_pk}>{children()}</ConferenceContext.Provider>
    );
}

function ConferenceProvider_WithUser({
    children,
    userId,
    conferenceId,
}: {
    children: (error?: JSX.Element) => JSX.Element;
    userId: string;
    conferenceId: string;
}): JSX.Element {
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.Attendee,
            }),
        []
    );
    const [requestPolicy, setRequestPolicy] = useState<RequestPolicy | undefined>(undefined);
    const [{ fetching: loading, error, data, stale }] = useConferenceById_WithUserQuery({
        variables: {
            id: conferenceId,
            userId,
        },
        context,
        requestPolicy,
    });
    useEffect(() => {
        if (!data?.conference_Conference_by_pk) {
            setRequestPolicy("cache-and-network");
        }
    }, [data?.conference_Conference_by_pk]);

    if ((loading || stale) && !data?.conference_Conference_by_pk) {
        return (
            <ConferenceContext.Provider value={undefined}>
                {children(<CenteredSpinner caller="useConference:222" />)}
            </ConferenceContext.Provider>
        );
    }

    if (error) {
        const actualError = extractActualError(error);
        if (actualError?.includes("Authentication hook unauthorized this request")) {
            return (
                <ConferenceContext.Provider value={undefined}>
                    {children(
                        <VStack spacing={4}>
                            <GenericErrorPage heading="Conference unavailable">
                                <Text>
                                    You are logged in and registered for this conference but it could not be accessed.
                                    The most likely reason is the conference is not yet open to attendees.
                                </Text>
                                <LinkButton to="/"> Back to home page</LinkButton>
                            </GenericErrorPage>
                        </VStack>
                    )}
                </ConferenceContext.Provider>
            );
        } else {
            return (
                <ConferenceContext.Provider value={undefined}>
                    {children(
                        <VStack>
                            <AppError
                                error={new Error(actualError)}
                                resetErrorBoundary={() => {
                                    //
                                }}
                            />
                        </VStack>
                    )}
                </ConferenceContext.Provider>
            );
        }
    }

    if (!data?.conference_Conference_by_pk) {
        return (
            <ConferenceContext.Provider value={undefined}>
                {children(
                    <VStack>
                        <PageNotFound />
                    </VStack>
                )}
            </ConferenceContext.Provider>
        );
    }

    return (
        <ConferenceContext.Provider value={data.conference_Conference_by_pk}>{children()}</ConferenceContext.Provider>
    );
}

export default function ConferenceProvider({
    children,
    conferenceId,
}: {
    children: (error?: JSX.Element) => JSX.Element;
    conferenceId?: string | null;
}): JSX.Element {
    const user = useMaybeCurrentUser();

    if (!conferenceId) {
        return <ConferenceContext.Provider value={undefined}>{children()}</ConferenceContext.Provider>;
    }

    if (user.loading) {
        return (
            <ConferenceContext.Provider value={undefined}>
                {children(<CenteredSpinner caller="useConference:259" />)}
            </ConferenceContext.Provider>
        );
    }

    if (user.user) {
        return (
            <ConferenceProvider_WithUser userId={user.user.id} conferenceId={conferenceId}>
                {children}
            </ConferenceProvider_WithUser>
        );
    } else {
        return <ConferenceProvider_WithoutUser conferenceId={conferenceId}>{children}</ConferenceProvider_WithoutUser>;
    }
}
