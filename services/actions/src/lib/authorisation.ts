import { gql } from "@apollo/client/core";
import {
    Authorisation_FindRegistrantDocument,
    GetRegistrantByConferenceSlugDocument,
    GetRegistrantDocument,
    GetRegistrantWithPermissionsDocument,
    GetRegistrant_RegistrantFragment,
    GetRegistrant_RegistrantWithPermissionsFragment,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

export async function getRegistrant(userId: string, conferenceId: string): Promise<GetRegistrant_RegistrantFragment> {
    gql`
        query GetRegistrant($userId: String!, $conferenceId: uuid!) {
            registrant_Registrant(where: { userId: { _eq: $userId }, conferenceId: { _eq: $conferenceId } }) {
                ...GetRegistrant_Registrant
            }
        }

        fragment GetRegistrant_Registrant on registrant_Registrant {
            id
            displayName
            conferenceId
        }
    `;

    // Check that the requesting user actually attends the conference
    const myRegistrantResult = await apolloClient.query({
        query: GetRegistrantDocument,
        variables: {
            userId,
            conferenceId,
        },
    });

    if (myRegistrantResult.data.registrant_Registrant.length !== 1) {
        throw new Error("Could not find an registrant for the user at the specified conference");
    }

    return myRegistrantResult.data.registrant_Registrant[0];
}

export async function getRegistrantWithPermissions(
    userId: string,
    conferenceId: string
): Promise<GetRegistrant_RegistrantWithPermissionsFragment> {
    gql`
        query GetRegistrantWithPermissions($userId: String!, $conferenceId: uuid!) {
            registrant_Registrant(where: { userId: { _eq: $userId }, conferenceId: { _eq: $conferenceId } }) {
                ...GetRegistrant_RegistrantWithPermissions
            }
        }

        fragment GetRegistrant_RegistrantWithPermissions on registrant_Registrant {
            id
            displayName
            conferenceId
            groupRegistrants {
                id
                group {
                    id
                    groupRoles {
                        id
                        role {
                            id
                            rolePermissions {
                                id
                                permissionName
                            }
                        }
                    }
                }
            }
        }
    `;

    // Check that the requesting user actually attends the conference
    const myRegistrantResult = await apolloClient.query({
        query: GetRegistrantWithPermissionsDocument,
        variables: {
            userId,
            conferenceId,
        },
    });

    if (myRegistrantResult.data.registrant_Registrant.length !== 1) {
        throw new Error("Could not find an registrant for the user at the specified conference");
    }

    return myRegistrantResult.data.registrant_Registrant[0];
}

export async function getRegistrantByConferenceSlug(
    userId: string,
    conferenceSlug: string
): Promise<GetRegistrant_RegistrantFragment> {
    gql`
        query GetRegistrantByConferenceSlug($userId: String!, $conferenceSlug: String!) {
            registrant_Registrant(where: { userId: { _eq: $userId }, conference: { slug: { _eq: $conferenceSlug } } }) {
                ...GetRegistrant_Registrant
            }
        }
    `;

    // Check that the requesting user actually attends the conference
    const myRegistrantResult = await apolloClient.query({
        query: GetRegistrantByConferenceSlugDocument,
        variables: {
            userId,
            conferenceSlug,
        },
    });

    if (myRegistrantResult.data.registrant_Registrant.length !== 1) {
        throw new Error("Could not find an registrant for the user at the specified conference");
    }

    return myRegistrantResult.data.registrant_Registrant[0];
}

gql`
    query Authorisation_FindRegistrant($registrantId: uuid!, $userId: String!) {
        registrant_Registrant(where: { id: { _eq: $registrantId }, userId: { _eq: $userId } }) {
            ...GetRegistrant_Registrant
        }
    }
`;

export async function registrantBelongsToUser(
    registrantId: string,
    userId: string
): Promise<false | GetRegistrant_RegistrantFragment> {
    try {
        const result = await apolloClient.query({
            query: Authorisation_FindRegistrantDocument,
            variables: {
                registrantId,
                userId,
            },
        });

        if (result.data.registrant_Registrant.length === 1) {
            return result.data.registrant_Registrant[0];
        }

        return false;
    } catch (e) {
        return false;
    }
}
