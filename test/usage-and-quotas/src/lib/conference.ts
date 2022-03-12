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
    mutation CleanUpTestConference($id: uuid!) {
        delete_room_Room(where: { conferenceId: { _eq: $id } }) {
            affected_rows
        }
        delete_chat_Chat(where: { conferenceId: { _eq: $id } }) {
            affected_rows
        }
        delete_conference_Usage(where: { conferenceId: { _eq: $id } }) {
            affected_rows
        }
        delete_conference_Quota(where: { conferenceId: { _eq: $id } }) {
            affected_rows
        }
        delete_conference_Conference(where: { id: { _eq: $id } }) {
            affected_rows
        }
    }

    mutation CleanUpTestConferenceEvents($id: uuid!) {
        delete_schedule_Event(where: { conferenceId: { _eq: $id } }) {
            affected_rows
        }
        delete_content_Item(where: { conferenceId: { _eq: $id } }) {
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
    const rand = Math.round(Math.random() * 100000000);
    return gqlClient
        ?.mutation<CreateConferenceMutation, CreateConferenceMutationVariables>(CreateConferenceDocument, {
            object: {
                slug: slug + "-" + rand,
                createdBy: process.env.TEST_USER_ID,
                demoCode: {
                    data: {
                        note: "Used by test conference",
                        usedById: process.env.TEST_USER_ID,
                    },
                },
                name: "Test-E2E-Usage-And-Quotas" + "-" + rand,
                shortName: "Test-E2E-Usage-And-Quotas" + "-" + rand,
            },
        })
        .toPromise();
}

export async function cleanupTestConference(conferenceId: string) {
    await gqlClient
        ?.mutation<CleanUpTestConferenceEventsMutation, CleanUpTestConferenceEventsMutationVariables>(
            CleanUpTestConferenceEventsDocument,
            {
                id: conferenceId,
            }
        )
        .toPromise();

    await gqlClient
        ?.mutation<CleanUpTestConferenceMutation, CleanUpTestConferenceMutationVariables>(
            CleanUpTestConferenceDocument,
            {
                id: conferenceId,
            }
        )
        .toPromise();
}
