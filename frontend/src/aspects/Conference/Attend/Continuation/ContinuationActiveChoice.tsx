import {
    Box,
    CircularProgress,
    CircularProgressLabel,
    HStack,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
} from "@chakra-ui/react";
import type { ContinuationDefaultFor } from "@midspace/shared-types/continuation";
import React, { useCallback, useState } from "react";
import type { ContinuationChoices_ContinuationFragment } from "../../../../generated/graphql";
import ContinuationChoiceList from "./ContinuationChoiceList";

export default function ContinuationActiveChoice({
    choices,
    isBackstage,
    noBackstage,
    currentRole,
    timeRemaining,
    timeMax,
    selectedOptionId,
    onChoiceSelected,
}: {
    choices: readonly ContinuationChoices_ContinuationFragment[];
    isBackstage: boolean;
    noBackstage: boolean;
    currentRole: ContinuationDefaultFor;
    timeRemaining: number;
    timeMax: number;
    selectedOptionId: string | null;
    onChoiceSelected: (choiceId: string | null, isDefault: boolean) => void;
}): JSX.Element {
    const [hide, setHide] = useState<boolean>(false);

    const setChoice = useCallback(
        (choiceId: string | null, isDefault: boolean) => {
            if (!isDefault) {
                setHide(true);
                onChoiceSelected(choiceId, isDefault);
            }
        },
        [onChoiceSelected]
    );

    return (
        <Modal
            isOpen={!hide}
            onClose={() => {
                setHide(true);
            }}
        >
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <HStack flexWrap="wrap" mb={2}>
                        <Text fontWeight="bold" mb={2}>
                            Where would you like to go next?
                        </Text>
                        {timeRemaining > 0 ? (
                            <Box>
                                <CircularProgress
                                    size="40px"
                                    color="SecondaryActionButton.400"
                                    value={timeRemaining}
                                    max={timeMax}
                                >
                                    <CircularProgressLabel>{Math.round(timeRemaining / 1000)}s</CircularProgressLabel>
                                </CircularProgress>
                            </Box>
                        ) : undefined}
                    </HStack>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <ContinuationChoiceList
                        choices={choices}
                        isBackstage={isBackstage}
                        noBackstage={noBackstage}
                        currentRole={currentRole}
                        selectedOptionId={selectedOptionId}
                        onChoiceSelected={setChoice}
                        selectDefault={true}
                    />
                </ModalBody>
                <ModalFooter></ModalFooter>
            </ModalContent>
        </Modal>
    );
}
