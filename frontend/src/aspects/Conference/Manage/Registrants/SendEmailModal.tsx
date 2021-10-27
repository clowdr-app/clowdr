import {
    Box,
    Button,
    FormControl,
    FormErrorIcon,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Heading,
    Input,
    InputGroup,
    InputRightElement,
    Link,
    List,
    ListItem,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Text,
    Textarea,
    useToast,
} from "@chakra-ui/react";
import React, { useCallback, useMemo } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm } from "react-hook-form";
import type { RegistrantPartsFragment } from "../../../../generated/graphql";
import { Markdown } from "../../../Text/Markdown";
import { useConference } from "../../useConference";

type Inputs = { subject: string; markdownBody: string };

export function SendEmailModal({
    isOpen,
    onClose,
    registrants,
    send,
}: {
    isOpen: boolean;
    onClose: () => void;
    registrants: RegistrantPartsFragment[];
    send: (_registrantIds: string[], htmlBody: string, subject: string) => Promise<void>;
}): JSX.Element {
    const conference = useConference();
    const toast = useToast();
    const {
        formState: { errors, touchedFields, isSubmitting, isValid },
        handleSubmit,
        register,
        reset,
        watch,
    } = useForm<Inputs>({
        defaultValues: {
            subject: `${conference.shortName}: Update`,
            markdownBody: `Dear registrant,

We hope you enjoy ${conference.shortName}.


Yours sincerely,

The ${conference.shortName} organisers`,
        },
        mode: "onTouched",
    });

    const recipientsEl = useMemo(
        () => (
            <Box mt={4}>
                <Heading as="h3" textAlign="left" size="md" mb={2}>
                    Recipients
                </Heading>
                {registrants.length === 0 ? (
                    <Text>No registrants selected.</Text>
                ) : (
                    <List spacing={2} maxH="20vh" overflowY="auto">
                        {registrants.map((registrant) => (
                            <ListItem key={registrant.id}>
                                <Text>{registrant.displayName}</Text>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
        ),
        [registrants]
    );

    const onSubmit: SubmitHandler<Inputs> = useCallback(
        async (data) => {
            try {
                await send(
                    registrants.map((x) => x.id),
                    data.markdownBody,
                    data.subject
                );
                onClose();
                reset();
                toast({
                    status: "success",
                    title: "Sent emails",
                    description: `Successfully sent ${registrants.length} ${
                        registrants.length === 1 ? "email" : "emails"
                    }.`,
                });
            } catch (err: any) {
                console.error("Could not send custom emails", { err });
                toast({
                    status: "error",
                    title: "Could not send emails",
                    description: err.message,
                });
            }
        },
        [onClose, registrants, reset, send, toast]
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <form onSubmit={handleSubmit(onSubmit)}>
                <ModalContent>
                    <ModalHeader>Send custom email</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <FormControl isInvalid={Boolean(errors.subject) && Boolean(touchedFields.subject)} isRequired>
                            <FormLabel mt={2}>Subject line</FormLabel>
                            <FormHelperText>The subject line of the email.</FormHelperText>
                            <InputGroup mt={2}>
                                <Input {...register("subject", { required: true, minLength: 5 })} />
                                <InputRightElement>
                                    <FormErrorIcon />
                                </InputRightElement>
                            </InputGroup>
                            <FormErrorMessage>
                                {errors.subject?.type === "required" && "You must enter a subject line."}{" "}
                                {errors.subject?.type === "minLength" && "Subject line must be at least 5 characters."}{" "}
                                {errors.subject?.message}
                            </FormErrorMessage>
                        </FormControl>
                        <FormControl
                            isInvalid={Boolean(errors.markdownBody) && Boolean(touchedFields.markdownBody)}
                            isRequired
                        >
                            <FormLabel mt={2}>Email body</FormLabel>
                            <FormHelperText>
                                You can use Markdown formatting in your email body.{" "}
                                <Link isExternal href="https://www.markdowntutorial.com/">
                                    Learn more
                                </Link>
                                .
                            </FormHelperText>
                            <Tabs size="sm" variant="enclosed" mt={2}>
                                <TabList>
                                    <Tab>Edit</Tab>
                                    <Tab>Preview</Tab>
                                </TabList>
                                <TabPanels>
                                    <TabPanel>
                                        <Textarea
                                            fontFamily="monospace"
                                            lineHeight="lg"
                                            minH="xs"
                                            {...register("markdownBody", { required: true, maxLength: 10000 })}
                                            mt={2}
                                        />
                                    </TabPanel>
                                    <TabPanel>
                                        <Markdown>{watch("markdownBody")}</Markdown>
                                    </TabPanel>
                                </TabPanels>
                            </Tabs>
                            <FormErrorMessage>
                                {errors.markdownBody?.type === "required" && "You must write an email!"}{" "}
                                {errors.markdownBody?.type === "maxLength" &&
                                    "Email body cannot exceed 10000 characters."}{" "}
                                {errors.subject?.message}
                            </FormErrorMessage>
                        </FormControl>
                        {recipientsEl}
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            isDisabled={!isValid || registrants.length === 0}
                            mt={4}
                            colorScheme="purple"
                        >
                            Send {registrants.length} {registrants.length === 1 ? "email" : "emails"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </form>
        </Modal>
    );
}
