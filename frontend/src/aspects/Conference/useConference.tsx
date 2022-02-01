import { VStack } from "@chakra-ui/react";
import { assert } from "@midspace/assert";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import type { RequestPolicy } from "@urql/core";
import { gql } from "@urql/core";
import React, { useEffect, useMemo, useState } from "react";
import type { AuthdConferenceInfoFragment, PublicConferenceInfoFragment } from "../../generated/graphql";
import { useConferenceById_WithoutUserQuery, useConferenceById_WithUserQuery } from "../../generated/graphql";
import { AppError } from "../App";
import CenteredSpinner from "../Chakra/CenteredSpinner";
import PageNotFound from "../Errors/PageNotFound";
import { makeContext } from "../GQL/make-context";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";

gql`
    query ConferenceById_WithUser($id: uuid!, $userId: String!) {
        conference_Conference_by_pk(id: $id) {
            ...PublicConferenceInfo
            ...AuthdConferenceInfo
        }
    }

    query ConferenceById_WithoutUser($id: uuid!) {
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
    children: string | JSX.Element | JSX.Element[];
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
        return <CenteredSpinner caller="useConference:175" />;
    }

    if (error) {
        return (
            <VStack>
                <PageNotFound />
            </VStack>
        );
    }

    if (!data?.conference_Conference_by_pk) {
        return (
            <VStack>
                <PageNotFound />
            </VStack>
        );
    }

    return <ConferenceContext.Provider value={data.conference_Conference_by_pk}>{children}</ConferenceContext.Provider>;
}

function ConferenceProvider_WithUser({
    children,
    userId,
    conferenceId,
}: {
    children: string | JSX.Element | JSX.Element[];
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
        return <CenteredSpinner caller="useConference:222" />;
    }

    if (error) {
        return (
            <VStack>
                <AppError
                    error={error}
                    resetErrorBoundary={() => {
                        //
                    }}
                />
            </VStack>
        );
    }

    if (!data?.conference_Conference_by_pk) {
        return (
            <VStack>
                <PageNotFound />
            </VStack>
        );
    }

    return <ConferenceContext.Provider value={data.conference_Conference_by_pk}>{children}</ConferenceContext.Provider>;
}

export default function ConferenceProvider({
    children,
    conferenceId,
}: {
    children: string | JSX.Element | JSX.Element[];
    conferenceId: string;
}): JSX.Element {
    const user = useMaybeCurrentUser();

    if (user.loading) {
        return <CenteredSpinner caller="useConference:259" />;
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
