import { LinkIcon } from "@chakra-ui/icons";
import type { ComponentWithAs, IconProps } from "@chakra-ui/react";
import { chakra, Heading, Icon, List, ListItem, Text, useColorModeValue, VStack } from "@chakra-ui/react";
import React from "react";
import type { RegistrantFieldsFragment } from "../../../generated/graphql";
import { LinkButton } from "../../Chakra/LinkButton";
import { useTitle } from "../../Hooks/useTitle";
import useCurrentUser from "./useCurrentUser";
import useCurrentUserRegistrants from "./useCurrentUserRegistrants";

export default function ListConferencesView(): JSX.Element {
    const title = useTitle("My Conferences");

    const { user } = useCurrentUser();
    const registrants = useCurrentUserRegistrants();
    const boxBg = useColorModeValue("gray.200", "gray.700");

    const renderConferenceList = (
        icon: ComponentWithAs<"svg", IconProps>,
        registrants: readonly RegistrantFieldsFragment[],
        button: JSX.Element,
        subPath: string
    ) => {
        if (registrants.length === 0) {
            return (
                <>
                    <Text>No conferences.</Text>
                    {button}
                </>
            );
        }

        return (
            <>
                <List spacing={2} display="flex" flexDir="column" alignItems="stretch">
                    {[...registrants]
                        .filter((x) => Boolean(x.conference))
                        .sort((x, y) => x.conference.shortName.localeCompare(y.conference.shortName))
                        .map((registrant) => {
                            return (
                                <ListItem key={registrant.id} display="list-item">
                                    <LinkButton
                                        leftIcon={
                                            <Icon as={icon} color="purple.500" fontSize="100%" verticalAlign="middle" />
                                        }
                                        to={`/conference/${registrant.conference.slug}/${subPath}`}
                                        colorScheme="PrimaryActionButton"
                                        linkProps={{ w: "100%" }}
                                        w="100%"
                                        justifyContent="flex-start"
                                        variant="outline"
                                    >
                                        <Text as="span" verticalAlign="middle">
                                            {registrant.conference.shortName}
                                        </Text>
                                    </LinkButton>
                                </ListItem>
                            );
                        })}
                </List>
                {button}
            </>
        );
    };

    return (
        <>
            {title}
            <VStack
                pt={4}
                width="100%"
                flexDirection="column"
                justifyContent="flex-start"
                alignItems="center"
                spacing={5}
            >
                <Heading as="h1" id="page-heading">
                    My conferences
                </Heading>
                <VStack alignItems="flex-start" p={4} bgColor={boxBg} spacing={4}>
                    <Heading as="h3" fontSize="md" textAlign="left">
                        Login email address
                    </Heading>
                    <Text>
                        Your login email address is: <br />
                        <chakra.span fontFamily="monospace" fontSize="md" fontWeight="bold">
                            {user.email ?? "unknown"}
                        </chakra.span>
                    </Text>
                </VStack>
                <Text maxW="300px" fontSize="md">
                    <b>Choose a conference</b> or use an invite code to join a new one.
                </Text>
                {renderConferenceList(
                    LinkIcon,
                    registrants,
                    <LinkButton to="/join" colorScheme="pink" marginRight={0} mt={5}>
                        Use invite code
                    </LinkButton>,
                    ""
                )}
            </VStack>
        </>
    );
}
