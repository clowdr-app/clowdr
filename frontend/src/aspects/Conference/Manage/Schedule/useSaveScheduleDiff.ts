import { gql } from "@apollo/client";

gql`
    fragment RoomInfo on Room {
        capacity
        conferenceId
        currentModeName
        id
        name
        originatingDataId
        participants {
            ...RoomParticipantInfo
        }
    }

    fragment RoomParticipantInfo on RoomParticipant {
        attendeeId
        conferenceId
        id
        roomId
    }

    fragment EventInfo on Event {
        conferenceId
        contentGroupId
        durationSeconds
        eventPeople {
            ...EventPersonInfo
        }
        eventTags {
            ...EventTagInfo
        }
        id
        intendedRoomModeName
        name
        originatingDataId
        roomId
        startTime
    }

    fragment EventPersonInfo on EventPerson {
        affiliation
        attendeeId
        conferenceId
        eventId
        id
        name
        originatingDataId
        roleName
    }

    fragment EventTagInfo on EventTag {
        eventId
        id
        tagId
    }

    query SelectWholeSchedule($conferenceId: uuid!) {
        Room(where: { conferenceId: { _eq: $conferenceId } }) {
            ...RoomInfo
        }
        Event(where: { conferenceId: { _eq: $conferenceId } }) {
            ...EventInfo
        }
        OriginatingData(where: { conferenceId: { _eq: $conferenceId } }) {
            ...OriginatingDataInfo
        }
        Tag(where: { conferenceId: { _eq: $conferenceId } }) {
            ...TagInfo
        }
    }

    mutation InsertRooms($newRooms: [Room_insert_input!]!) {
        insert_Room(objects: $newRooms) {
            returning {
                ...RoomInfo
            }
        }
    }

    mutation DeleteRooms($deleteRoomIds: [uuid!]!) {
        delete_Room(where: { id: { _in: $deleteRoomIds } }) {
            returning {
                id
            }
        }
    }

    mutation UpdateRoom($id: uuid!, $name: String!, $currentModeName: RoomMode_enum!, $originatingDataId: uuid = null) {
        update_Room_by_pk(
            pk_columns: { id: $id }
            _set: { name: $name, currentModeName: $currentModeName, originatingDataId: $originatingDataId }
        ) {
            ...RoomInfo
        }
    }

    mutation InsertDeleteEvents($newEvents: [Event_insert_input!]!, $deleteEventIds: [uuid!]!) {
        insert_Event(objects: $newEvents) {
            returning {
                ...EventInfo
            }
        }
        delete_Event(where: { id: { _in: $deleteEventIds } }) {
            returning {
                id
            }
        }
    }

    mutation UpdateEvent(
        $eventId: uuid!
        $roomId: uuid!
        $intendedRoomModeName: RoomMode_enum!
        $contentGroupId: uuid = null
        $originatingDataId: uuid = null
        $name: String!
        $startTime: timestamptz!
        $durationSeconds: Int!
        $newEventTags: [EventTag_insert_input!]!
        $deleteEventTagIds: [uuid!]!
        $newEventPeople: [EventPerson_insert_input!]!
        $deleteEventPeopleIds: [uuid!]!
    ) {
        insert_EventTag(objects: $newEventTags) {
            returning {
                ...EventTagInfo
            }
        }
        insert_EventPerson(objects: $newEventPeople) {
            returning {
                ...EventPersonInfo
            }
        }
        update_Event_by_pk(
            pk_columns: { id: $eventId }
            _set: {
                roomId: $roomId
                intendedRoomModeName: $intendedRoomModeName
                contentGroupId: $contentGroupId
                originatingDataId: $originatingDataId
                name: $name
                startTime: $startTime
                durationSeconds: $durationSeconds
            }
        ) {
            ...EventInfo
        }
        delete_EventTag(where: { tag: { id: { _in: $deleteEventTagIds } } }) {
            returning {
                id
            }
        }
        delete_EventPerson(where: { id: { _in: $deleteEventPeopleIds } }) {
            returning {
                id
            }
        }
    }

    mutation UpdateEventPerson(
        $id: uuid!
        $attendeeId: uuid = null
        $name: String!
        $affiliation: String = null
        $roleName: EventPersonRole_enum!
        $originatingDataId: uuid = null
    ) {
        update_EventPerson_by_pk(
            pk_columns: { id: $id }
            _set: {
                attendeeId: $attendeeId
                name: $name
                affiliation: $affiliation
                roleName: $roleName
                originatingDataId: $originatingDataId
            }
        ) {
            ...EventPersonInfo
        }
    }
`;
