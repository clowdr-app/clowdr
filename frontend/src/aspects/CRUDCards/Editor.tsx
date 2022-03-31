import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import type { TabsProps } from "@chakra-ui/react";
import {
    Alert,
    AlertDescription,
    AlertDialog,
    AlertDialogBody,
    AlertDialogCloseButton,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    AlertIcon,
    Box,
    Button,
    ButtonGroup,
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerOverlay,
    Flex,
    Heading,
    IconButton,
    omitThemingProps,
    Progress,
    StylesProvider,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    TabsDescendantsProvider,
    TabsProvider,
    useDisclosure,
    useMultiStyleConfig,
    useTabs,
    VStack,
} from "@chakra-ui/react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import type { DeepPartial, Step, ValidationState } from "./Types";

export default function Editor<T>({
    isOpen,
    onClose,
    isCreate,
    recordTypeName,
    steps,
    initialStepIdx,
    initialRecord,
    isSaving,
    onSave,
}: {
    isOpen: boolean;
    onClose: () => void;
    isCreate: boolean;

    recordTypeName: string;
    steps: Step<T>[];

    initialStepIdx: number;
    initialRecord: DeepPartial<T>;

    isSaving: boolean;
    onSave: (record: DeepPartial<T>) => Promise<ValidationState>;
}): JSX.Element {
    const [record, setRecord] = useState<DeepPartial<T>>(initialRecord);
    const [stepIdx, setStepIdx] = useState<number>(initialStepIdx);
    const maxSteps = steps.length;
    const step = steps[stepIdx];
    const leastDestructiveActionRef = useRef<HTMLButtonElement>(null);
    const loseChangesLeastDestructiveRef = useRef<HTMLButtonElement>(null);
    const firstInputRefs = useMemo(
        () => steps.map((_step) => React.createRef<HTMLInputElement | HTMLSelectElement | HTMLButtonElement | null>()),
        [steps]
    );
    const [saveError, setSaveError] = useState<string>("");
    const saveErrorDisclosure = useDisclosure();
    const [stepValidStates, setStepValidStates] = useState<ValidationState[]>(steps.map((_) => "no error"));
    const clearStepStateRefs = useMemo<React.MutableRefObject<(() => void) | null>[]>(() => {
        const result: React.MutableRefObject<(() => void) | null>[] = [];
        for (let i = 0; i < steps.length; i++) {
            result.push(React.createRef<(() => void) | null>());
        }
        return result;
    }, [steps.length]);
    const [anyChanges, setAnyChanges] = useState<boolean>(false);

    const loseChangesDisclosure = useDisclosure();

    useEffect(() => {
        if (isOpen) {
            setStepIdx(initialStepIdx);
            setRecord(initialRecord);
            setSaveError("");
            setStepValidStates(steps.map((_) => "no error"));
            setAnyChanges(false);
            saveErrorDisclosure.onClose();
            clearStepStateRefs.forEach((clear) => clear.current?.());

            if (!isCreate) {
                leastDestructiveActionRef.current?.focus();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    useEffect(() => {
        if (isCreate) {
            firstInputRefs[stepIdx]?.current?.focus();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stepIdx]);

    const tabProps = useMemo<TabsProps>(
        () => ({
            index: stepIdx,
            onChange: setStepIdx,
            children: undefined,
            colorScheme: "PrimaryActionButton",
        }),
        [stepIdx]
    );
    const styles = useMultiStyleConfig("Tabs", tabProps);
    const { children: _children, className: _className, ...rest } = omitThemingProps(tabProps);
    const { htmlProps: _htmlProps, descendants, ...ctx } = useTabs(rest);
    const context = useMemo(() => ctx, [ctx]);

    const finishOrCancelButton = (
        <Button
            ref={leastDestructiveActionRef}
            colorScheme="PrimaryActionButton"
            variant="ghost"
            fontSize="110%"
            isDisabled={isSaving}
            isLoading={isCreate && stepIdx < maxSteps - 1 && isSaving}
            onClick={async () => {
                if (anyChanges) {
                    if (isCreate) {
                        if (!stepValidStates.every((x) => x === "no error")) {
                            loseChangesDisclosure.onOpen();
                        } else {
                            setSaveError("");

                            const result = await onSave(record);
                            if (result === "no error") {
                                onClose();
                            } else {
                                setSaveError(result.error);
                                saveErrorDisclosure.onOpen();
                            }
                        }
                    } else {
                        loseChangesDisclosure.onOpen();
                    }
                } else {
                    onClose();
                }
            }}
        >
            {isCreate && anyChanges ? "Finished for now" : "Cancel"}
        </Button>
    );

    const nextOrFinishButton = (
        <Button
            colorScheme="SecondaryActionButton"
            variant="solid"
            minW="10em"
            onClick={async () => {
                if (isCreate && stepIdx < maxSteps - 1) {
                    setStepIdx((old) => old + 1);
                } else {
                    setSaveError("");

                    const result = await onSave(record);
                    if (result === "no error") {
                        onClose();
                    } else {
                        setSaveError(result.error);
                        saveErrorDisclosure.onOpen();
                    }
                }
            }}
            pr={isCreate ? 2 : undefined}
            isDisabled={
                !anyChanges ||
                isSaving ||
                (isCreate ? stepValidStates[stepIdx] !== "no error" : !stepValidStates.every((x) => x === "no error"))
            }
            isLoading={(!isCreate || stepIdx === maxSteps - 1) && isSaving}
        >
            {isCreate ? (
                stepIdx === maxSteps - 1 ? (
                    <>
                        Finished <CheckIcon m={2} fontSize="85%" />
                    </>
                ) : (
                    <>
                        Next: {steps[stepIdx + 1].name.toLocaleLowerCase()}
                        <ChevronRightIcon ml={1} fontSize="125%" />
                    </>
                )
            ) : (
                <>Save changes</>
            )}
        </Button>
    );

    return (
        <Drawer
            isOpen={isOpen}
            onClose={() => {
                if (isSaving) {
                    return;
                }

                if (anyChanges) {
                    loseChangesDisclosure.onOpen();
                } else {
                    onClose();
                }
            }}
            placement="right"
            size="lg"
            initialFocusRef={firstInputRefs[stepIdx] as any}
        >
            <DrawerOverlay />
            <DrawerContent>
                <TabsDescendantsProvider value={descendants}>
                    <TabsProvider value={context}>
                        <DrawerHeader display="flex" flexDir="column" p={0}>
                            {isCreate ? (
                                <>
                                    <Progress colorScheme="blue" value={stepIdx + 1} min={0} max={maxSteps} size="sm" />
                                    <Flex alignItems="flex-start" px={12} py={4}>
                                        <Heading as="h2" fontSize="3xl" textAlign="left" fontWeight="600">
                                            {recordTypeName} {step.name.toLocaleLowerCase()}
                                        </Heading>
                                        <Box ml="auto" fontWeight="400">
                                            {(stepIdx + 1).toString()} of {maxSteps.toString()}
                                        </Box>
                                    </Flex>
                                </>
                            ) : (
                                <StylesProvider value={styles}>
                                    <TabList px={4} pt={4}>
                                        {steps.map((step, idx) => (
                                            <Tab key={step.name + "-" + idx} fontSize="xl" borderBottomWidth="4px">
                                                {step.name}
                                            </Tab>
                                        ))}
                                    </TabList>
                                </StylesProvider>
                            )}
                        </DrawerHeader>
                        <DrawerBody px={12} py={4}>
                            <StylesProvider value={styles}>
                                <TabPanels>
                                    {steps.map((step, idx) => {
                                        return (
                                            <TabPanel key={idx} p={0}>
                                                {step.panel({
                                                    isCreate,
                                                    isDisabled: isSaving,
                                                    firstInputRef: firstInputRefs[idx],
                                                    clearState: clearStepStateRefs[idx],
                                                    record,
                                                    updateRecord: setRecord,
                                                    onValid: () => {
                                                        setStepValidStates((old) => {
                                                            const newStates = [...old];
                                                            newStates[idx] = "no error";
                                                            return newStates;
                                                        });
                                                    },
                                                    onInvalid: (error) => {
                                                        setStepValidStates((old) => {
                                                            const newStates = [...old];
                                                            newStates[idx] = error;
                                                            return newStates;
                                                        });
                                                    },
                                                    onAnyChange: () => {
                                                        setAnyChanges(true);
                                                    },
                                                })}
                                            </TabPanel>
                                        );
                                    })}
                                </TabPanels>
                            </StylesProvider>
                        </DrawerBody>
                        <DrawerFooter shadow="bottom-popup-light" px={12} py={4}>
                            <VStack spacing={2} alignItems="flex-start" w="100%">
                                {saveError.length ? (
                                    <Alert status="error">
                                        <AlertIcon />
                                        <AlertDescription>{saveError}</AlertDescription>
                                    </Alert>
                                ) : undefined}
                                <Flex w="100%" justifyContent="flex-end">
                                    {!isCreate || stepIdx < maxSteps - 1 ? finishOrCancelButton : undefined}
                                    <ButtonGroup ml="auto" isAttached>
                                        {isCreate && stepIdx > 0 ? (
                                            <IconButton
                                                colorScheme="SecondaryActionButton"
                                                aria-label="Previous step"
                                                icon={<ChevronLeftIcon fontSize="115%" />}
                                                mr="1px"
                                                onClick={() => {
                                                    setStepIdx((old) => old - 1);
                                                }}
                                                isDisabled={isSaving}
                                            />
                                        ) : undefined}
                                        {nextOrFinishButton}
                                    </ButtonGroup>
                                </Flex>
                            </VStack>
                        </DrawerFooter>
                    </TabsProvider>
                </TabsDescendantsProvider>
            </DrawerContent>
            <AlertDialog
                isOpen={loseChangesDisclosure.isOpen}
                onClose={() => {
                    loseChangesDisclosure.onClose();
                }}
                leastDestructiveRef={loseChangesLeastDestructiveRef}
            >
                <AlertDialogOverlay />
                <AlertDialogContent>
                    <AlertDialogHeader>Discard changes?</AlertDialogHeader>
                    <AlertDialogCloseButton />
                    <AlertDialogBody>
                        {isCreate
                            ? "The information is incomplete and cannot be saved yet."
                            : "Are you sure you wish to discard your changes?"}
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <ButtonGroup>
                            <Button
                                colorScheme="PrimaryActionButton"
                                variant="outline"
                                onClick={() => {
                                    loseChangesDisclosure.onClose();
                                }}
                                ref={loseChangesLeastDestructiveRef}
                            >
                                Continue editing
                            </Button>
                            <Button
                                colorScheme="DestructiveActionButton"
                                onClick={() => {
                                    loseChangesDisclosure.onClose();
                                    onClose();
                                }}
                            >
                                Discard changes
                            </Button>
                        </ButtonGroup>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Drawer>
    );
}
