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
import { useManageSchedule_ListAllExhibitionTitlesQuery } from "../../../../../generated/graphql";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { makeContext } from "../../../../GQL/make-context";
import { useConference } from "../../../useConference";

gql`
    query ManageSchedule_ListAllExhibitionTitles($conferenceId: uuid!, $subconferenceCond: uuid_comparison_exp!) {
        collection_Exhibition(where: { conferenceId: { _eq: $conferenceId }, subconferenceId: $subconferenceCond }) {
            id
            name
        }
    }
`;

export default function FindExistingExhibitionModal(props: {
    isOpen: boolean;
    onClose: (id?: string) => void;
    typeDisplayName: string;
    sessionOrPresentation: "session" | "presentation";
}): JSX.Element {
    if (props.isOpen) {
        return <FindExistingExhibitionModalInner {...props} />;
    }
    return <></>;
}

function FindExistingExhibitionModalInner({
    isOpen,
    onClose,
    typeDisplayName,
    sessionOrPresentation,
}: {
    isOpen: boolean;
    onClose: (id?: string) => void;
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

    const [exhibitionsResponse] = useManageSchedule_ListAllExhibitionTitlesQuery({
        variables: {
            conferenceId: conference.id,
            subconferenceCond: subconferenceId ? { _eq: subconferenceId } : { _is_null: true },
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
                            {exhibitionsResponse.data?.collection_Exhibition.map((x) => (
                                <option key={x.id} value={x.id}>
                                    {x.name}
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
