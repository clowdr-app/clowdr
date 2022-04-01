import {
    Button,
    ButtonGroup,
    FormControl,
    FormLabel,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { useMemo, useState } from "react";
import { gql } from "urql";
import type { Content_ItemType_Enum } from "../../../../../generated/graphql";
import { useManageSchedule_ListAllItemTitlesQuery } from "../../../../../generated/graphql";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { makeContext } from "../../../../GQL/make-context";
import { useConference } from "../../../useConference";

gql`
    query ManageSchedule_ListAllItemTitles(
        $conferenceId: uuid!
        $subconferenceCond: uuid_comparison_exp!
        $typeNames: [content_ItemType_enum!]!
    ) {
        content_Item(
            where: {
                conferenceId: { _eq: $conferenceId }
                subconferenceId: $subconferenceCond
                typeName: { _in: $typeNames }
                _or: [{ _not: { events: {} } }, { typeName: { _eq: SPONSOR } }]
            }
        ) {
            id
            title
        }
    }
`;

export default function FindExistingContentModal(props: {
    isOpen: boolean;
    onClose: (id?: string) => void;
    typeNames: Content_ItemType_Enum[];
    typeDisplayName: string;
    sessionOrPresentation: "session" | "presentation";
}): JSX.Element {
    if (props.isOpen) {
        return <FindExistingContentModalInner {...props} />;
    }
    return <></>;
}

function FindExistingContentModalInner({
    isOpen,
    onClose,
    typeNames,
    typeDisplayName,
    sessionOrPresentation,
}: {
    isOpen: boolean;
    onClose: (id?: string) => void;
    typeNames: Content_ItemType_Enum[];
    typeDisplayName: string;
    sessionOrPresentation: "session" | "presentation";
}): JSX.Element {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const conference = useConference();
    const { subconferenceId } = useAuthParameters();
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: subconferenceId
                    ? HasuraRoleName.SubconferenceOrganizer
                    : HasuraRoleName.ConferenceOrganizer,
            }),
        [subconferenceId]
    );

    const [itemsResponse] = useManageSchedule_ListAllItemTitlesQuery({
        variables: {
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
            typeNames,
        },
        context,
    });

    return (
        <Modal isOpen={isOpen} onClose={() => onClose()}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    Add {sessionOrPresentation} for {typeDisplayName.toLowerCase()}
                </ModalHeader>
                <ModalBody>
                    <FormControl>
                        <FormLabel>{typeDisplayName}</FormLabel>
                        <Select
                            value={selectedId ?? ""}
                            onChange={(ev) => {
                                setSelectedId(ev.target.value);
                            }}
                        >
                            <option value="">Select {typeDisplayName.toLowerCase()}</option>
                            {itemsResponse.data?.content_Item.map((x) => (
                                <option key={x.id} value={x.id}>
                                    {x.title}
                                </option>
                            ))}
                        </Select>
                    </FormControl>
                </ModalBody>
                <ModalFooter>
                    <ButtonGroup>
                        <Button variant="outline" colorScheme="blue" onClick={() => onClose()}>
                            Cancel
                        </Button>
                        <Button
                            variant="solid"
                            colorScheme="PrimaryActionButton"
                            onClick={async () => {
                                onClose(selectedId ?? undefined);
                            }}
                            isDisabled={!selectedId?.length}
                        >
                            Add {sessionOrPresentation}
                        </Button>
                    </ButtonGroup>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
