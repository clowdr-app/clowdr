import {
    Alert,
    AlertDescription,
    AlertTitle,
    Box,
    Button,
    ButtonGroup,
    Center,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    HStack,
    Input,
    Modal,
    ModalBody,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    NumberDecrementStepper,
    NumberIncrementStepper,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    useColorModeValue,
    VStack,
} from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import React, { useEffect, useState } from "react";
import { SketchPicker } from "react-color";
import { gql } from "urql";
import { useCreateTagModal_CreateTagMutation } from "../../../../../generated/graphql";
import type { ValidationState } from "../../../../CRUDCards/Types";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import extractActualError from "../../../../GQL/ExtractActualError";
import { useRestorableState } from "../../../../Hooks/useRestorableState";
import { TagButton } from "../../../Attend/Content/ItemList";
import { useConference } from "../../../useConference";

gql`
    mutation CreateTagModal_CreateTag($object: collection_Tag_insert_input!) {
        insert_collection_Tag_one(object: $object) {
            id
        }
    }
`;

export default function CreateTagModal({
    initialName,
    onCreate,

    isOpen,
    onClose,
}: {
    initialName: string;
    onCreate: (newTagId: string) => void;

    isOpen: boolean;
    onClose: () => void;
}): JSX.Element {
    const conference = useConference();
    const { subconferenceId } = useAuthParameters();

    const initialPriority = 10;
    const [name, setName] = useState<string>(initialName);
    const [priority, setPriority] = useRestorableState<number>(
        "CreateTagModal_Priority",
        initialPriority,
        (x) => x.toString(),
        (x) => parseInt(x, 10)
    );
    const [colour, setColour] = useRestorableState<string>(
        "CreateTagModal_Colour",
        "rgba(0,0,0,1)",
        (x) => x,
        (x) => x
    );

    const [nameHasChanged, setNameHasChanged] = useState<boolean>(false);
    const [nameValidation, setNameValidation] = useState<ValidationState>("no error");

    useEffect(() => {
        if (isOpen) {
            setName(initialName);
            setNameHasChanged(initialName.length > 0);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const tagPreviewElement = (copyNum: number) => (
        <TagButton
            key={copyNum}
            tag={{
                name: name.length ? name : "Preview",
                priority,
                colour,
                id: "",
            }}
            isExpanded={false}
            notExpander
            withBorder={true}
        />
    );

    const previewLightBgColour = useColorModeValue("AppPage.pageBackground-light", "AppPage.pageBackground-dark");
    const previewDarkBgColour = useColorModeValue("AppPage.pageBackground-dark", "AppPage.pageBackground-light");

    useEffect(() => {
        if (nameHasChanged) {
            if (name.length > 0) {
                setNameValidation("no error");
            } else {
                setNameValidation({ error: "Name is required." });
            }
        } else {
            setNameValidation("no error");
        }
    }, [name.length, nameHasChanged]);

    const [createTagResponse, createTag] = useCreateTagModal_CreateTagMutation();
    const [createError, setCreateError] = useState<string | null>(null);

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Create a tag</ModalHeader>
                <ModalBody>
                    <VStack spacing={4}>
                        <Center flexDir="column">
                            <HStack mb={4}>
                                <Box p={5} backgroundColor={previewLightBgColour}>
                                    {tagPreviewElement(0)}
                                </Box>
                                <Box p={5} backgroundColor={previewDarkBgColour}>
                                    {tagPreviewElement(1)}
                                </Box>
                            </HStack>
                        </Center>
                        <FormControl id="create-tag-name" isInvalid={nameValidation !== "no error"}>
                            <FormLabel>Name</FormLabel>
                            <Input
                                type="text"
                                value={name}
                                onChange={(ev) => {
                                    setCreateError(null);
                                    setName(ev.target.value);
                                    setNameHasChanged(true);
                                }}
                            />
                            <FormErrorMessage>
                                {nameValidation !== "no error" ? nameValidation.error : "No error"}
                            </FormErrorMessage>
                        </FormControl>
                        <FormControl id="create-tag-priority">
                            <FormLabel>Priority</FormLabel>
                            <NumberInput
                                value={priority}
                                onChange={(_, value) => {
                                    setCreateError(null);
                                    setPriority(value);
                                }}
                            >
                                <NumberInputField />
                                <NumberInputStepper>
                                    <NumberIncrementStepper />
                                    <NumberDecrementStepper />
                                </NumberInputStepper>
                            </NumberInput>
                            <FormHelperText>
                                Use priority to order tags. Lower numbers sort first. Tags of equal priority are sorted
                                alphabetically.
                            </FormHelperText>
                        </FormControl>
                        <FormControl>
                            <FormLabel>Color</FormLabel>
                            <Box color="black">
                                <SketchPicker
                                    color={colour}
                                    onChange={(c) => {
                                        setCreateError(null);
                                        setColour(`rgba(${c.rgb.r},${c.rgb.g},${c.rgb.b},${c.rgb.a ?? 0})`);
                                    }}
                                />
                            </Box>
                        </FormControl>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    {createError !== null ? (
                        <Alert status="error" mb={4}>
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{createError}</AlertDescription>
                        </Alert>
                    ) : undefined}
                    <ButtonGroup>
                        <Button
                            colorScheme="DestructiveActionButton"
                            variant="outline"
                            onClick={() => {
                                onClose();
                            }}
                            isDisabled={createTagResponse.fetching}
                        >
                            Cancel
                        </Button>
                        <Button
                            colorScheme="ConfirmButton"
                            onClick={async () => {
                                if (nameValidation === "no error") {
                                    const result = await createTag(
                                        {
                                            object: {
                                                conferenceId: conference.id,
                                                subconferenceId,
                                                name,
                                                priority,
                                                colour,
                                            },
                                        },
                                        {
                                            fetchOptions: {
                                                headers: {
                                                    [AuthHeader.Role]: subconferenceId
                                                        ? HasuraRoleName.SubconferenceOrganizer
                                                        : HasuraRoleName.ConferenceOrganizer,
                                                },
                                            },
                                        }
                                    );
                                    if (result.data?.insert_collection_Tag_one) {
                                        setCreateError(null);
                                        onClose();
                                        onCreate(result.data.insert_collection_Tag_one.id);
                                    } else {
                                        setCreateError(extractActualError(result.error) ?? null);
                                    }
                                }
                            }}
                            isDisabled={name.length === 0}
                            isLoading={createTagResponse.fetching}
                        >
                            Create
                        </Button>
                    </ButtonGroup>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
