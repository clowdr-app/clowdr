import {
    Box,
    CircularProgress,
    CircularProgressLabel,
    Flex,
    HStack,
    keyframes,
    Portal,
    Text,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import type { ContinuationDefaultFor } from "@clowdr-app/shared-types/build/continuation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ContinuationChoices_ContinuationFragment } from "../../../../generated/graphql";
import { useRealTime } from "../../../Generic/useRealTime";
import { formatRemainingTime } from "../Room/formatRemainingTime";
import ContinuationChoiceList from "./ContinuationChoiceList";

const closedTopPos = "calc(100vh - 10ex)";
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
    const [vertical, setVertical] = useState<string>("50vh");
    const [madeFirstChoice, setMadeFirstChoice] = useState<boolean>(false);
    const shadow = useColorModeValue("bottom-popup-light", "bottom-popup-dark");

    const setChoice = useCallback(
        (choiceId: string | null, isDefault: boolean, isInitial: boolean) => {
            onChoiceSelected(choiceId, isDefault);

            if (!isInitial) {
                setVertical(closedTopPos);
                setMadeFirstChoice(true);
            }
        },
        [onChoiceSelected]
    );
    const transition =
        "top 0.25s ease-in-out, bottom 0.25s ease-in-out, width 0.25s ease-in-out, opacity 0.25s ease-in-out";
    const opacityKeyframesStr2 = keyframes`
        0% {
            opacity: 0;
        }
        60% {
            opacity: 0.3;
        }
        100% {
            opacity: 1;
        }
    `;

    const initiallyShownAt = useMemo(() => Date.now(), []);
    const now = useRealTime(1000);
    useEffect(() => {
        const tId = setTimeout(
            (() => {
                if (!madeFirstChoice) {
                    setVertical(closedTopPos);
                }
            }) as TimerHandler,
            20000
        );

        return () => {
            clearTimeout(tId);
        };
    }, [madeFirstChoice]);

    return (
        <Portal>
            <Box
                pos="fixed"
                top={0}
                left={0}
                w="100%"
                h={vertical === closedTopPos ? "0" : "100%"}
                bgColor="black"
                zIndex={5000}
                transition={transition}
                opacity={vertical !== closedTopPos ? 0.4 : 0}
            >
                &nbsp;
            </Box>
            <Flex
                position="fixed"
                left="50vw"
                justifyContent="center"
                zIndex={5000}
                top={vertical}
                transition={transition}
                animation={`${opacityKeyframesStr2} 500ms 1 ease-out forwards`}
            >
                <Flex
                    pos="relative"
                    left="-50%"
                    borderColor={borderColor}
                    borderWidth={1}
                    bgColor={bgColor}
                    shadow={shadow}
                    w="auto"
                    h="auto"
                    py={2}
                    px={4}
                    borderRadius="3xl"
                    flexDir="column"
                    alignItems="stretch"
                    maxW="100%"
                    onClick={() => {
                        if (vertical === closedTopPos) {
                            setMadeFirstChoice(true);
                            setVertical("50vh");
                        }
                    }}
                >
                    <HStack flexWrap="wrap" mb={2} alignItems="flex-start" justifyContent="flex-start">
                        <VStack mb={2} alignItems="flex-start">
                            <Text fontWeight="bold">Where would you like to go next?</Text>
                            <Text>
                                {vertical !== closedTopPos
                                    ? "Choose now for when the event ends."
                                    : "Click to change your choice."}
                            </Text>
                        </VStack>
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
                    {!madeFirstChoice ? (
                        <Text fontSize="sm" mt={2}>
                            This window will minimise in{" "}
                            {formatRemainingTime((20000 - (now - initiallyShownAt)) / 1000, false)}
                        </Text>
                    ) : undefined}
                </Flex>
            </Flex>
        </Portal>
    );
}
