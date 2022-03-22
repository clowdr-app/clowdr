import { AddIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { Button, Menu, MenuButton, MenuGroup, MenuItem, MenuList } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { Registrant_RegistrantRole_Enum } from "../../../../generated/graphql";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import { useConference } from "../../useConference";

export function SubconferenceSelector(_: Record<string, never>): JSX.Element {
    const conference = useConference();
    const { subconferenceId, setSubconferenceId } = useAuthParameters();

    const subconferences = useMemo(() => {
        return conference.subconferences.map((subconference) => {
            const membership =
                "registrants" in conference
                    ? conference.registrants?.[0]?.subconferenceMemberships?.find(
                          (m) => m.subconferenceId === subconference.id
                      )
                    : null;
            return {
                subconference,
                membership: membership ?? null,
            };
        });
    }, [conference]);

    const organizerEl = useMemo(() => {
        const organizerSubconferences = subconferences.filter(
            (x) => x.membership?.role === Registrant_RegistrantRole_Enum.Organizer
        );

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
    }, [setSubconferenceId, subconferenceId, subconferences]);

    const nonOrganizerEl = useMemo(() => {
        const organizerSubconferences = subconferences.filter(
            (x) => x.membership?.role !== Registrant_RegistrantRole_Enum.Organizer
        );

        return organizerSubconferences.length ? (
            <MenuGroup title="Other subconferences">
                {organizerSubconferences.map((subconferenceEntry) => (
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
    }, [subconferences]);

    const selectedSubconference = useMemo(() => {
        return !subconferenceId
            ? "Main conference"
            : subconferences.find((x) => x.subconference.id === subconferenceId)?.subconference?.shortName ??
                  "Unknown subconference";
    }, [subconferenceId, subconferences]);

    return conference.subconferences.length ? (
        <Menu>
            <MenuButton as={Button} leftIcon={<ChevronDownIcon />} transition="all 0.2s" variant="outline">
                {selectedSubconference}
            </MenuButton>
            <MenuList>
                <MenuItem fontWeight={!subconferenceId ? "bold" : "undefined"} onClick={() => setSubconferenceId(null)}>
                    Main conference
                </MenuItem>
                {organizerEl}
                {nonOrganizerEl}
            </MenuList>
        </Menu>
    ) : (
        <Button leftIcon={<AddIcon />} isDisabled={true}>
            Add subconference
        </Button>
    );
}
