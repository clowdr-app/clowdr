import { gql } from "@apollo/client";
import {
    Box,
    Button,
    FormControl,
    FormErrorMessage,
    FormHelperText,
    FormLabel,
    Heading,
    HStack,
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
    Select,
    Text,
    Textarea,
    useToast,
    VStack,
} from "@chakra-ui/react";
import {
    ConferenceConfigurationKey,
    EmailTemplate_BaseConfig,
    isEmailTemplate_BaseConfig,
} from "@clowdr-app/shared-types/build/conferenceConfiguration";
import { EMAIL_TEMPLATE_SUBMISSION_REQUEST } from "@clowdr-app/shared-types/build/email";
import { Field, FieldProps, Form, Formik } from "formik";
import * as R from "ramda";
import React, { useMemo, useState } from "react";
import {
    ElementType_Enum,
    SubmissionRequestsModal_ConferenceConfigurationFragment,
    useSubmissionRequestsModal_GetConferenceConfigurationsQuery,
} from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { FAIcon } from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";
import type { ItemDescriptor } from "./Types";

function generateElementTypeFriendlyName(type: ElementType_Enum) {
    switch (type) {
        case ElementType_Enum.Abstract:
            return "Abstract";
        case ElementType_Enum.ItemList:
            return "Content group list";
        case ElementType_Enum.ImageFile:
            return "Image file";
        case ElementType_Enum.ImageUrl:
            return "Image URL";
        case ElementType_Enum.Link:
            return "Link";
        case ElementType_Enum.LinkButton:
            return "Link button";
        case ElementType_Enum.PaperFile:
            return "Paper file";
        case ElementType_Enum.PaperLink:
            return "Paper link";
        case ElementType_Enum.PaperUrl:
            return "Paper URL";
        case ElementType_Enum.PosterFile:
            return "Poster file";
        case ElementType_Enum.PosterUrl:
            return "Poster URL";
        case ElementType_Enum.Text:
            return "Text";
        case ElementType_Enum.VideoBroadcast:
            return "Video for broadcast";
        case ElementType_Enum.VideoCountdown:
            return "Video countdown";
        case ElementType_Enum.VideoFile:
            return "Video file";
        case ElementType_Enum.VideoFiller:
            return "Filler video";
        case ElementType_Enum.VideoLink:
            return "Link to video";
        case ElementType_Enum.VideoPrepublish:
            return "Video for pre-publication";
        case ElementType_Enum.VideoSponsorsFiller:
            return "Sponsors filler video";
        case ElementType_Enum.VideoTitles:
            return "Pre-roll titles video";
        case ElementType_Enum.VideoUrl:
            return "Video URL";
        case ElementType_Enum.WholeSchedule:
            return "Whole schedule";
        case ElementType_Enum.Zoom:
            return "Zoom Meeting URL";
    }
}

gql`
    query SubmissionRequestsModal_GetConferenceConfigurations($conferenceId: uuid!) {
        conference_Configuration(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ConfigureEmailTemplates_ConferenceConfiguration
        }
    }

    fragment SubmissionRequestsModal_ConferenceConfiguration on conference_Configuration {
        id
        conferenceId
        key
        value
    }
`;

export function SendSubmissionRequestsModal({
    isOpen,
    onClose,
    items,
    send,
}: {
    isOpen: boolean;
    onClose: () => void;
    items: ItemDescriptor[];
    send: (_uploaderIds: string[], _emailTemplate: EmailTemplate_BaseConfig) => Promise<void>;
}): JSX.Element {
    const conference = useConference();
    const result = useSubmissionRequestsModal_GetConferenceConfigurationsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });
    return (
        <ApolloQueryWrapper queryResult={result} getter={(result) => result.ConferenceConfiguration}>
            {(conferenceConfigurations: readonly SubmissionRequestsModal_ConferenceConfigurationFragment[]) => {
                const conferenceConfiguration =
                    conferenceConfigurations.find(
                        (c) => c.key === ConferenceConfigurationKey.EmailTemplate_SubmissionRequest
                    ) ?? null;

                let existingTemplate: EmailTemplate_BaseConfig = {
                    htmlBodyTemplate: null,
                    subjectTemplate: null,
                };
                if (conferenceConfiguration?.value && isEmailTemplate_BaseConfig(conferenceConfiguration.value)) {
                    existingTemplate = (conferenceConfiguration.value as unknown) as EmailTemplate_BaseConfig;
                }

                return (
                    <SendSubmissionRequestsModalInner
                        isOpen={isOpen}
                        onClose={onClose}
                        items={items}
                        existingTemplate={existingTemplate}
                        send={send}
                    />
                );
            }}
        </ApolloQueryWrapper>
    );
}

export function SendSubmissionRequestsModalInner({
    isOpen,
    onClose,
    items,
    existingTemplate,
    send,
}: {
    isOpen: boolean;
    onClose: () => void;
    items: ItemDescriptor[];
    existingTemplate: EmailTemplate_BaseConfig;
    send: (_uploaderIds: string[], _emailTemplate: EmailTemplate_BaseConfig) => Promise<void>;
}): JSX.Element {
    const types = useMemo(() => Object.values(ElementType_Enum), []);
    const [selectedType, setSelectedType] = useState<string>();
    const uploadableItems = useMemo(
        () =>
            R.flatten(
                items.map((item) =>
                    item.uploadableItems
                        .filter((item) => !selectedType || item.typeName === selectedType)
                        .map((item) => ({
                            item,
                            uploadableItem: item,
                        }))
                )
            ),
        [items, selectedType]
    );
    const uploadableItemsEl = useMemo(
        () => (
            <Box mt={4}>
                {uploadableItems.length === 0 ? (
                    <Text>No matching files.</Text>
                ) : (
                    <List spacing={2} maxH="40vh" overflowY="auto">
                        {uploadableItems.map((item) => (
                            <ListItem key={item.uploadableItem.id}>
                                <HStack>
                                    <FAIcon icon="file" iconStyle="r" mr={2} />
                                    <VStack alignItems="flex-start" spacing={0}>
                                        <Text fontWeight="bold" fontSize="sm">
                                            {item.item.title}
                                        </Text>
                                        <Text fontSize="sm">
                                            {item.uploadableItem.name} (
                                            {generateElementTypeFriendlyName(item.uploadableItem.typeName)}) -{" "}
                                            {item.uploadableItem.uploaders.length} uploader
                                            {item.uploadableItem.uploaders.length > 1 ? "s" : undefined}
                                        </Text>
                                    </VStack>
                                </HStack>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
        ),
        [uploadableItems]
    );

    const uploaderIds = useMemo(
        () => R.flatten(uploadableItems.map((item) => item.uploadableItem.uploaders.map((uploader) => uploader.id))),
        [uploadableItems]
    );

    const toast = useToast();

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <Formik<{ htmlBodyTemplate: string; subjectTemplate: string }>
                initialValues={{
                    htmlBodyTemplate:
                        existingTemplate.htmlBodyTemplate ?? EMAIL_TEMPLATE_SUBMISSION_REQUEST.htmlBodyTemplate,
                    subjectTemplate:
                        existingTemplate.subjectTemplate ?? EMAIL_TEMPLATE_SUBMISSION_REQUEST.subjectTemplate,
                }}
                onSubmit={async (values, actions) => {
                    try {
                        await send(uploaderIds, {
                            htmlBodyTemplate: values.htmlBodyTemplate,
                            subjectTemplate: values.subjectTemplate,
                        });
                        actions.resetForm();
                        onClose();
                        toast({
                            title: "Requests sent",
                            duration: 3000,
                            isClosable: true,
                            status: "success",
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
                            <ModalHeader>Send submission requests</ModalHeader>
                            <ModalCloseButton />
                            <ModalBody>
                                <FormControl>
                                    <FormLabel>File type</FormLabel>
                                    <Select
                                        placeholder="Choose file type"
                                        onChange={(event) => setSelectedType(event.target.value)}
                                    >
                                        {types.map((type) => (
                                            <option key={type} value={type}>
                                                {generateElementTypeFriendlyName(type as ElementType_Enum)}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                                {uploadableItemsEl}
                                <Heading as="h4" textAlign="left" size="sm" mt={4}>
                                    Email template
                                </Heading>
                                <Field name="subjectTemplate">
                                    {({ field, form }: FieldProps<string>) => (
                                        <FormControl
                                            isInvalid={!!form.errors.subjectTemplate && !!form.touched.subjectTemplate}
                                        >
                                            <FormLabel htmlFor="subjectTemplate" mt={2}>
                                                Subject line
                                            </FormLabel>
                                            <FormHelperText>
                                                The template for the submission request email subject line.
                                            </FormHelperText>
                                            <Input {...field} id="subjectTemplate" mt={2} />
                                            <FormErrorMessage>{form.errors.subjectTemplate}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                                <Field name="htmlBodyTemplate">
                                    {({ field, form }: FieldProps<string>) => (
                                        <FormControl
                                            isInvalid={
                                                !!form.errors.htmlBodyTemplate && !!form.touched.htmlBodyTemplate
                                            }
                                        >
                                            <FormLabel htmlFor="htmlBodyTemplate" mt={2}>
                                                Email body
                                            </FormLabel>
                                            <FormHelperText>
                                                The template for the submission request email body.
                                            </FormHelperText>
                                            <Textarea
                                                fontFamily="monospace"
                                                lineHeight="lg"
                                                minH="xs"
                                                {...field}
                                                id="htmlBodyTemplate"
                                                mt={2}
                                            />
                                            <FormErrorMessage>{form.errors.htmlBodyTemplate}</FormErrorMessage>
                                        </FormControl>
                                    )}
                                </Field>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    type="submit"
                                    isLoading={isSubmitting}
                                    isDisabled={!isValid || uploaderIds.length === 0}
                                    mt={4}
                                    colorScheme="green"
                                >
                                    Send {uploaderIds.length} emails ({uploadableItems.length} items)
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
}
