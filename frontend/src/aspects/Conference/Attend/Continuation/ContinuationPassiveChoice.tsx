import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    Box,
    Button,
    CircularProgress,
    CircularProgressLabel,
    Flex,
    HStack,
    keyframes,
    Text,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import type { FocusableElement } from "@chakra-ui/utils";
import type { ContinuationDefaultFor } from "@clowdr-app/shared-types/build/continuation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ContinuationChoices_ContinuationFragment } from "../../../../generated/graphql";
import { defaultOutline_AsBoxShadow } from "../../../Chakra/Outline";
import { useRealTime } from "../../../Generic/useRealTime";
import { formatRemainingTime } from "../Room/formatRemainingTime";
import ContinuationChoiceList from "./ContinuationChoiceList";

const closedTopPos = "calc(100vh - 11ex)";
export default function ContinuationPassiveChoice({
    choices,
    isBackstage,
    noBackstage,
    currentRole,
    timeRemaining,
    timeMax,
    onChoiceSelected,
    activate,
}: {
    choices: readonly ContinuationChoices_ContinuationFragment[];
    isBackstage: boolean;
    noBackstage: boolean;
    currentRole: ContinuationDefaultFor;
    timeRemaining: number;
    timeMax: number;
    onChoiceSelected: (choiceId: string | null, isDefault: boolean) => void;
    activate: () => void;
}): JSX.Element {
    const progressColour = useColorModeValue("gray.50", "gray.700");
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
        "top 0.25s ease-in-out, bottom 0.25s ease-in-out, width 0.25s ease-in-out, height 0.25s ease-in-out, opacity 0.25s ease-in-out";
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
    const leastDestructiveRef = useRef<FocusableElement | null>(null);

    return (
        <AlertDialog
            leastDestructiveRef={leastDestructiveRef}
            onClose={() => {
                // TODO: Is this needed?
            }}
            isOpen={true}
            isCentered
            motionPreset="slideInBottom"
            trapFocus={vertical !== closedTopPos}
            blockScrollOnMount={vertical !== closedTopPos}
            closeOnEsc={false}
            closeOnOverlayClick={false}
            scrollBehavior="inside"
        >
            <Box
                pos="fixed"
                left="0"
                top="0"
                w="100vw"
                h="100vh"
                bgColor="black"
                zIndex="overlay"
                transition={transition}
                opacity={vertical === closedTopPos ? 0 : 0.4}
                pointerEvents={vertical === closedTopPos ? "none" : undefined}
            />
            <AlertDialogContent
                position="fixed"
                justifyContent="center"
                zIndex="modal"
                top={vertical}
                transition={transition}
                animation={`${opacityKeyframesStr2} 500ms 1 ease-out forwards`}
                userSelect="none"
                borderColor={borderColor}
                borderWidth={1}
                shadow={shadow}
                my={0}
                containerProps={{ pointerEvents: vertical === closedTopPos ? "none" : undefined }}
            >
                <AlertDialogHeader
                    fontSize="md"
                    w="100%"
                    mb={0}
                    pb={0}
                    tabIndex={vertical === closedTopPos ? 0 : -1}
                    cursor={vertical === closedTopPos ? "pointer" : undefined}
                    onClick={() => {
                        if (vertical === closedTopPos) {
                            setMadeFirstChoice(true);
                            setVertical("50vh");
                        }
                    }}
                    onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === "Space") {
                            if (vertical === closedTopPos) {
                                setMadeFirstChoice(true);
                                setVertical("50vh");
                            }
                        }
                    }}
                    pointerEvents={vertical === closedTopPos ? "all" : undefined}
                    _focus={
                        vertical === closedTopPos
                            ? {
                                  boxShadow: defaultOutline_AsBoxShadow,
                              }
                            : undefined
                    }
                >
                    <HStack flexWrap="wrap" mb={2} alignItems="flex-start" justifyContent="flex-start" w="100%">
                        <VStack mb={2} alignItems="flex-start" mr="auto">
                            <Text fontWeight="bold" id="passive-continuation-choices-title" userSelect="none">
                                Where would you like to go next?
                            </Text>
                            <Text id="passive-continuation-choices-description" userSelect="none">
                                {vertical === closedTopPos
                                    ? "Click to change your choice."
                                    : "Choose now for when the event ends."}
                            </Text>
                        </VStack>
                        {timeRemaining > 0 ? (
                            <Box mb={2}>
                                <Button
                                    size="md"
                                    px={1}
                                    py={1}
                                    colorScheme="purple"
                                    h="auto"
                                    onClick={activate}
                                    aria-label="Activate your choice now"
                                >
                                    <CircularProgress
                                        size="40px"
                                        color={progressColour}
                                        value={timeRemaining}
                                        max={timeMax}
                                        userSelect="none"
                                        mr={1}
                                    >
                                        <CircularProgressLabel>
                                            {Math.round(timeRemaining / 1000)}s
                                        </CircularProgressLabel>
                                    </CircularProgress>
                                    Go
                                </Button>
                            </Box>
                        ) : undefined}
                    </HStack>
                </AlertDialogHeader>
                {vertical === closedTopPos ? undefined : (
                    <AlertDialogBody m={0} mt={-2} pt={0} pb={madeFirstChoice ? 2 : 0}>
                        <Flex w="100%" borderRadius="3xl" flexDir="column" alignItems="stretch" maxW="100%">
                            <ContinuationChoiceList
                                choices={choices}
                                isBackstage={isBackstage}
                                noBackstage={noBackstage}
                                currentRole={currentRole}
                                onChoiceSelected={setChoice}
                                leastDestructiveRef={leastDestructiveRef}
                                selectDefault={!madeFirstChoice}
                            />
                        </Flex>
                    </AlertDialogBody>
                )}
                {!madeFirstChoice ? (
                    <AlertDialogFooter pt={0} pb={1}>
                        <Text fontSize="sm" mt={2}>
                            This window will minimise in{" "}
                            {formatRemainingTime((20000 - (now - initiallyShownAt)) / 1000, false)}
                        </Text>
                    </AlertDialogFooter>
                ) : undefined}
            </AlertDialogContent>
        </AlertDialog>
    );
}
