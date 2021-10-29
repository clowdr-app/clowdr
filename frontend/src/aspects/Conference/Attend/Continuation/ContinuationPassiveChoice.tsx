import { ChevronUpIcon } from "@chakra-ui/icons";
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogHeader,
    Box,
    Button,
    chakra,
    Flex,
    keyframes,
    Progress,
    Text,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import type { FocusableElement } from "@chakra-ui/utils";
import type { ContinuationDefaultFor } from "@midspace/shared-types/continuation";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ContinuationChoices_ContinuationFragment } from "../../../../generated/graphql";
import { defaultOutline_AsBoxShadow } from "../../../Chakra/Outline";
import ContinuationChoiceList from "./ContinuationChoiceList";

const closedTopPos = "calc(100vh - 13ex)";
export default function ContinuationPassiveChoice({
    choices,
    isBackstage,
    noBackstage,
    currentRole,
    timeRemaining,
    timeMax,
    selectedOptionId,
    onChoiceSelected,
    activate,
}: {
    selectedOptionId: string | null;
    choices: readonly ContinuationChoices_ContinuationFragment[];
    isBackstage: boolean;
    noBackstage: boolean;
    currentRole: ContinuationDefaultFor;
    timeRemaining: number;
    timeMax: number;
    onChoiceSelected: (choiceId: string | null, isDefault: boolean) => void;
    activate: () => void;
}): JSX.Element {
    const dropUpBoxBorderColor = useColorModeValue("gray.400", "gray.500");
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

    const activeChoice = useMemo(
        () => selectedOptionId && choices.find((choice) => choice.id === selectedOptionId),
        [selectedOptionId, choices]
    );

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
                    p={0}
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
                    <Progress
                        colorScheme="purple"
                        value={timeMax - timeRemaining}
                        max={timeMax}
                        min={0}
                        userSelect="none"
                    />
                    <VStack px={6} my={2} alignItems="flex-start" mr="auto" w="100%">
                        <Text fontWeight="bold" id="passive-continuation-choices-title" userSelect="none" w="100%">
                            {vertical === closedTopPos ? "Up next:" : "Where would you like to go next?"}
                        </Text>
                        {vertical !== closedTopPos ? (
                            <Flex mb={2} alignItems="flex-start" justifyContent="flex-start" w="100%">
                                <Text id="passive-continuation-choices-description" userSelect="none" mr={2}>
                                    This event is ending soon. Please choose one of these options:
                                </Text>
                            </Flex>
                        ) : (
                            <Flex alignItems="flex-start" justifyContent="flex-start" w="100%">
                                <Flex
                                    borderWidth="2px"
                                    pl={3}
                                    pr={2}
                                    pt={1}
                                    pb={2}
                                    borderRadius="lg"
                                    borderStyle="solid"
                                    borderColor={dropUpBoxBorderColor}
                                    w="100%"
                                    mr={activeChoice ? 2 : 0}
                                    alignItems="center"
                                    justifyContent="flex-start"
                                >
                                    <chakra.span mr={2}>
                                        {activeChoice ? activeChoice.description : "Stay on this page"}
                                    </chakra.span>
                                    <ChevronUpIcon fontSize="xl" mt={1} ml="auto" />
                                </Flex>
                                {activeChoice && timeRemaining > 0 ? (
                                    <Box ml="auto" mb={2}>
                                        <Button
                                            size="md"
                                            px={2}
                                            py={2}
                                            colorScheme="purple"
                                            onClick={activate}
                                            aria-label="Activate your choice now"
                                        >
                                            Go
                                        </Button>
                                    </Box>
                                ) : undefined}
                            </Flex>
                        )}
                    </VStack>
                </AlertDialogHeader>
                {vertical === closedTopPos ? undefined : (
                    <AlertDialogBody m={0} pt={0}>
                        <Flex w="100%" borderRadius="3xl" flexDir="column" alignItems="stretch" maxW="100%">
                            <ContinuationChoiceList
                                choices={choices}
                                isBackstage={isBackstage}
                                noBackstage={noBackstage}
                                currentRole={currentRole}
                                selectedOptionId={selectedOptionId}
                                onChoiceSelected={setChoice}
                                leastDestructiveRef={leastDestructiveRef}
                                selectDefault={!madeFirstChoice}
                            />
                        </Flex>
                    </AlertDialogBody>
                )}
            </AlertDialogContent>
        </AlertDialog>
    );
}
