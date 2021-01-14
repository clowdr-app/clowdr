import { gql } from "@apollo/client";
import {
    Box,
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Switch,
    useToast,
} from "@chakra-ui/react";
import { Field, FieldProps, Form, Formik } from "formik";
import React from "react";
import { RoomPrivacy_Enum, useAttendeeCreateRoomMutation } from "../../../../generated/graphql";
import { normaliseName, validateShortName } from "../../NewConferenceForm";
import { useConference } from "../../useConference";

gql`
    mutation AttendeeCreateRoom($conferenceId: uuid!, $name: String!, $roomPrivacyName: RoomPrivacy_enum!) {
        insert_Room_one(
            object: {
                capacity: 50
                conferenceId: $conferenceId
                currentModeName: BREAKOUT
                name: $name
                roomPrivacyName: $roomPrivacyName
            }
        ) {
            id
        }
    }
`;

export function CreateRoomModal({
    isOpen,
    onClose,
    onCreated,
}: {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (id: string) => Promise<void>;
}): JSX.Element {
    const [createAttendeeRoomMutation] = useAttendeeCreateRoomMutation();
    const conference = useConference();
    const toast = useToast();

    return (
        <Modal scrollBehavior="inside" onClose={onClose} isOpen={isOpen} motionPreset="scale">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader pb={0}>Create new DM</ModalHeader>
                <ModalCloseButton />
                <Formik<{ new_room_name: string; new_room_private: boolean }>
                    initialValues={{
                        new_room_name: "",
                        new_room_private: false,
                    }}
                    onSubmit={async (values) => {
                        const name = normaliseName(values.new_room_name);
                        const result = await createAttendeeRoomMutation({
                            variables: {
                                conferenceId: conference.id,
                                name,
                                roomPrivacyName: values.new_room_private
                                    ? RoomPrivacy_Enum.Private
                                    : RoomPrivacy_Enum.Public,
                            },
                        });

                        if (result.errors || !result.data?.insert_Room_one?.id) {
                            toast({
                                title: "Could not create room",
                                status: "error",
                            });
                            console.error("Could not create room", result.errors);
                        } else {
                            toast({
                                title: `Created new room '${name}'`,
                                status: "success",
                            });
                            onCreated(result.data.insert_Room_one.id);
                            onClose();
                        }
                    }}
                >
                    {(props) => (
                        <>
                            <Form>
                                <ModalBody>
                                    <Box>
                                        <Field name="new_room_name" validate={validateShortName}>
                                            {({ field, form }: FieldProps<string>) => (
                                                <FormControl
                                                    isInvalid={
                                                        !!form.errors.new_room_name && !!form.touched.new_room_name
                                                    }
                                                    isRequired
                                                >
                                                    <FormLabel htmlFor="new_room_name">Room Name</FormLabel>
                                                    <Input
                                                        {...{
                                                            ...field,
                                                            value: normaliseName(field.value, false),
                                                        }}
                                                        id="new_room_name"
                                                        placeholder="Room name"
                                                    />
                                                    <FormErrorMessage>{form.errors.new_room_name}</FormErrorMessage>
                                                </FormControl>
                                            )}
                                        </Field>
                                        <Field name="new_room_private">
                                            {({ field, form }: FieldProps<string>) => (
                                                <FormControl
                                                    isInvalid={
                                                        !!form.errors.new_room_private &&
                                                        !!form.touched.new_room_private
                                                    }
                                                    isRequired
                                                    mt="1em"
                                                >
                                                    <FormLabel htmlFor="new_room_private">Private?</FormLabel>
                                                    <Switch {...field} id="new_room_private" />
                                                    <FormErrorMessage>{form.errors.new_room_private}</FormErrorMessage>
                                                </FormControl>
                                            )}
                                        </Field>
                                    </Box>
                                </ModalBody>
                                <ModalFooter>
                                    <Button
                                        mt={4}
                                        colorScheme="green"
                                        isLoading={props.isSubmitting}
                                        type="submit"
                                        isDisabled={!props.isValid}
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
