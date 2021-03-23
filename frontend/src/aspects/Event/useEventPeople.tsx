import { gql } from "@apollo/client";

gql`
    fragment EventPersonDetails on EventPerson {
        id
        roleName
        eventId
        person {
            id
            name
            affiliation
            attendeeId
            attendee {
                id
                userId
                displayName
                profile {
                    attendeeId
                    affiliation
                }
            }
        }
    }
`;
