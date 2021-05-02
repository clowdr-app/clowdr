import { gql } from "@apollo/client";
import {
    Box,
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    useToast,
} from "@chakra-ui/react";
import { Field, FieldArray, Form, Formik } from "formik";
import React from "react";
import { useCreateDmMutation } from "../../../../generated/graphql";
import { useConference } from "../../useConference";
import { RegistrantSearch } from "./RegistrantSearch";

gql`
    mutation CreateDm($registrantIds: [uuid]!, $conferenceId: uuid!) {
        createRoomDm(registrantIds: $registrantIds, conferenceId: $conferenceId) {
            message
            roomId
            chatId
        }
    }
`;

export function CreateDmModal({
    isOpen,
    onClose,
    onCreated,
}: {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (id: string) => Promise<void>;
}): JSX.Element {
    const [createDmMutation] = useCreateDmMutation();
    const conference = useConference();
    const toast = useToast();

    return (
        <Modal scrollBehavior="inside" onClose={onClose} isOpen={isOpen} motionPreset="scale">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader pb={0}>Create new DM</ModalHeader>
                <ModalCloseButton />
                <Formik<{ new_dm_registrants: string[] }>
                    initialValues={{
                        new_dm_registrants: [],
                    }}
                    onSubmit={async (values) => {
                        try {
                            const result = await createDmMutation({
                                variables: {
                                    registrantIds: values.new_dm_registrants,
                                    conferenceId: conference.id,
                                },
                            });
                            if (result.errors || !result.data?.createRoomDm?.roomId) {
                                console.error("Failed to create DM", result.errors);
                                throw new Error("Failed to create DM");
                            } else {
                                if (result.data.createRoomDm.message !== "DM already exists") {
                                    toast({
                                        title: result.data.createRoomDm.message ?? "Created new DM",
                                        status: "success",
                                    });
                                }
                                onCreated(result.data.createRoomDm.roomId);
                                onClose();
                            }
                        } catch (e) {
                            toast({
                                title: "Could not create DM",
                                status: "error",
                            });
                            console.error("Could not create DM", e);
                        }
                    }}
                >
                    {({ values, isSubmitting, isValid }) => (
                        <>
                            <Form>
                                <ModalBody>
                                    <Box>
                                        <FieldArray name="new_dm_registrants">
                                            {(arrayHelpers) => (
                                                <>
                                                    <RegistrantSearch
                                                        selectedRegistrantIds={values.new_dm_registrants}
                                                        onSelect={async (registrantId) => {
                                                            arrayHelpers.push(registrantId);
                                                        }}
                                                    />

                                                    {values.new_dm_registrants.map((registrantId, index) => (
                                                        <div key={index}>
                                                            <Field name={`new_dm_registrants.${index}`} hidden />
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </FieldArray>
                                    </Box>
                                </ModalBody>
                                <ModalFooter>
                                    <Button
                                        mt={4}
                                        colorScheme="green"
                                        isLoading={isSubmitting}
                                        type="submit"
                                        isDisabled={!isValid}
                                    >
                                        Create
                                    </Button>
                                </ModalFooter>
                            </Form>
                        </>
                    )}
                </Formik>
            </ModalContent>
        </Modal>
    );
}
