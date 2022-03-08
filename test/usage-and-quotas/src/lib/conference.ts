import { gqlClient } from "@midspace/component-clients/graphqlClient";
import { gql } from "graphql-tag";
import type {
    CleanUpTestConferenceEventsMutation,
    CleanUpTestConferenceEventsMutationVariables,
    CleanUpTestConferenceMutation,
    CleanUpTestConferenceMutationVariables,
    CreateConferenceMutation,
    CreateConferenceMutationVariables,
} from "../generated/graphql";
import {
    CleanUpTestConferenceDocument,
    CleanUpTestConferenceEventsDocument,
    CreateConferenceDocument,
} from "../generated/graphql";

gql`
    mutation CleanUpTestConference($slug: String!) {
        delete_room_Room(where: { conference: { slug: { _eq: $slug } } }) {
            affected_rows
        }
        delete_chat_Chat(where: { conference: { slug: { _eq: $slug } } }) {
            affected_rows
        }
        delete_conference_Usage(where: { conference: { slug: { _eq: $slug } } }) {
            affected_rows
        }
        delete_conference_Quota(where: { conference: { slug: { _eq: $slug } } }) {
            affected_rows
        }
        delete_conference_Conference(where: { slug: { _eq: $slug } }) {
            affected_rows
        }
    }

    mutation CleanUpTestConferenceEvents($slug: String!) {
        delete_schedule_Event(where: { conference: { slug: { _eq: $slug } } }) {
            affected_rows
        }
        delete_content_Item(where: { conference: { slug: { _eq: $slug } } }) {
            affected_rows
        }
    }

    fragment TestConference on conference_Conference {
        id
        quota {
            id
        }
        usage {
            id
        }
    }

    mutation CreateConference($object: conference_Conference_insert_input!) {
        insert_conference_Conference_one(object: $object) {
            ...TestConference
        }
    }
`;

const slug = "test-e2e-usage-and-quotas";

export async function createTestConference() {
    return gqlClient
        ?.mutation<CreateConferenceMutation, CreateConferenceMutationVariables>(CreateConferenceDocument, {
            object: {
                slug,
                createdBy: process.env.TEST_USER_ID,
                demoCode: {
                    data: {
                        note: "Used by test conference",
                        usedById: process.env.TEST_USER_ID,
                    },
                },
                name: "Test-E2E-Usage-And-Quotas",
                shortName: "Test-E2E-Usage-And-Quotas",
            },
        })
        .toPromise();
}

export async function cleanupTestConference() {
    await gqlClient
        ?.mutation<CleanUpTestConferenceEventsMutation, CleanUpTestConferenceEventsMutationVariables>(
            CleanUpTestConferenceEventsDocument,
            {
                slug,
            }
        )
        .toPromise();

    await gqlClient
        ?.mutation<CleanUpTestConferenceMutation, CleanUpTestConferenceMutationVariables>(
            CleanUpTestConferenceDocument,
            {
                slug,
            }
        )
        .toPromise();
}
