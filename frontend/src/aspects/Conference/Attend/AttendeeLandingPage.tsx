import { Heading, Text } from "@chakra-ui/react";
import React from "react";
import { useConference } from "../ConferenceProvider";

export default function AttendeeLandingPage(): JSX.Element {
    const conference = useConference();

    // TODO: Check what permissions the user has and thus what content to try to
    //       show them. If they're a member of only "inactive" groups, then they
    //       should be shown the earliest date that they will get some access.

    return (
        <>
            <Heading as="h1">Welcome to {conference.shortName}!</Heading>
            <Text>
                Welcome to {conference.name}.
            </Text>
        </>
    );
}
