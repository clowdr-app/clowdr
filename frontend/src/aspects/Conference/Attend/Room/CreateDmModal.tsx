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
import { AttendeeSearch } from "./AttendeeSearch";

gql`
    mutation CreateDm($attendeeIds: [uuid]!, $conferenceId: uuid!) {
        createRoomDm(attendeeIds: $attendeeIds, conferenceId: $conferenceId) {
            message
            roomId
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
                <Formik<{ new_dm_attendees: string[] }>
                    initialValues={{
                        new_dm_attendees: [],
                    }}
                    onSubmit={async (values) => {
                        try {
                            const result = await createDmMutation({
                                variables: {
                                    attendeeIds: values.new_dm_attendees,
                                    conferenceId: conference.id,
                                },
                            });
                            if (result.errors || !result.data?.createRoomDm?.roomId) {
                                console.error("Failed to create DM", result.errors);
                                throw new Error("Failed to create DM");
                            } else {
                                toast({
                                    title: result.data.createRoomDm.message ?? "Created new DM",
                                    status: "success",
                                });
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
                                        <FieldArray name="new_dm_attendees">
                                            {(arrayHelpers) => (
                                                <>
                                                    <AttendeeSearch
                                                        selectedAttendeeIds={values.new_dm_attendees}
                                                        onSelect={async (attendeeId) => {
                                                            arrayHelpers.push(attendeeId);
                                                        }}
                                                    />

                                                    {values.new_dm_attendees.map((attendeeId, index) => (
                                                        <div key={index}>
                                                            <Field name={`new_dm_attendees.${index}`} hidden />
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
