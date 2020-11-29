import { Heading, Text } from "@chakra-ui/react";
import React from "react";
import { useConference } from "../ConferenceProvider";
import useDashboardPrimaryMenuButtons from "./useDashboardPrimaryMenuButtons";

export default function ManageConferenceRolesPage(): JSX.Element {
    const conference = useConference();

    useDashboardPrimaryMenuButtons();

    return (
        <>
            <Heading as="h1" fontSize="2.3rem" lineHeight="3rem">
                Manage {conference.shortName}
            </Heading>
            <Heading
                as="h2"
                fontSize="1.7rem"
                lineHeight="2.4rem"
                fontStyle="italic"
            >
                Roles
            </Heading>
            <Text>TODO</Text>
        </>
    );
}
