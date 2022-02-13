import {
    Button,
    chakra,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Select,
    useToast,
    VStack,
} from "@chakra-ui/react";
import type { ValidatedData } from "@midspace/shared-types/import/program";
import type { ProgramImportOptions } from "@midspace/shared-types/import/programImportOptions";
import React, { useCallback, useEffect } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import type { ParsedData } from "../../../../../Files/useCSVJSONXMLParser";
import Step from "./Step";

export default function StartImportStep({
    data,
    onNextStep,
    onPreviousStep,
    onCanProceedChange,
    isOngoingImport,
    onStartImport,
}: {
    data: ParsedData<ValidatedData>[] | undefined;
    onNextStep?: () => void;
    onPreviousStep?: () => void;
    onCanProceedChange?: (canProceed: boolean) => void;
    isActive: boolean;
    isOngoingImport: boolean;
    onStartImport: (data: ParsedData<ValidatedData>[], options: ProgramImportOptions) => Promise<void>;
}): JSX.Element {
    useEffect(() => {
        onCanProceedChange?.(isOngoingImport);
    }, [isOngoingImport, onCanProceedChange]);

    const {
        formState: { errors, touchedFields, isSubmitting, isValid },
        handleSubmit,
        register,
    } = useForm<ProgramImportOptions>({
        defaultValues: {
            eventImportMode: "session",
            defaultEventMode: "video-chat",
            speakerRoleName: "PRESENTER",
            tagPresentationsBySession: "yes",
        },
        mode: "all",
    });

    const toast = useToast();
    const onSubmit: SubmitHandler<ProgramImportOptions> = useCallback(
        async (options: ProgramImportOptions) => {
            try {
                if (data) {
                    await onStartImport(data, options);
                } else {
                    throw new Error("No data available");
                }
            } catch (err: any) {
                console.error("Error while starting the import", err);
                toast({
                    status: "error",
                    title: "Failed to start importing",
                    description: err.message,
                });
            }
        },
        [data, onStartImport, toast]
    );

    return (
        <Step
            onNextStep={isOngoingImport ? onNextStep : undefined}
            isNextStepEnabled={isOngoingImport}
            onPreviousStep={onPreviousStep}
            isPreviousStepEnabled={true}
        >
            <chakra.form onSubmit={handleSubmit(onSubmit)}>
                <VStack maxW="30em" alignItems="flex-start" w="100%" spacing={6}>
                    <FormControl
                        isInvalid={
                            Boolean(errors.tagPresentationsBySession) &&
                            Boolean(touchedFields.tagPresentationsBySession)
                        }
                        isRequired
                        id="tagPresentationsBySession"
                    >
                        <FormLabel>Tag presentations by session</FormLabel>
                        <Select {...register("tagPresentationsBySession")}>
                            <option value="yes">Yes - automatically tag</option>
                            <option value="no">No - do not automatically tag</option>
                        </Select>
                        <FormErrorMessage>{errors.tagPresentationsBySession?.message}</FormErrorMessage>
                        <FormHelperText>
                            Choose whether to automatically tag each presentation by the title of its session.
                        </FormHelperText>
                    </FormControl>
                    <FormControl
                        isInvalid={Boolean(errors.eventImportMode) && Boolean(touchedFields.eventImportMode)}
                        isRequired
                        id="eventImportMode"
                    >
                        <FormLabel>Schedule format</FormLabel>
                        <Select {...register("eventImportMode")}>
                            <option value="session">Sessions as blocks</option>
                            <option value="presentation">Presentations as blocks</option>
                        </Select>
                        <FormErrorMessage>{errors.eventImportMode?.message}</FormErrorMessage>
                        <FormHelperText>
                            Choose whether to import whole sessions as blocks in the schedule or individual
                            presentations as separate blocks in the schedule.
                            <br />
                            This option will be made more flexible later in 2022.
                        </FormHelperText>
                    </FormControl>
                    <FormControl
                        isInvalid={Boolean(errors.speakerRoleName) && Boolean(touchedFields.speakerRoleName)}
                        isRequired
                        id="speakerRoleName"
                    >
                        <FormLabel>Role name for speakers</FormLabel>
                        <Select {...register("speakerRoleName")}>
                            <option value="AUTHOR">Author</option>
                            <option value="PRESENTER">Presenter</option>
                            <option value="DISCUSSANT">Discussant</option>
                        </Select>
                        <FormErrorMessage>{errors.speakerRoleName?.message}</FormErrorMessage>
                        <FormHelperText>
                            Label speakers with this role. This does not affect their permissions or ability to present.
                        </FormHelperText>
                    </FormControl>
                    <FormControl
                        isInvalid={Boolean(errors.defaultEventMode) && Boolean(touchedFields.defaultEventMode)}
                        isRequired
                        id="defaultEventMode"
                    >
                        <FormLabel>Default interaction mode</FormLabel>
                        <Select {...register("defaultEventMode")}>
                            <option value="video-chat">Video-chat</option>
                            <option value="live-stream">Live-stream</option>
                            <option value="breakout video-chat">Breakout video-chat</option>
                            <option value="networking">Networking</option>
                            <option value="external event">External event</option>
                        </Select>
                        <FormErrorMessage>{errors.defaultEventMode?.message}</FormErrorMessage>
                        <FormHelperText>
                            Choose the default interaction mode for events. This is an advanced option that should
                            usually be left at its default value.
                        </FormHelperText>
                    </FormControl>
                    <Button
                        colorScheme="ConfirmButton"
                        type="submit"
                        isDisabled={isOngoingImport || !isValid}
                        isLoading={isSubmitting}
                    >
                        Start import
                    </Button>
                </VStack>
            </chakra.form>
        </Step>
    );
}
