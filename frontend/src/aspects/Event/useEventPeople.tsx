import { gql } from "@apollo/client";

gql`
    fragment EventProgramPersonDetails on schedule_EventProgramPerson {
        id
        roleName
        eventId
        person {
            id
            name
            affiliation
            registrantId
            registrant {
                id
                userId
                displayName
                profile {
                    registrantId
                    affiliation
                }
            }
        }
    }
`;
