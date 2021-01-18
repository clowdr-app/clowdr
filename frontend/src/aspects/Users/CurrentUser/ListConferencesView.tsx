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
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import React, { useEffect, useMemo } from "react";
import { AttendeeFieldsFragment, Permission_Enum } from "../../../generated/graphql";
import { LinkButton } from "../../Chakra/LinkButton";
import UseInviteOrCreateView from "../../Conference/UseInviteOrCreateView";
import usePrimaryMenuButtons from "../../Menu/usePrimaryMenuButtons";
import { useTitle } from "../../Utils/useTitle";
import useCurrentUser from "./useCurrentUser";

export default function ListConferencesView(): JSX.Element {
    const title = useTitle("My Conferences");
    const { isOpen: shouldShowUseInvite, onOpen: showUseInvite, onClose: hideUseInvite } = useDisclosure();
    const { setPrimaryMenuButtons } = usePrimaryMenuButtons();
    useEffect(() => {
        setPrimaryMenuButtons(
            shouldShowUseInvite
                ? [
                      {
                          action: hideUseInvite,
                          key: "list-conferences:hide-use-invite",
                          label: "My conferences",
                          text: "My conferences",
                      },
                  ]
                : []
        );
    }, [hideUseInvite, setPrimaryMenuButtons, shouldShowUseInvite, showUseInvite]);

    const { user } = useCurrentUser();

    const buttonTextColour = useColorModeValue("black", "white");

    const { attending, organising } = useMemo(() => {
        const attendingResult: AttendeeFieldsFragment[] = [];
        const organisingResult: AttendeeFieldsFragment[] = [];
        const organiserPermissions: Permission_Enum[] = [
            Permission_Enum.ConferenceManageAttendees,
            Permission_Enum.ConferenceManageContent,
            Permission_Enum.ConferenceManageGroups,
            Permission_Enum.ConferenceManageName,
            Permission_Enum.ConferenceManageRoles,
            Permission_Enum.ConferenceManageSchedule,
            Permission_Enum.ConferenceModerateAttendees,
        ];

        for (const attendee of user.attendees) {
            if (
                attendee.groupAttendees.some((ga) =>
                    ga.group.groupRoles.some((gr) =>
                        gr.role.rolePermissions.some((rp) => organiserPermissions.includes(rp.permissionName))
                    )
                )
            ) {
                organisingResult.push(attendee);
            }
            attendingResult.push(attendee);
        }

        return {
            attending: attendingResult,
            organising: organisingResult,
        };
    }, [user.attendees]);

    const renderConferenceList = (
        icon: ComponentWithAs<"svg", IconProps>,
        attendees: AttendeeFieldsFragment[],
        button: JSX.Element,
        subPath: string
    ) => {
        if (attendees.length === 0) {
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
                    {attendees.map((attendee) => {
                        return (
                            <ListItem key={attendee.id} display="list-item">
                                <LinkButton
                                    leftIcon={
                                        <Icon as={icon} color="green.500" fontSize="50%" verticalAlign="middle" />
                                    }
                                    to={`/conference/${attendee.conference.slug}/${subPath}`}
                                    background="none"
                                    color={buttonTextColour}
                                    border="1px solid"
                                    borderColor="gray.500"
                                    linkProps={{ w: "100%" }}
                                    w="100%"
                                    justifyContent="flex-start"
                                >
                                    <Text as="span" verticalAlign="middle">
                                        {attendee.conference.shortName}
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
            <Heading as="h1">Attend</Heading>
            <Text maxW="300px" fontSize="sm">
                Choose a conference to attend or use an invite code to join a new one.
            </Text>
            {renderConferenceList(
                ViewIcon,
                attending,
                <LinkButton to="/conference/joinOrCreate" colorScheme="blue" onClick={showUseInvite} marginRight={0}>
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
                <LinkButton to="/conference/joinOrCreate" colorScheme="green" onClick={showUseInvite} marginRight={0}>
                    Create a conference
                </LinkButton>,
                "manage"
            )}
        </VStack>
    );
    const dividerColor = useColorModeValue("gray.200", "gray.700");
    return shouldShowUseInvite ? (
        <>
            {title}
            <UseInviteOrCreateView />
        </>
    ) : (
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
