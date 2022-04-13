import { gql } from "urql";

// This is here because for some reason GQL CodeGen can't parse the
// SettingsPanel.tsx file correctly, so it silently skips it and deletes these
// queries when it shouldn't.

gql`
    query ManageSchedule_ListSuitableRooms(
        $conferenceId: uuid!
        $subconferenceCond: uuid_comparison_exp!
        $modes: [schedule_Mode_enum!]!
        $namePattern: String!
    ) {
        suggestedRooms: room_Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                subconferenceId: $subconferenceCond
                itemId: { _is_null: true }
                _or: [
                    { events: { modeName: { _in: $modes } } }
                    { isProgramRoom: { _eq: false }, name: { _ilike: $namePattern } }
                ]
            }
            order_by: [{ name: asc }]
        ) {
            id
            name
        }

        otherRooms: room_Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                subconferenceId: $subconferenceCond
                isProgramRoom: { _eq: false }
                _or: [{ itemId: { _is_null: true } }, { item: { typeName: { _eq: SPONSOR } } }]
            }
            order_by: [{ name: asc }]
        ) {
            id
            name
        }
    }

    query ManageSchedule_FindSuitableRooms(
        $conferenceId: uuid!
        $subconferenceCond: uuid_comparison_exp!
        $modes: [schedule_Mode_enum!]!
        $startBefore: timestamptz!
        $endAfter: timestamptz!
        $namePattern: String!
    ) {
        programRooms: room_Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                subconferenceId: $subconferenceCond
                itemId: { _is_null: true }
                _and: [
                    { events: { modeName: { _in: $modes } } }
                    {
                        _not: {
                            events: { scheduledStartTime: { _lt: $startBefore }, scheduledEndTime: { _gt: $endAfter } }
                        }
                    }
                ]
            }
            order_by: [{ name: asc }]
            limit: 1
        ) {
            id
        }

        nonProgramRooms: room_Room(
            where: {
                conferenceId: { _eq: $conferenceId }
                subconferenceId: $subconferenceCond
                isProgramRoom: { _eq: false }
                itemId: { _is_null: true }
                name: { _ilike: $namePattern }
            }
            order_by: [{ name: asc }]
            limit: 1
        ) {
            id
        }

        conference_RemainingQuota(where: { conferenceId: { _eq: $conferenceId } }) {
            conferenceId
            remainingStreamingProgramRooms
            remainingNonStreamingProgramRooms
            remainingPublicSocialRooms
        }
    }

    mutation ManageSchedule_InsertRoom($object: room_Room_insert_input!) {
        insert_room_Room_one(object: $object) {
            id
        }
    }

    query ManageSchedule_GetVideoElements($sessionId: uuid!, $sessionItemId: uuid!, $sessionItemIdExists: Boolean!) {
        content_Item_by_pk(id: $sessionItemId) @include(if: $sessionItemIdExists) {
            id
            title
            elements(where: { typeName: { _in: [VIDEO_FILE, VIDEO_BROADCAST] } }) {
                id
                name
            }
        }

        schedule_Event_by_pk(id: $sessionId) {
            presentations {
                item {
                    id
                    title
                    elements(where: { typeName: { _in: [VIDEO_FILE, VIDEO_BROADCAST] } }) {
                        id
                        name
                    }
                }
            }

            exhibition {
                items {
                    item {
                        id
                        title
                        elements(where: { typeName: { _in: [VIDEO_FILE, VIDEO_BROADCAST] } }) {
                            id
                            name
                        }
                    }
                }
            }
        }
    }
`;
