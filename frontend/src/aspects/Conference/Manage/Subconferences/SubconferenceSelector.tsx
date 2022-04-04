import { AddIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { Button, Menu, MenuButton, MenuDivider, MenuGroup, MenuItem, MenuList, useDisclosure } from "@chakra-ui/react";
import * as R from "ramda";
import React, { useEffect, useMemo } from "react";
import { Registrant_RegistrantRole_Enum } from "../../../../generated/graphql";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { useConference } from "../../useConference";
import useCurrentRegistrant, { useMaybeCurrentRegistrant } from "../../useCurrentRegistrant";
import { SubconferenceCreateDialog } from "./SubconferenceCreateDialog";

export function SubconferenceSelector(_: Record<string, never>): JSX.Element {
    const conference = useConference();
    const registrant = useCurrentRegistrant();
    const mCurrentRegistrant = useMaybeCurrentRegistrant();
    const createDialog = useDisclosure();
    const { subconferenceId, setSubconferenceId } = useAuthParameters();

    const subconferences = useMemo(() => {
        return R.sortBy((x) => x.shortName, conference.subconferences).map((subconference) => {
            const membership = registrant.subconferenceMemberships?.find((m) => m.subconferenceId === subconference.id);
            return {
                subconference,
                membership: membership ?? null,
            };
        });
    }, [conference, registrant]);

    const organizerEl = useMemo(() => {
        const organizerSubconferences =
            registrant.conferenceRole === Registrant_RegistrantRole_Enum.Organizer
                ? subconferences
                : subconferences.filter((x) => x.membership?.role === Registrant_RegistrantRole_Enum.Organizer);

        return organizerSubconferences.length ? (
            organizerSubconferences.map((subconferenceEntry) => (
                <MenuItem
                    key={subconferenceEntry.subconference.id}
                    fontWeight={subconferenceId === subconferenceEntry.subconference.id ? "bold" : "undefined"}
                    onClick={() => setSubconferenceId(subconferenceEntry.subconference.id)}
                >
                    {subconferenceEntry.subconference.shortName}
                </MenuItem>
            ))
        ) : (
            <></>
        );
    }, [registrant.conferenceRole, setSubconferenceId, subconferenceId, subconferences]);

    const nonOrganizerEl = useMemo(() => {
        const nonOrganizerSubconferences =
            registrant.conferenceRole !== Registrant_RegistrantRole_Enum.Organizer
                ? subconferences.filter((x) => x.membership?.role !== Registrant_RegistrantRole_Enum.Organizer)
                : [];

        return nonOrganizerSubconferences.length ? (
            <MenuGroup title="Other subconferences">
                {nonOrganizerSubconferences.map((subconferenceEntry) => (
                    <MenuItem
                        key={subconferenceEntry.subconference.id}
                        isDisabled={true}
                        title="You are not an organizer of this subconference."
                    >
                        {subconferenceEntry.subconference.shortName}
                    </MenuItem>
                ))}
            </MenuGroup>
        ) : (
            <></>
        );
    }, [registrant.conferenceRole, subconferences]);

    const selectedSubconference = useMemo(() => {
        return !subconferenceId
            ? "Main conference"
            : subconferences.find((x) => x.subconference.id === subconferenceId)?.subconference?.shortName ??
                  "Unknown subconference";
    }, [subconferenceId, subconferences]);

    useEffect(() => {
        const organizerOfSubconferenceId = subconferences.find((x) =>
            x.membership?.role === Registrant_RegistrantRole_Enum.Organizer ? x.membership.subconferenceId : undefined
        )?.membership?.subconferenceId;
        if (
            !subconferenceId &&
            registrant.conferenceRole !== Registrant_RegistrantRole_Enum.Organizer &&
            organizerOfSubconferenceId
        ) {
            setSubconferenceId(organizerOfSubconferenceId);
        }
    }, [registrant.conferenceRole, setSubconferenceId, subconferenceId, subconferences]);

    return (
        <>
            <SubconferenceCreateDialog isOpen={createDialog.isOpen} onClose={createDialog.onClose} />
            {conference.subconferences.length ? (
                <Menu>
                    <MenuButton as={Button} leftIcon={<ChevronDownIcon />} transition="all 0.2s" variant="outline">
                        {selectedSubconference}
                    </MenuButton>
                    <MenuList maxH="min(50vh, 25em)" overflowY="scroll">
                        <MenuItem
                            isDisabled={
                                registrant.conferenceRole !== Registrant_RegistrantRole_Enum.Organizer &&
                                registrant.conferenceRole !== Registrant_RegistrantRole_Enum.Moderator
                            }
                            title={
                                registrant.conferenceRole !== Registrant_RegistrantRole_Enum.Organizer &&
                                registrant.conferenceRole !== Registrant_RegistrantRole_Enum.Moderator
                                    ? "You are not an organizer or moderator of the main conference."
                                    : undefined
                            }
                            fontWeight={!subconferenceId ? "bold" : "undefined"}
                            onClick={() => setSubconferenceId(null)}
                        >
                            Main conference
                        </MenuItem>
                        {organizerEl}
                        {nonOrganizerEl}
                        <MenuDivider />
                        {mCurrentRegistrant?.conferenceRole === Registrant_RegistrantRole_Enum.Organizer ? (
                            <MenuItem icon={<AddIcon />} onClick={() => createDialog.onOpen()}>
                                Add subconference
                            </MenuItem>
                        ) : undefined}
                    </MenuList>
                </Menu>
            ) : mCurrentRegistrant?.conferenceRole === Registrant_RegistrantRole_Enum.Organizer ? (
                <Button leftIcon={<AddIcon />} onClick={() => createDialog.onOpen()}>
                    Add subconference
                </Button>
            ) : undefined}
        </>
    );
}
