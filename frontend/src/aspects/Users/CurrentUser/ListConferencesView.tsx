import { LinkIcon } from "@chakra-ui/icons";
import {
    chakra,
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
import { FormattedMessage } from "react-intl";
import type { RegistrantFieldsFragment } from "../../../generated/graphql";
import { LinkButton } from "../../Chakra/LinkButton";
import { useTitle } from "../../Utils/useTitle";
import useCurrentUser from "./useCurrentUser";

export default function ListConferencesView(): JSX.Element {
    const title = useTitle("My Conferences");

    const { user } = useCurrentUser();
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
                    <Text>
                        <FormattedMessage
                            id="users.currentuser.listconferencesview.noconferences"
                            defaultMessage="No conferences."
                        />
                    </Text>
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
                    <FormattedMessage
                        id="users.currentuser.listconferencesview.myconferences"
                        defaultMessage="My conferences"
                    />
                </Heading>
                <VStack alignItems="flex-start" p={4} bgColor={boxBg} spacing={4}>
                    <Heading as="h3" fontSize="md" textAlign="left">
                        <FormattedMessage
                            id="users.currentuser.listconferencesview.loginemail"
                            defaultMessage="Login email address"
                        />
                    </Heading>
                    <Text>
                        <FormattedMessage
                            id="users.currentuser.listconferencesview.yourloginemail"
                            defaultMessage="Your login email address is:"
                        />{" "}<br />
                        <chakra.span fontFamily="monospace" fontSize="md" fontWeight="bold">
                            {user.email ?? "unknown"}
                        </chakra.span>
                    </Text>
                </VStack>
                <Text maxW="300px" fontSize="md">
                    <FormattedMessage
                        id="users.currentuser.listconferencesview.chooseaconference"
                        defaultMessage="<strong>Choose a conference</strong> or use an invite code to join a new one."
                    />
                </Text>
                {renderConferenceList(
                    LinkIcon,
                    user.registrants,
                    <LinkButton to="/join" colorScheme="pink" marginRight={0} mt={5}>
                        <FormattedMessage
                            id="users.currentuser.listconferencesview.useinvitecode"
                            defaultMessage="Use invite code"
                        />
                    </LinkButton>,
                    ""
                )}
            </VStack>
        </>
    );
}
