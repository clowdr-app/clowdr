import {
    chakra,
    Flex,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
} from "@chakra-ui/react";
import React from "react";
import type { FetchResult, MutationFunctionOptions } from "urql";
import type {
    ManageContent_UpdateElementMutation,
    ManageContent_UpdateElementMutationVariables,
} from "../../../../../../generated/graphql";
import { FAIcon } from "../../../../../Icons/FAIcon";

export function EditUploadsRemaining({
    elementId,
    uploadsRemaining,
    isUpdatingUploadable,
    updateUploadableElement,
}: {
    elementId: string;
    uploadsRemaining: number | null;
    isUpdatingUploadable: boolean;
    updateUploadableElement: (
        options?: MutationFunctionOptions<
            ManageContent_UpdateElementMutation,
            ManageContent_UpdateElementMutationVariables
        >
    ) => Promise<FetchResult<ManageContent_UpdateElementMutation>>;
}): JSX.Element {
    return (
        <>
            <Flex w="100%" mt={4} mb={2} alignItems="center">
                <Heading as="h4" fontSize="sm" textAlign="left" pl={1} mr="auto">
                    Uploads
                </Heading>
                {uploadsRemaining !== null ? (
                    <FormControl as={HStack} spacing={0} fontSize="sm" w="auto" alignItems="center">
                        <FormLabel m={0} pr={1} pb={1}>
                            Attempts remaining:
                        </FormLabel>
                        <NumberInput
                            size="xs"
                            minW={0}
                            w="50px"
                            isDisabled={isUpdatingUploadable}
                            value={uploadsRemaining}
                            onChange={(_valAsStr, valAsNum) => {
                                const newVal = Math.max(valAsNum, 0);
                                if (newVal !== uploadsRemaining) {
                                    updateUploadableElement({
                                        variables: {
                                            elementId,
                                            element: {
                                                uploadsRemaining: newVal,
                                            },
                                        },
                                    });
                                }
                            }}
                        >
                            <NumberInputField />
                            <NumberInputStepper>
                                <NumberIncrementStepper aria-label="Increment" />
                                <NumberDecrementStepper aria-label="Decrement" />
                            </NumberInputStepper>
                        </NumberInput>
                    </FormControl>
                ) : (
                    <>
                        <chakra.span fontSize="sm">Attempts remaining:</chakra.span>
                        <FAIcon iconStyle="s" icon="infinity" fontSize="xs" ml={2} />
                    </>
                )}
            </Flex>
        </>
    );
}
