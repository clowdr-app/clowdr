import { SettingsIcon, ViewIcon } from "@chakra-ui/icons";
import {
    ComponentWithAs,
    Heading,
    Icon,
    IconProps,
    List,
    ListItem,
    Stack,
    StackDivider,
    Text,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Permissions_Permission_Enum, RegistrantFieldsFragment } from "../../../generated/graphql";
import { LinkButton } from "../../Chakra/LinkButton";
import { useTitle } from "../../Utils/useTitle";
import useCurrentUser from "./useCurrentUser";

export default function ListConferencesView(): JSX.Element {
    const title = useTitle("My Conferences");

    const { user } = useCurrentUser();

    const buttonTextColour = useColorModeValue("black", "white");

    const { attending, organising } = useMemo(() => {
        const attendingResult: RegistrantFieldsFragment[] = [];
        const organisingResult: RegistrantFieldsFragment[] = [];
        const organiserPermissions: Permissions_Permission_Enum[] = [
            Permissions_Permission_Enum.ConferenceManageAttendees,
            Permissions_Permission_Enum.ConferenceManageContent,
            Permissions_Permission_Enum.ConferenceManageGroups,
            Permissions_Permission_Enum.ConferenceManageName,
            Permissions_Permission_Enum.ConferenceManageRoles,
            Permissions_Permission_Enum.ConferenceManageSchedule,
            Permissions_Permission_Enum.ConferenceManageShuffle,
            Permissions_Permission_Enum.ConferenceModerateAttendees,
        ];

        for (const registrant of user.registrants) {
            if (
                registrant.groupRegistrants.some((ga) =>
                    ga.group.groupRoles.some((gr) =>
                        gr.role.rolePermissions.some((rp) => organiserPermissions.includes(rp.permissionName))
                    )
                )
            ) {
                organisingResult.push(registrant);
            }
            attendingResult.push(registrant);
        }

        return {
            attending: attendingResult,
            organising: organisingResult,
        };
    }, [user.registrants]);

    const renderConferenceList = (
        icon: ComponentWithAs<"svg", IconProps>,
        registrants: RegistrantFieldsFragment[],
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
                    {registrants
                        .sort((x, y) => x.conference.shortName.localeCompare(y.conference.shortName))
                        .map((registrant) => {
                            return (
                                <ListItem key={registrant.id} display="list-item">
                                    <LinkButton
                                        leftIcon={
                                            <Icon as={icon} color="green.500" fontSize="50%" verticalAlign="middle" />
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

    const attendingConferencesEl = (
        <VStack
            width={["100%", "100%", "50%"]}
            flexDirection="column"
            justifyContent="flex-start"
            alignItems="center"
            spacing={5}
        >
            <Heading as="h1" id="page-heading">
                Attend
            </Heading>
            <Text maxW="300px" fontSize="sm">
                Choose a conference to attend or use an invite code to join a new one.
            </Text>
            {renderConferenceList(
                ViewIcon,
                attending,
                <LinkButton to="/join" colorScheme="blue" marginRight={0}>
                    Use invite code
                </LinkButton>,
                ""
            )}
        </VStack>
    );
    const organisingConferencesEl = (
        <VStack
            width={["100%", "100%", "50%"]}
            flexDirection="column"
            justifyContent="flex-start"
            alignItems="center"
            spacing={5}
        >
            <Heading as="h1">Organise</Heading>
            <Text maxW="300px" fontSize="sm">
                Choose a conference you are organising or use a demo code to create one.
            </Text>
            {renderConferenceList(
                SettingsIcon,
                organising,
                <LinkButton to="/join" colorScheme="green" marginRight={0}>
                    Create a conference
                </LinkButton>,
                "manage"
            )}
        </VStack>
    );
    const dividerColor = useColorModeValue("gray.200", "gray.700");
    return (
        <>
            {title}
            <Stack
                direction={["column", "column", "row"]}
                spacing={["2em", "2em", "4em"]}
                width="100%"
                maxWidth="1000px"
                divider={<StackDivider orientation={["horizontal", "vertical"]} borderColor={dividerColor} />}
            >
                {attendingConferencesEl}
                {organisingConferencesEl}
            </Stack>
        </>
    );
}
