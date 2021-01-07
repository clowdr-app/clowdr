import { gql } from "@apollo/client";
import { Box, Spinner } from "@chakra-ui/react";
import assert from "assert";
import React from "react";
import { AttendeeDataFragment, useAttendeeByUserIdConferenceIdQuery } from "../../generated/graphql";
import PageNotFound from "../Errors/PageNotFound";
import useCurrentUser from "../Users/CurrentUser/useCurrentUser";
import { useConference } from "./useConference";

gql`
    fragment AttendeeProfileData on AttendeeProfile {
        attendeeId
        realName
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
        Attendee(where: { _and: [{ conferenceId: { _eq: $conferenceId } }, { userId: { _eq: $userId } }] }, limit: 1) {
            ...AttendeeData
        }
    }
`;

export type AttendeeContextT = AttendeeDataFragment & {
    refetch: () => Promise<void>;
};

const AttendeeContext = React.createContext<AttendeeContextT | undefined>(undefined);

export default function useCurrentAttendee(): AttendeeContextT {
    const ctx = React.useContext(AttendeeContext);
    assert(ctx);
    return ctx;
}

export function CurrentAttendeeProvider({ children }: { children: string | JSX.Element | JSX.Element[] }): JSX.Element {
    const conference = useConference();
    const user = useCurrentUser();
    const { loading, error, data, refetch } = useAttendeeByUserIdConferenceIdQuery({
        variables: {
            conferenceId: conference.id,
            userId: user.user.id,
        },
    });

    if (loading && !data) {
        return (
            <Box>
                <Spinner />
            </Box>
        );
    }

    if (error) {
        return <PageNotFound />;
    }

    if (!data || data.Attendee.length === 0) {
        return <PageNotFound />;
    }

    return (
        <AttendeeContext.Provider
            value={{
                ...data.Attendee[0],
                refetch: async () => {
                    await refetch();
                },
            }}
        >
            {children}
        </AttendeeContext.Provider>
    );
}
