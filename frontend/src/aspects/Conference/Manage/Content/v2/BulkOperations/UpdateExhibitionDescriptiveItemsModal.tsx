import {
    Button,
    ButtonGroup,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
} from "@chakra-ui/react";
import { gql } from "@urql/core";
import React, { useCallback, useMemo, useState } from "react";
import type { ManageContent_ItemFragment } from "../../../../../../generated/graphql";
import {
    useUpdateExhibitionDescriptiveItemMutation,
    useUpdateExhibitionDescriptiveItems_SelectExhibitionsQuery,
} from "../../../../../../generated/graphql";
import CenteredSpinner from "../../../../../Chakra/CenteredSpinner";
import { useConference } from "../../../../useConference";

gql`
    query UpdateExhibitionDescriptiveItems_SelectExhibitions($conferenceId: uuid!) {
        collection_Exhibition(where: { conferenceId: { _eq: $conferenceId }, descriptiveItemId: { _is_null: true } }) {
            id
            name
        }
    }

    mutation UpdateExhibitionDescriptiveItem($id: uuid!, $descriptiveItemId: uuid!) {
        update_collection_Exhibition_by_pk(pk_columns: { id: $id }, _set: { descriptiveItemId: $descriptiveItemId }) {
            id
            descriptiveItemId
        }
    }
`;

export function UpdateExhibitionDescriptiveItemsModal({
    isOpen,
    onClose,
    items,
}: {
    isOpen: boolean;
    onClose: () => void;
    items: readonly ManageContent_ItemFragment[];
}): JSX.Element {
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Update exhibition descriptive items</ModalHeader>
                <ModalCloseButton />
                {isOpen ? <ModalInner items={items} onClose={onClose} /> : undefined}
            </ModalContent>
        </Modal>
    );
}

function ModalInner({
    onClose,
    items,
}: {
    onClose: () => void;
    items: readonly ManageContent_ItemFragment[];
}): JSX.Element {
    const conference = useConference();
    const exhibitionsResponse = useUpdateExhibitionDescriptiveItems_SelectExhibitionsQuery({
        variables: {
            conferenceId: conference.id,
        },
        fetchPolicy: "no-cache",
    });
    const [doUpdate, updateResponse] = useUpdateExhibitionDescriptiveItemMutation();
    const [updatedCount, setUpdatedCount] = useState<number>(0);

    const exhibitionMatches = useMemo(() => {
        const results: {
            id: string;
            itemId: string;
        }[] = [];

        if (exhibitionsResponse.data) {
            for (const exhibition of exhibitionsResponse.data.collection_Exhibition) {
                const nameMatch = exhibition.name.toLowerCase();
                const item = items.find((item) => item.title.toLowerCase() === nameMatch);
                if (item) {
                    results.push({
                        id: exhibition.id,
                        itemId: item.id,
                    });
                }
            }
        }

        return results;
    }, [exhibitionsResponse.data, items]);

    const update = useCallback(async () => {
        try {
            setUpdatedCount(0);

            for (const match of exhibitionMatches) {
                await doUpdate({
                    variables: {
                        id: match.id,
                        descriptiveItemId: match.itemId,
                    },
                });

                setUpdatedCount((count) => count + 1);
            }

            onClose();
        } catch (e) {
            console.error("Failed to update exhibition descriptive item", e);
        }
    }, [doUpdate, exhibitionMatches, onClose]);

    return (
        <>
            <ModalBody>
                <Text>
                    This will set the descriptive item of any exhibition that currently lacks a descriptive item and
                    where a corresponding content exists with a title matching the exhibition name.
                </Text>
                {exhibitionsResponse.loading ? <CenteredSpinner /> : undefined}
                <Text mt={4}>{exhibitionMatches.length} new matches found.</Text>
                {updatedCount > 0 ? <Text mt={4}>{updatedCount} updated.</Text> : undefined}
            </ModalBody>
            <ModalFooter>
                <ButtonGroup spacing={2}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button
                        colorScheme="purple"
                        isDisabled={exhibitionMatches.length === 0}
                        isLoading={updateResponse.loading}
                        onClick={update}
                    >
                        Update
                    </Button>
                </ButtonGroup>
            </ModalFooter>
        </>
    );
}
