import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import React, { useMemo } from "react";
import type { RegistrantFieldsFragment } from "../../../generated/graphql";
import { useSelectCurrentUserRegistrationsQuery } from "../../../generated/graphql";
import CenteredSpinner from "../../Chakra/CenteredSpinner";
import { makeContext } from "../../GQL/make-context";
import useQueryErrorToast from "../../GQL/useQueryErrorToast";

gql`
    fragment RegistrantFields on registrant_Registrant {
        id
        userId
        conferenceId
        displayName
        createdAt
        updatedAt
        profile {
            registrantId
            photoURL_50x50
        }
        conference {
            id
            name
            shortName
            slug
        }
        conferenceRole
    }

    query SelectCurrentUserRegistrations($userId: String!) {
        registrant_Registrant(where: { userId: { _eq: $userId } }) {
            ...RegistrantFields
        }
    }

    query SelectRegistration($registrantId: uuid!) {
        registrant_Registrant_by_pk(id: $registrantId) {
            ...RegistrantFields
        }
    }
`;

const CurrentUserRegistrantsContext = React.createContext<readonly RegistrantFieldsFragment[]>([]);

export default function useCurrentUserRegistrants(): readonly RegistrantFieldsFragment[] {
    return React.useContext(CurrentUserRegistrantsContext);
}

export function CurrentUserRegistrantsProvider({
    children,
    userId,
}: {
    children: string | JSX.Element | Array<JSX.Element>;
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
    const [{ fetching, error, data }] = useSelectCurrentUserRegistrationsQuery({
        variables: {
            userId,
        },
        context,
    });
    useQueryErrorToast(error, false, "useSelectCurrentUserRegistrationsQuery");

    if (fetching || !data) {
        return (
            <CenteredSpinner
                caller="CurrentUserRegistrantsProvider"
                spinnerProps={{ label: "Loading registrations" }}
            />
        );
    }

    return (
        <CurrentUserRegistrantsContext.Provider value={data.registrant_Registrant}>
            {children}
        </CurrentUserRegistrantsContext.Provider>
    );
}
