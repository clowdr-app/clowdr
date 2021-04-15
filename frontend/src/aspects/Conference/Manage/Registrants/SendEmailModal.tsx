import { gql } from "@apollo/client";
import {
    Box,
    Button,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Heading,
    Input,
    List,
    ListItem,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Text,
    Textarea,
    useToast,
} from "@chakra-ui/react";
import { Field, FieldProps, Form, Formik } from "formik";
import React, { useMemo } from "react";
import { useConference } from "../../useConference";
import type { AttendeeDescriptor } from "./Types";

gql`
    query SendEmail_GetAllGroups($conferenceId: uuid!) {
        Group(where: { conferenceId: { _eq: $conferenceId } }) {
            id
            enabled
            name
        }
    }
`;

export function SendEmailModal({
    isOpen,
    onClose,
    attendees,
    send,
}: {
    isOpen: boolean;
    onClose: () => void;
    attendees: AttendeeDescriptor[];
    send: (_attendeeIds: string[], htmlBody: string, subject: string) => Promise<void>;
}): JSX.Element {
    const conference = useConference();
    const toast = useToast();

    const recipients = useMemo(
        () => (
            <Box mt={4}>
                <Heading as="h3" textAlign="left" size="md" mb={2}>
                    Recipients
                </Heading>
                {attendees.length === 0 ? (
                    <Text>No attendees selected.</Text>
                ) : (
                    <List spacing={2} maxH="20vh" overflowY="auto">
                        {attendees.map((attendee) => (
                            <ListItem key={attendee.id}>
                                <Text>{attendee.displayName}</Text>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
        ),
        [attendees]
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <Formik<{ subject: string; htmlBody: string }>
                initialValues={{
                    subject: `${conference.shortName}: Update`,
                    htmlBody: `<p>Dear attendee,</p>
<p>We hope you enjoy the conference.</p>
<p>${conference.shortName} organisers</p>`,
                }}
                onSubmit={async (values, actions) => {
                    try {
                        await send(
                            attendees.map((x) => x.id),
                            values.htmlBody,
                            values.subject
                        );
                        actions.resetForm();
                        onClose();
                        toast({
                            status: "success",
                            title: "Emails sent",
                        });
                    } catch (e) {
                        toast({
                            status: "error",
                            title: "Could not send emails",
                            description: e.message,
                        });
                    }
                }}
            >
                {({ isSubmitting, isValid }) => (
                    <Form>
                        <ModalOverlay />
                        <ModalContent>
                            <ModalHeader>Send custom email</ModalHeader>
                            <ModalCloseButton />
                            <ModalBody>
                                <Field name="subject">
                                    {({ field, form }: FieldProps<string>) => (
                                        <FormControl
                                            isInvalid={!!form.errors.subject && !!form.touched.subject}
                                            isRequired
                                        >
                                            <FormLabel htmlFor="subject" mt={2}>
                                                Subject line
                                            </FormLabel>
                                            <FormHelperText>The subject line of the email.</FormHelperText>
                                            <Input {...field} id="subject" mt={2} />
                                            <FormErrorMessage>{form.errors.subject}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                                <Field name="htmlBody">
                                    {({ field, form }: FieldProps<string>) => (
                                        <FormControl
                                            isInvalid={!!form.errors.htmlBody && !!form.touched.htmlBody}
                                            isRequired
                                        >
                                            <FormLabel htmlFor="htmlBody" mt={2}>
                                                Email body
                                            </FormLabel>
                                            <FormHelperText>The email body (HTML).</FormHelperText>
                                            <Textarea
                                                fontFamily="monospace"
                                                lineHeight="lg"
                                                minH="xs"
                                                {...field}
                                                id="htmlBody"
                                                mt={2}
                                            />
                                            <FormErrorMessage>{form.errors.htmlBody}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                                {recipients}
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    type="submit"
                                    isLoading={isSubmitting}
                                    isDisabled={!isValid || attendees.length === 0}
                                    mt={4}
                                    colorScheme="green"
                                >
                                    Send {attendees.length} emails
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
}
