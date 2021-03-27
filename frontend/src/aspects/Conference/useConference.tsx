import { gql } from "@apollo/client";
import { Center, Spinner, VStack } from "@chakra-ui/react";
import assert from "assert";
import React from "react";
import {
    AuthdConferenceInfoFragment,
    PublicConferenceInfoFragment,
    useConferenceBySlug_WithoutUserQuery,
    useConferenceBySlug_WithUserQuery,
} from "../../generated/graphql";
import PageNotFound from "../Errors/PageNotFound";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";

gql`
    query ConferenceBySlug_WithUser($slug: String!, $userId: String!) {
        Conference(where: { slug: { _eq: $slug } }) {
            ...PublicConferenceInfo
            ...AuthdConferenceInfo
        }
    }

    query ConferenceBySlug_WithoutUser($slug: String!) {
        Conference(where: { slug: { _eq: $slug } }) {
            ...PublicConferenceInfo
        }
    }

    fragment AuthdConferenceInfo on Conference {
        attendees(where: { userId: { _eq: $userId } }) {
            ...AttendeeData

            groupAttendees {
                group {
                    ...GroupData
                }
                id
                groupId
                attendeeId
            }
        }
    }

    fragment PublicConferenceInfo on Conference {
        id
        name
        shortName
        slug
        createdBy

        publicGroups: groups(where: { enabled: { _eq: true }, includeUnauthenticated: { _eq: true } }) {
            ...GroupData
        }
    }

    fragment GroupData on Group {
        groupRoles {
            role {
                rolePermissions {
                    permissionName
                    id
                    roleId
                }
                id
                name
                conferenceId
            }
            id
            roleId
            groupId
        }
        enabled
        id
        includeUnauthenticated
        name
        conferenceId
    }

    fragment AttendeeProfileData on AttendeeProfile {
        attendeeId
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

    fragment AttendeeData on Attendee {
        id
        userId
        conferenceId
        displayName
        profile {
            ...AttendeeProfileData
        }
    }
`;

export type ConferenceInfoFragment =
    | PublicConferenceInfoFragment
    | (PublicConferenceInfoFragment & AuthdConferenceInfoFragment);

const ConferenceContext = React.createContext<ConferenceInfoFragment | undefined>(undefined);

export function useConference(): ConferenceInfoFragment {
    const conf = React.useContext(ConferenceContext);
    assert(conf, "useConference: Context not available");
    return conf;
}

export function useMaybeConference(): ConferenceInfoFragment | undefined {
    return React.useContext(ConferenceContext);
}

function ConferenceProvider_WithoutUser({
    confSlug,
    children,
}: {
    confSlug: string;
    children: string | JSX.Element | JSX.Element[];
}): JSX.Element {
    const { loading, error, data } = useConferenceBySlug_WithoutUserQuery({
        variables: {
            slug: confSlug,
        },
    });

    if (loading && !data) {
        return (
            <Center w="100%" h="100%">
                <div>
                    <Spinner />
                </div>
            </Center>
        );
    }

    if (error) {
        return (
            <VStack>
                <PageNotFound />
            </VStack>
        );
    }

    if (!data || data.Conference.length === 0) {
        return (
            <VStack>
                <PageNotFound />
            </VStack>
        );
    }

    return <ConferenceContext.Provider value={data.Conference[0]}>{children}</ConferenceContext.Provider>;
}

function ConferenceProvider_WithUser({
    confSlug,
    children,
    userId,
}: {
    confSlug: string;
    children: string | JSX.Element | JSX.Element[];
    userId: string;
}): JSX.Element {
    const { loading, error, data } = useConferenceBySlug_WithUserQuery({
        variables: {
            slug: confSlug,
            userId,
        },
    });

    if (loading && !data) {
        return (
            <Center w="100%" h="100%">
                <div>
                    <Spinner />
                </div>
            </Center>
        );
    }

    if (error) {
        return (
            <VStack>
                <PageNotFound />
            </VStack>
        );
    }

    if (!data || data.Conference.length === 0) {
        return (
            <VStack>
                <PageNotFound />
            </VStack>
        );
    }

    return <ConferenceContext.Provider value={data.Conference[0]}>{children}</ConferenceContext.Provider>;
}

export default function ConferenceProvider({
    confSlug,
    children,
}: {
    confSlug: string;
    children: string | JSX.Element | JSX.Element[];
}): JSX.Element {
    const user = useMaybeCurrentUser();

    if (user.loading) {
        return (
            <Center w="100%" h="100%">
                <div>
                    <Spinner />
                </div>
            </Center>
        );
    }

    if (user.user) {
        return (
            <ConferenceProvider_WithUser userId={user.user.id} confSlug={confSlug}>
                {children}
            </ConferenceProvider_WithUser>
        );
    } else {
        return <ConferenceProvider_WithoutUser confSlug={confSlug}>{children}</ConferenceProvider_WithoutUser>;
    }
}
