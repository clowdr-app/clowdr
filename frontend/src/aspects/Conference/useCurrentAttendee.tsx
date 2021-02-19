import { gql } from "@apollo/client";
import { Box, Spinner, VStack } from "@chakra-ui/react";
import assert from "assert";
import React, { ReactNode, ReactNodeArray } from "react";
import { Maybe, useAttendeeByUserIdConferenceIdQuery } from "../../generated/graphql";
import type { BadgeData } from "../Badges/ProfileBadge";
import PageNotFound from "../Errors/PageNotFound";
import useMaybeCurrentUser from "../Users/CurrentUser/useMaybeCurrentUser";
import { useConference } from "./useConference";

gql`
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
        displayName
        profile {
            ...AttendeeProfileData
        }
    }

    query AttendeeByUserIdConferenceId($conferenceId: uuid!, $userId: String!) {
        Attendee(where: { _and: [{ conferenceId: { _eq: $conferenceId } }, { userId: { _eq: $userId } }] }) {
            ...AttendeeData
        }
    }

    query AttendeeById($conferenceId: uuid!, $attendeeId: uuid!) {
        Attendee(where: { id: { _eq: $attendeeId }, conferenceId: { _eq: $conferenceId } }) {
            ...AttendeeData
        }
    }
`;

export type AttendeeProfile = {
    readonly attendeeId: string;
    readonly realName?: Maybe<string>;
    readonly badges?: Maybe<BadgeData[]>;
    readonly affiliation?: Maybe<string>;
    readonly affiliationURL?: Maybe<string>;
    readonly country?: Maybe<string>;
    readonly timezoneUTCOffset?: Maybe<number>;
    readonly bio?: Maybe<string>;
    readonly website?: Maybe<string>;
    readonly github?: Maybe<string>;
    readonly twitter?: Maybe<string>;
    readonly pronouns?: Maybe<string[]>;
    readonly photoURL_50x50?: Maybe<string>;
    readonly photoURL_350x350?: Maybe<string>;
    readonly hasBeenEdited: boolean;
};

export type Attendee = {
    readonly id: any;
    readonly userId?: Maybe<string>;
    readonly displayName: string;
    readonly profile: AttendeeProfile;
};

export type AttendeeContextT = Attendee & {
    refetch: () => Promise<void>;
};

const CurrentAttendeeContext = React.createContext<AttendeeContextT | undefined>(undefined);

export default function useCurrentAttendee(): AttendeeContextT {
    const ctx = React.useContext(CurrentAttendeeContext);
    assert(ctx, "useCurrentAttendee: Context not available");
    return ctx;
}

export function useMaybeCurrentAttendee(): AttendeeContextT | undefined {
    return React.useContext(CurrentAttendeeContext);
}

function CurrentAttendeeProviderInner({
    children,
    userId,
}: {
    children: ReactNode | ReactNodeArray;
    userId: string;
}): JSX.Element {
    const conference = useConference();
    const { loading, error, data, refetch } = useAttendeeByUserIdConferenceIdQuery({
        variables: {
            conferenceId: conference.id,
            userId,
        },
    });

    if (loading && !data) {
        return (
            <VStack>
                <Box>
                    <Spinner />
                </Box>
            </VStack>
        );
    }

    if (error) {
        return (
            <VStack>
                <PageNotFound />
            </VStack>
        );
    }

    return (
        <CurrentAttendeeContext.Provider
            value={
                data?.Attendee[0] && data.Attendee[0].profile
                    ? {
                          ...data.Attendee[0],
                          profile: data.Attendee[0].profile,
                          refetch: async () => {
                              await refetch();
                          },
                      }
                    : undefined
            }
        >
            {children}
        </CurrentAttendeeContext.Provider>
    );
}

export function CurrentAttendeeProvider({ children }: { children: ReactNode | ReactNodeArray }): JSX.Element {
    const user = useMaybeCurrentUser();
    if (user.user) {
        return <CurrentAttendeeProviderInner userId={user.user.id}>{children}</CurrentAttendeeProviderInner>;
    } else {
        return <CurrentAttendeeContext.Provider value={undefined}>{children}</CurrentAttendeeContext.Provider>;
    }
}
