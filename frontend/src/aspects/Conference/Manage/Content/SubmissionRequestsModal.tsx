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
    ContentType_Enum,
    SubmissionRequestsModal_ConferenceConfigurationFragment,
    useSubmissionRequestsModal_GetConferenceConfigurationsQuery,
} from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { FAIcon } from "../../../Icons/FAIcon";
import { useConference } from "../../useConference";
import type { ContentGroupDescriptor } from "./Types";

function generateContentTypeFriendlyName(type: ContentType_Enum) {
    switch (type) {
        case ContentType_Enum.Abstract:
            return "Abstract";
        case ContentType_Enum.ContentGroupList:
            return "Content group list";
        case ContentType_Enum.ImageFile:
            return "Image file";
        case ContentType_Enum.ImageUrl:
            return "Image URL";
        case ContentType_Enum.Link:
            return "Link";
        case ContentType_Enum.LinkButton:
            return "Link button";
        case ContentType_Enum.PaperFile:
            return "Paper file";
        case ContentType_Enum.PaperLink:
            return "Paper link";
        case ContentType_Enum.PaperUrl:
            return "Paper URL";
        case ContentType_Enum.PosterFile:
            return "Poster file";
        case ContentType_Enum.PosterUrl:
            return "Poster URL";
        case ContentType_Enum.Text:
            return "Text";
        case ContentType_Enum.VideoBroadcast:
            return "Video for broadcast";
        case ContentType_Enum.VideoCountdown:
            return "Video countdown";
        case ContentType_Enum.VideoFile:
            return "Video file";
        case ContentType_Enum.VideoFiller:
            return "Filler video";
        case ContentType_Enum.VideoLink:
            return "Link to video";
        case ContentType_Enum.VideoPrepublish:
            return "Video for pre-publication";
        case ContentType_Enum.VideoSponsorsFiller:
            return "Sponsors filler video";
        case ContentType_Enum.VideoTitles:
            return "Pre-roll titles video";
        case ContentType_Enum.VideoUrl:
            return "Video URL";
        case ContentType_Enum.WholeSchedule:
            return "Whole schedule";
        case ContentType_Enum.Zoom:
            return "Zoom Meeting URL";
    }
}

gql`
    query SubmissionRequestsModal_GetConferenceConfigurations($conferenceId: uuid!) {
        ConferenceConfiguration(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ConfigureEmailTemplates_ConferenceConfiguration
        }
    }

    fragment SubmissionRequestsModal_ConferenceConfiguration on ConferenceConfiguration {
        id
        conferenceId
        key
        value
    }
`;

export function SendSubmissionRequestsModal({
    isOpen,
    onClose,
    contentGroups,
    send,
}: {
    isOpen: boolean;
    onClose: () => void;
    contentGroups: ContentGroupDescriptor[];
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
                        contentGroups={contentGroups}
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
    contentGroups,
    existingTemplate,
    send,
}: {
    isOpen: boolean;
    onClose: () => void;
    contentGroups: ContentGroupDescriptor[];
    existingTemplate: EmailTemplate_BaseConfig;
    send: (_uploaderIds: string[], _emailTemplate: EmailTemplate_BaseConfig) => Promise<void>;
}): JSX.Element {
    const types = useMemo(() => Object.values(ContentType_Enum), []);
    const [selectedType, setSelectedType] = useState<string>();
    const requiredItems = useMemo(
        () =>
            R.flatten(
                contentGroups.map((contentGroup) =>
                    contentGroup.requiredItems
                        .filter((item) => !selectedType || item.typeName === selectedType)
                        .map((item) => ({
                            contentGroup,
                            requiredItem: item,
                        }))
                )
            ),
        [contentGroups, selectedType]
    );
    const requiredItemsEl = useMemo(
        () => (
            <Box mt={4}>
                {requiredItems.length === 0 ? (
                    <Text>No matching files.</Text>
                ) : (
                    <List spacing={2} maxH="40vh" overflowY="auto">
                        {requiredItems.map((item) => (
                            <ListItem key={item.requiredItem.id}>
                                <HStack>
                                    <FAIcon icon="file" iconStyle="r" mr={2} />
                                    <VStack alignItems="flex-start" spacing={0}>
                                        <Text fontWeight="bold" fontSize="sm">
                                            {item.contentGroup.title}
                                        </Text>
                                        <Text fontSize="sm">
                                            {item.requiredItem.name} (
                                            {generateContentTypeFriendlyName(item.requiredItem.typeName)}) -{" "}
                                            {item.requiredItem.uploaders.length} uploader
                                            {item.requiredItem.uploaders.length > 1 ? "s" : undefined}
                                        </Text>
                                    </VStack>
                                </HStack>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
        ),
        [requiredItems]
    );

    const uploaderIds = useMemo(
        () => R.flatten(requiredItems.map((item) => item.requiredItem.uploaders.map((uploader) => uploader.id))),
        [requiredItems]
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <Formik<{ htmlBodyTemplate: string; subjectTemplate: string }>
                initialValues={{
                    htmlBodyTemplate:
                        existingTemplate.htmlBodyTemplate ?? EMAIL_TEMPLATE_SUBMISSION_REQUEST.htmlBodyTemplate,
                    subjectTemplate:
                        existingTemplate.subjectTemplate ?? EMAIL_TEMPLATE_SUBMISSION_REQUEST.subjectTemplate,
                }}
                onSubmit={(values, actions) => {
                    send(uploaderIds, {
                        htmlBodyTemplate: values.htmlBodyTemplate,
                        subjectTemplate: values.subjectTemplate,
                    });
                    actions.resetForm();
                    onClose();
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
                                                {generateContentTypeFriendlyName(type as ContentType_Enum)}
                                            </option>
                                        ))}
                                    </Select>
                                </FormControl>
                                {requiredItemsEl}
                                <Heading as="h4" textAlign="left" size="sm" mt={4}>
                                    Email template
                                </Heading>
                                <Field name="subjectTemplate">
                                    {({ field, form }: FieldProps<string>) => (
                                        <FormControl
                                            isInvalid={!!form.errors.subjectTemplate && !!form.touched.subjectTemplate}
                                        >
                                            <FormLabel htmlFor="subjectTemplate" mt={2}>
                                                Email body
                                            </FormLabel>
                                            <FormHelperText>
                                                The template for the submission request email body.
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
                                                Subject line
                                            </FormLabel>
                                            <FormHelperText>
                                                The template for the submission request email subject line.
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
                                    Send {uploaderIds.length} requests
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Form>
                )}
            </Formik>
        </Modal>
    );
}
