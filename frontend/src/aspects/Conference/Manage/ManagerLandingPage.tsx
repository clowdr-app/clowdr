import { Flex, Heading, Text } from "@chakra-ui/react";
import React from "react";
import LinkButton from "../../Chakra/LinkButton";
import FAIcon from "../../Icons/FAIcon";
import { useConference } from "../ConferenceProvider";

export default function ManagerLandingPage(): JSX.Element {
    const conference = useConference();

    function makeButton(
        to: string,
        name: string,
        icon: string,
        description: string
    ): JSX.Element {
        return (
            <LinkButton
                to={`/conference/${conference.slug}/manage/${to}`}
                padding={5}
                overflow="hidden"
                whiteSpace="normal"
                linkProps={{
                    maxWidth: "calc(20% - 1rem)",
                    minWidth: "300px",
                }}
            >
                <Heading as="h2" fontSize="1.5rem" marginBottom="0.5rem">
                    <FAIcon iconStyle="s" icon={icon} />
                    <br />
                    {name}
                </Heading>
                <Text>{description}</Text>
            </LinkButton>
        );
    }

    // TODO: Check what permissions the user has and thus what management
    //       features to show them

    return (
        <>
            <Heading as="h1">Manage {conference.shortName}</Heading>
            <Flex
                flexDirection="row"
                flexWrap="wrap"
                gridGap={["0.3rem", "0.3rem", "1rem"]}
                alignItems="stretch"
                justifyContent="center"
            >
                {makeButton(
                    "name",
                    "Name",
                    "signature",
                    "Manage the name, short name and url of your conference."
                )}
                {makeButton(
                    "roles",
                    "Roles",
                    "lock",
                    "Manage the roles people at your conference can take on."
                )}
                {makeButton(
                    "groups",
                    "Groups",
                    "user-cog",
                    "Manage the groups of people at your conference and the times they can access the conference."
                )}
                {makeButton(
                    "people",
                    "People",
                    "users",
                    "Manage the people at your conference: attendees, moderators, authors, presenters, organisers and more."
                )}
            </Flex>
        </>
    );
}
