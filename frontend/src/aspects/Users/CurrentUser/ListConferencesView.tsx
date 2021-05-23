import { ViewIcon } from "@chakra-ui/icons";
import {
    ComponentWithAs,
    Heading,
    Icon,
    IconProps,
    List,
    ListItem,
    Text,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import React from "react";
import type { RegistrantFieldsFragment } from "../../../generated/graphql";
import { LinkButton } from "../../Chakra/LinkButton";
import { useTitle } from "../../Utils/useTitle";
import useCurrentUser from "./useCurrentUser";

export default function ListConferencesView(): JSX.Element {
    const title = useTitle("My Conferences");

    const { user } = useCurrentUser();

    const buttonTextColour = useColorModeValue("black", "white");

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
                        .sort((x, y) => x.conference.shortName.localeCompare(y.conference.shortName))
                        .map((registrant) => {
                            return (
                                <ListItem key={registrant.id} display="list-item">
                                    <LinkButton
                                        leftIcon={
                                            <Icon as={icon} color="purple.500" fontSize="50%" verticalAlign="middle" />
                                        }
                                        to={`/conference/${registrant.conference.slug}/${subPath}`}
                                        background="none"
                                        color={buttonTextColour}
                                        border="1px solid"
                                        borderColor="gray.500"
                                        linkProps={{ w: "100%" }}
                                        w="100%"
                                        justifyContent="flex-start"
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
                <Text maxW="300px" fontSize="sm">
                    Choose a conference or use an invite code to join a new one.
                </Text>
                {renderConferenceList(
                    ViewIcon,
                    user.registrants,
                    <LinkButton to="/join" colorScheme="blue" marginRight={0}>
                        Use invite code
                    </LinkButton>,
                    ""
                )}
            </VStack>
        </>
    );
}
