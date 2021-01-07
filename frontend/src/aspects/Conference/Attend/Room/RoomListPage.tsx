import { gql } from "@apollo/client";
import {
    Box,
    Button,
    FormControl,
    FormErrorMessage,
    FormLabel,
    Heading,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Switch,
    useDisclosure,
    useToast,
} from "@chakra-ui/react";
import { Field, FieldProps, Form, Formik } from "formik";
import React, { useCallback } from "react";
import {
    Permission_Enum,
    RoomListRoomDetailsFragment,
    RoomPrivacy_Enum,
    useAttendeeCreateRoomMutation,
    useGetAllRoomsQuery,
} from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { normaliseName, validateShortName } from "../../NewConferenceForm";
import RequireAtLeastOnePermissionWrapper from "../../RequireAtLeastOnePermissionWrapper";
import { useConference } from "../../useConference";
import { RoomList } from "./RoomList";

gql`
    query GetAllRooms($conferenceId: uuid!) {
        Room(where: { conferenceId: { _eq: $conferenceId } }, order_by: { name: asc }) {
            ...RoomListRoomDetails
        }
    }

    fragment RoomListRoomDetails on Room {
        id
        name
        roomPrivacyName
    }
`;

export default function RoomListPage(): JSX.Element {
    const conference = useConference();

    const result = useGetAllRoomsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    const { isOpen, onClose, onOpen } = useDisclosure();

    const refetch = useCallback(async () => {
        await result.refetch();
    }, [result]);

    return (
        <RequireAtLeastOnePermissionWrapper permissions={[Permission_Enum.ConferenceViewAttendees]}>
            <ApolloQueryWrapper getter={(data) => data.Room} queryResult={result}>
                {(rooms: readonly RoomListRoomDetailsFragment[]) => (
                    <>
                        <Heading as="h2">Rooms</Heading>
                        <RoomList rooms={rooms} />
                        <Button onClick={onOpen}>Create new room</Button>
                        <CreateRoomModal isOpen={isOpen} onClose={onClose} refetch={refetch} />
                    </>
                )}
            </ApolloQueryWrapper>
        </RequireAtLeastOnePermissionWrapper>
    );
}

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

function CreateRoomModal({
    isOpen,
    onClose,
    refetch,
}: {
    isOpen: boolean;
    onClose: () => void;
    refetch: () => Promise<void>;
}): JSX.Element {
    const [createAttendeeRoomMutation] = useAttendeeCreateRoomMutation();
    const conference = useConference();
    const toast = useToast();

    return (
        <Modal scrollBehavior="inside" onClose={onClose} isOpen={isOpen} motionPreset="scale">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader pb={0}>Create new room</ModalHeader>
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
                            refetch();
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
                                                    isInvalid={!!form.errors.name && !!form.touched.name}
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
                                                    <FormErrorMessage>{form.errors.name}</FormErrorMessage>
                                                </FormControl>
                                            )}
                                        </Field>
                                        <Field name="new_room_private">
                                            {({ field, form }: FieldProps<string>) => (
                                                <FormControl
                                                    isInvalid={!!form.errors.private && !!form.touched.private}
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
