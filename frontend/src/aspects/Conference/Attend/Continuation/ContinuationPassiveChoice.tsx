import {
    Box,
    CircularProgress,
    CircularProgressLabel,
    Flex,
    HStack,
    Portal,
    Text,
    useColorModeValue,
} from "@chakra-ui/react";
import type { ContinuationDefaultFor } from "@clowdr-app/shared-types/build/continuation";
import React, { useCallback, useState } from "react";
import type { ContinuationChoices_ContinuationFragment } from "../../../../generated/graphql";
import ContinuationChoiceList from "./ContinuationChoiceList";

export default function ContinuationPassiveChoice({
    choices,
    isBackstage,
    noBackstage,
    currentRole,
    timeRemaining,
    timeMax,
    onChoiceSelected,
}: {
    choices: readonly ContinuationChoices_ContinuationFragment[];
    isBackstage: boolean;
    noBackstage: boolean;
    currentRole: ContinuationDefaultFor;
    timeRemaining: number;
    timeMax: number;
    onChoiceSelected: (choiceId: string | null, isDefault: boolean) => void;
}): JSX.Element {
    const bgColor = useColorModeValue("gray.50", "gray.900");
    const borderColor = useColorModeValue("gray.300", "gray.600");
    const [vertical, setVertical] = useState<{ top: string } | { bottom: string }>({ bottom: "0" });
    const [mouseHadLeft, setMouseHadLeft] = useState<boolean>(false);
    const [wasClosed, setWasClosed] = useState<boolean>(false);
    const shadow = useColorModeValue("bottom-popup-light", "bottom-popup-dark");

    const setChoice = useCallback(
        (choiceId: string | null, isDefault: boolean) => {
            setWasClosed(true);
            onChoiceSelected(choiceId, isDefault);
        },
        [onChoiceSelected]
    );

    return (
        <Portal>
            <Flex
                position="fixed"
                left={0}
                justifyContent="center"
                w="100%"
                zIndex={5000}
                {...vertical}
                transition={"top 1s linear, bottom 1s linear"}
            >
                <Flex
                    borderTopColor={borderColor}
                    borderLeftColor={borderColor}
                    borderRightColor={borderColor}
                    borderTopWidth={1}
                    borderLeftWidth={1}
                    borderRightWidth={1}
                    bgColor={bgColor}
                    shadow={shadow}
                    w="auto"
                    h="auto"
                    py={2}
                    px={4}
                    borderTopRadius="3xl"
                    flexDir="column"
                    alignItems="stretch"
                    maxW="100%"
                    onClick={() => {
                        setVertical({ bottom: "0" });
                    }}
                    onMouseEnter={() => {
                        if (mouseHadLeft) {
                            setVertical({ bottom: "0" });
                            setMouseHadLeft(false);
                            setWasClosed("top" in vertical);
                        }
                    }}
                    onMouseLeave={() => {
                        setMouseHadLeft(true);
                        if (wasClosed) {
                            setVertical({ top: "calc(100% - 55px)" });
                        }
                    }}
                >
                    <HStack flexWrap="wrap" mb={2}>
                        <Text fontWeight="bold" mb={2}>
                            Where would you like to go next?
                        </Text>
                        {timeRemaining > 0 ? (
                            <Box>
                                <CircularProgress size="40px" color="blue.400" value={timeRemaining} max={timeMax}>
                                    <CircularProgressLabel>{Math.round(timeRemaining / 1000)}s</CircularProgressLabel>
                                </CircularProgress>
                            </Box>
                        ) : undefined}
                    </HStack>
                    <ContinuationChoiceList
                        choices={choices}
                        isBackstage={isBackstage}
                        noBackstage={noBackstage}
                        currentRole={currentRole}
                        onChoiceSelected={setChoice}
                    />
                </Flex>
            </Flex>
        </Portal>
    );
}
