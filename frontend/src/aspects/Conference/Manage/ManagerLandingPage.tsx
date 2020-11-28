import { Heading, Text } from "@chakra-ui/react";
import React from "react";
import { useConference } from "../ConferenceProvider";

export default function ManagerLandingPage(): JSX.Element {
    const conference = useConference();

    // TODO: Check what permissions the user has and thus what management
    //       features to show them

    return (
        <>
            <Heading as="h1">Manage {conference.shortName}</Heading>
            <Text>Manage {conference.name}. Developer todo list:</Text>
            <ol>
                <li>Set up base roles/groups &amp; creator as an attendee</li>
                <li>Manage roles page</li>
                <li>Manage groups page</li>
                <li>Manage attendees page</li>
            </ol>
        </>
    );
}
