import { SettingsIcon, ViewIcon } from "@chakra-ui/icons";
import {
    Button,
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
import LinkButton from "../../Chakra/LinkButton";
import usePrimaryMenuButtons from "../../Menu/usePrimaryMenuButtons";
import useCurrentUser from "./useCurrentUser";
import UseInviteOrCreateView from "./UseInviteOrCreateView";

export default function ListConferencesView(): JSX.Element {
    const { isOpen: shouldShowUseInvite, onOpen: showUseInvite, onClose: hideUseInvite } = useDisclosure();
    const { setPrimaryMenuButtons } = usePrimaryMenuButtons();
    useEffect(() => {
        setPrimaryMenuButtons([
            !shouldShowUseInvite
                ? {
                      action: showUseInvite,
                      key: "list-conferences:show-use-invite",
                      label: "Use invite code",
                      text: "Use invite code",
                      colorScheme: "blue",
                  }
                : {
                      action: hideUseInvite,
                      key: "list-conferences:hide-use-invite",
                      label: "My conferences",
                      text: "My conferences",
                      colorScheme: "blue",
                  },
            ...(shouldShowUseInvite
                ? []
                : [
                      {
                          action: showUseInvite,
                          key: "list-conferences:create-conference",
                          label: "Create a conference",
                          text: "Create a conference",
                          colorScheme: "green",
                      },
                  ]),
        ]);
    }, [hideUseInvite, setPrimaryMenuButtons, shouldShowUseInvite, showUseInvite]);

    const { user } = useCurrentUser();

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
                <List spacing={3} justifyContent="stretch">
                    {attendees.map((attendee) => {
                        return (
                            <ListItem key={attendee.id}>
                                <LinkButton
                                    leftIcon={
                                        <Icon as={icon} color="green.500" fontSize="50%" verticalAlign="middle" />
                                    }
                                    to={`/conference/${attendee.conference.slug}/${subPath}`}
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
            justifyContent="start"
            alignItems="center"
            spacing={5}
        >
            <Heading as="h1">Attend</Heading>
            {renderConferenceList(
                ViewIcon,
                attending,
                <Button colorScheme="blue" onClick={showUseInvite} marginRight={0}>
                    Use invite code
                </Button>,
                ""
            )}
        </VStack>
    );
    const organisingConferencesEl = (
        <VStack
            width={["100%", "100%", "50%"]}
            flexDirection="column"
            justifyContent="start"
            alignItems="center"
            spacing={5}
        >
            <Heading as="h1">Organise</Heading>
            {renderConferenceList(
                SettingsIcon,
                organising,
                <Button colorScheme="green" onClick={showUseInvite} marginRight={0}>
                    Create a conference
                </Button>,
                "manage"
            )}
        </VStack>
    );
    const dividerColor = useColorModeValue("gray.200", "gray.700");
    return shouldShowUseInvite ? (
        <UseInviteOrCreateView />
    ) : (
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
    );
}
