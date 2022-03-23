import {
    Button,
    FormControl,
    FormErrorIcon,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Input,
    InputGroup,
    InputRightElement,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    useToast,
} from "@chakra-ui/react";
import { AuthHeader } from "@midspace/shared-types/auth";
import { gql } from "@urql/core";
import React, { useCallback, useMemo } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import {
    Registrant_RegistrantRole_Enum,
    useSubconferenceCreateDialog_CreateSubconferenceMutation,
} from "../../../../generated/graphql";
import extractActualError from "../../../GQL/ExtractActualError";
import { makeContext } from "../../../GQL/make-context";
import { useConference } from "../../useConference";
import useCurrentRegistrant from "../../useCurrentRegistrant";

gql`
    mutation SubconferenceCreateDialog_CreateSubconference($subconference: conference_Subconference_insert_input!) {
        insert_conference_Subconference_one(object: $subconference) {
            id
        }
    }
`;

type FormValues = { name: string | null; shortName: string | null };

function generateSlug(value: string) {
    return value.replace(/\s/g, "").toLowerCase();
}

export function SubconferenceCreateDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }): JSX.Element {
    const conference = useConference();
    const registrant = useCurrentRegistrant();
    // const { setSubconferenceId } = useAuthParameters();
    const toast = useToast();
    const [, createSubconference] = useSubconferenceCreateDialog_CreateSubconferenceMutation();

    const {
        handleSubmit,
        register,
        watch,
        reset,
        formState: { errors, touchedFields, isSubmitting, isValid },
    } = useForm<FormValues>({
        defaultValues: {
            name: null,
            shortName: null,
        },
        mode: "all",
    });

    const onSubmit: SubmitHandler<FormValues> = useCallback(
        async (data) => {
            try {
                if (!data.name) {
                    throw new Error("Missing subconference name");
                }
                if (!data.shortName) {
                    throw new Error("Missing subconference short name");
                }

                const context = makeContext({
                    [AuthHeader.Role]: "conference-organizer",
                    [AuthHeader.SubconferenceId]: undefined,
                });
                const result = await createSubconference(
                    {
                        subconference: {
                            name: data.name,
                            shortName: data.shortName,
                            conferenceId: conference.id,
                            slug: generateSlug(data.name),
                            memberships: {
                                data: [
                                    {
                                        registrantId: registrant.id,
                                        role: Registrant_RegistrantRole_Enum.Organizer,
                                    },
                                ],
                            },
                        },
                    },
                    context
                );
                if (result.error) {
                    throw new Error(extractActualError(result.error));
                }
                onClose();
                reset();
                if (result.data?.insert_conference_Subconference_one?.id) {
                    // setSubconferenceId(result.data.insert_conference_Subconference_one.id);
                    toast({
                        status: "success",
                        title: "Created new subconference",
                    });
                }
            } catch (err: any) {
                console.error("Could not create new subconference", { err });
                toast({
                    status: "error",
                    title: "Could not create subconference",
                    description: err.message,
                });
            }
        },
        [conference.id, createSubconference, registrant.id, toast]
    );

    const name = watch("name");

    const slug = useMemo(() => {
        return name ? generateSlug(name) : null;
    }, [name]);

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <form onSubmit={handleSubmit(onSubmit)}>
                <ModalContent>
                    <ModalHeader>Create new subconference</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <FormControl isInvalid={Boolean(errors.name) && Boolean(touchedFields.name)}>
                            <FormLabel mt={2}>Name</FormLabel>
                            <FormHelperText>Full name of the subconference.</FormHelperText>
                            <InputGroup mt={2}>
                                <Input {...register("name", { required: true, minLength: 5 })} />
                                <InputRightElement>
                                    <FormErrorIcon />
                                </InputRightElement>
                            </InputGroup>
                            <FormErrorMessage>
                                {errors.name?.type === "required" && "You must enter a name."}{" "}
                                {errors.name?.type === "minLength" && "Name must be at least 5 characters."}{" "}
                                {errors.name?.message}
                            </FormErrorMessage>
                        </FormControl>
                        <FormControl isInvalid={Boolean(errors.shortName) && Boolean(touchedFields.shortName)}>
                            <FormLabel mt={2}>Short name</FormLabel>
                            <FormHelperText>Short name of the subconference.</FormHelperText>
                            <InputGroup mt={2}>
                                <Input {...register("shortName", { required: true, minLength: 3 })} />
                                <InputRightElement>
                                    <FormErrorIcon />
                                </InputRightElement>
                            </InputGroup>
                            <FormErrorMessage>
                                {errors.name?.type === "required" && "You must enter a short name."}{" "}
                                {errors.name?.type === "minLength" && "Short name must be at least 3 characters."}{" "}
                                {errors.name?.message}
                            </FormErrorMessage>
                        </FormControl>
                        <FormControl>
                            <FormLabel mt={2}>Slug</FormLabel>
                            <FormHelperText>A unique slug for the subconference.</FormHelperText>
                            <InputGroup mt={2}>
                                <Input value={slug ?? ""} isDisabled={true} />
                                <InputRightElement>
                                    <FormErrorIcon />
                                </InputRightElement>
                            </InputGroup>
                        </FormControl>
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme="SecondaryActionButton" mr={3} onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="PrimaryActionButton"
                            isLoading={isSubmitting}
                            type="submit"
                            isDisabled={!isValid}
                        >
                            Create
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </form>
        </Modal>
    );
}
