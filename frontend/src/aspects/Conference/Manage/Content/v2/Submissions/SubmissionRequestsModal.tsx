import { gql } from "@apollo/client";
import {
    Box,
    Button,
    chakra,
    Divider,
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
    Switch,
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
    Content_ElementType_Enum,
    SubmissionRequestsModal_ConferenceConfigurationFragment,
    SubmissionRequestsModal_UploadableElementFragment,
    useInsertSubmissionRequestEmailJobsMutation,
    useSubmissionRequestsModalDataQuery,
} from "../../../../../../generated/graphql";
import ApolloQueryWrapper from "../../../../../GQL/ApolloQueryWrapper";
import { FAIcon } from "../../../../../Icons/FAIcon";
import { useConference } from "../../../../useConference";

// gql`
//     mutation InsertSubmissionRequestEmailJobs($objs: [job_queues_SubmissionRequestEmailJob_insert_input!]!) {
//         insert_job_queues_SubmissionRequestEmailJob(objects: $objs) {
//             affected_rows
//         }
//     }
// `;

function generateElementTypeFriendlyName(type: Content_ElementType_Enum) {
    switch (type) {
        case Content_ElementType_Enum.Abstract:
            return "Abstract";
        case Content_ElementType_Enum.ContentGroupList:
            return "Content group list";
        case Content_ElementType_Enum.ImageFile:
            return "Image file";
        case Content_ElementType_Enum.ImageUrl:
            return "Image URL";
        case Content_ElementType_Enum.Link:
            return "Link";
        case Content_ElementType_Enum.LinkButton:
            return "Link button";
        case Content_ElementType_Enum.PaperFile:
            return "Paper file";
        case Content_ElementType_Enum.PaperLink:
            return "Paper link";
        case Content_ElementType_Enum.PaperUrl:
            return "Paper URL";
        case Content_ElementType_Enum.PosterFile:
            return "Poster file";
        case Content_ElementType_Enum.PosterUrl:
            return "Poster URL";
        case Content_ElementType_Enum.Text:
            return "Text";
        case Content_ElementType_Enum.VideoBroadcast:
            return "Video for broadcast";
        case Content_ElementType_Enum.VideoCountdown:
            return "Video countdown";
        case Content_ElementType_Enum.VideoFile:
            return "Video file";
        case Content_ElementType_Enum.VideoFiller:
            return "Filler video";
        case Content_ElementType_Enum.VideoLink:
            return "Link to video";
        case Content_ElementType_Enum.VideoPrepublish:
            return "Video for pre-publication";
        case Content_ElementType_Enum.VideoSponsorsFiller:
            return "Sponsors filler video";
        case Content_ElementType_Enum.VideoTitles:
            return "Pre-roll titles video";
        case Content_ElementType_Enum.VideoUrl:
            return "Video URL";
        case Content_ElementType_Enum.WholeSchedule:
            return "Whole schedule";
        case Content_ElementType_Enum.Zoom:
            return "Zoom";
        case Content_ElementType_Enum.ActiveSocialRooms:
            return "Active social rooms";
        case Content_ElementType_Enum.LiveProgramRooms:
            return "Live program rooms";
        case Content_ElementType_Enum.Divider:
            return "Horizontal divider";
        case Content_ElementType_Enum.SponsorBooths:
            return "Sponsor booths";
    }
}

gql`
    query SubmissionRequestsModalData($conferenceId: uuid!, $itemIds: [uuid!]!) {
        conference_Configuration(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ConfigureEmailTemplates_ConferenceConfiguration
        }
        content_UploadableElement(where: { itemId: { _in: $itemIds } }) {
            ...SubmissionRequestsModal_UploadableElement
        }
    }

    fragment SubmissionRequestsModal_ConferenceConfiguration on conference_Configuration {
        id
        conferenceId
        key
        value
    }

    fragment SubmissionRequestsModal_UploadableElement on content_UploadableElement {
        id
        itemId
        typeName
        name
        uploadsRemaining
        itemTitle
        hasBeenUploaded
        uploaders {
            id
            email
            name
        }
    }
`;

export function SendSubmissionRequestsModal({
    isOpen,
    onClose,
    itemIds,
}: {
    isOpen: boolean;
    onClose: () => void;
    itemIds: string[];
}): JSX.Element {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            {isOpen ? <SendSubmissionRequestsModalLazyInner onClose={onClose} itemIds={itemIds} /> : undefined}
        </Modal>
    );
}

function SendSubmissionRequestsModalLazyInner({
    onClose,
    itemIds,
}: {
    onClose: () => void;
    itemIds: string[];
}): JSX.Element {
    const conference = useConference();
    const result = useSubmissionRequestsModalDataQuery({
        variables: {
            conferenceId: conference.id,
            itemIds,
        },
        fetchPolicy: "network-only",
    });
    return (
        <ApolloQueryWrapper queryResult={result} getter={(result) => result}>
            {({
                conference_Configuration,
                content_UploadableElement,
            }: {
                conference_Configuration: readonly SubmissionRequestsModal_ConferenceConfigurationFragment[];
                content_UploadableElement: readonly SubmissionRequestsModal_UploadableElementFragment[];
            }) => {
                const conferenceConfiguration =
                    conference_Configuration.find(
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
                        onClose={onClose}
                        uploadableElements={content_UploadableElement}
                        existingTemplate={existingTemplate}
                    />
                );
            }}
        </ApolloQueryWrapper>
    );
}

export function SendSubmissionRequestsModalInner({
    onClose,
    uploadableElements,
    existingTemplate,
}: {
    onClose: () => void;
    uploadableElements: readonly SubmissionRequestsModal_UploadableElementFragment[];
    existingTemplate: EmailTemplate_BaseConfig;
}): JSX.Element {
    const types = useMemo(() => Object.values(Content_ElementType_Enum), []);
    const [selectedType, setSelectedType] = useState<string>();
    const [onlyReminders, setOnlyReminders] = useState<boolean>(true);
    const filteredUploadableElements = useMemo(
        () =>
            uploadableElements.filter(
                (upElement) =>
                    (!selectedType || upElement.typeName === selectedType) &&
                    (!onlyReminders || !upElement.hasBeenUploaded)
            ),
        [uploadableElements, onlyReminders, selectedType]
    );
    const uploadableElementsEl = useMemo(
        () => (
            <Box mt={4}>
                {filteredUploadableElements.length === 0 ? (
                    <Text>No matching files.</Text>
                ) : (
                    <List spacing={2} maxH="40vh" overflowY="auto">
                        {filteredUploadableElements.map((upElement) => (
                            <ListItem key={upElement.id}>
                                <HStack>
                                    <FAIcon icon="file" iconStyle="r" mr={2} />
                                    <VStack alignItems="flex-start" spacing={0}>
                                        <Text fontWeight="bold" fontSize="sm">
                                            {upElement.itemTitle}
                                        </Text>
                                        <Text fontSize="sm">
                                            {upElement.name} ({generateElementTypeFriendlyName(upElement.typeName)}) -{" "}
                                            {upElement.uploaders.length} uploader
                                            {upElement.uploaders.length > 1 ? "s" : undefined}
                                        </Text>
                                    </VStack>
                                </HStack>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Box>
        ),
        [filteredUploadableElements]
    );

    const uploaderIds = useMemo(
        () =>
            R.flatten(
                filteredUploadableElements.map((upElement) => upElement.uploaders.map((uploader) => uploader.id))
            ),
        [filteredUploadableElements]
    );

    const toast = useToast();

    const [sendSubmissionRequests] = useInsertSubmissionRequestEmailJobsMutation();

    return (
        <ModalContent>
            <Formik<{ htmlBodyTemplate: string; subjectTemplate: string }>
                initialValues={{
                    htmlBodyTemplate:
                        existingTemplate.htmlBodyTemplate ?? EMAIL_TEMPLATE_SUBMISSION_REQUEST.htmlBodyTemplate,
                    subjectTemplate:
                        existingTemplate.subjectTemplate ?? EMAIL_TEMPLATE_SUBMISSION_REQUEST.subjectTemplate,
                }}
                onSubmit={async (values, actions) => {
                    try {
                        const result = await sendSubmissionRequests({
                            variables: {
                                objs: uploaderIds.map((id) => ({
                                    uploaderId: id,
                                    emailTemplate: {
                                        htmlBodyTemplate: values.htmlBodyTemplate,
                                        subjectTemplate: values.subjectTemplate,
                                    },
                                })),
                            },
                        });
                        if (result?.errors && result.errors.length > 0) {
                            console.error("Failed to insert SubmissionRequestEmailJob", result.errors);
                            throw new Error("Error submitting query");
                        }
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
                        <ModalHeader>
                            <Text>Send submission requests</Text>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody>
                            <FormControl>
                                <FormLabel>First requests and reminders only?</FormLabel>
                                <HStack>
                                    <chakra.span>No</chakra.span>
                                    <Switch
                                        isChecked={onlyReminders}
                                        onChange={(ev) => setOnlyReminders(ev.target.checked)}
                                    />
                                    <chakra.span>Yes</chakra.span>
                                </HStack>
                                <FormHelperText>
                                    Send emails only for elements which have not yet been submitted.
                                </FormHelperText>
                            </FormControl>
                            <Divider my={3} />
                            <FormControl>
                                <FormLabel>File type</FormLabel>
                                <Select
                                    placeholder="Choose file type"
                                    onChange={(event) => setSelectedType(event.target.value)}
                                >
                                    {types.map((type) => (
                                        <option key={type} value={type}>
                                            {generateElementTypeFriendlyName(type as Content_ElementType_Enum)}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>
                            {uploadableElementsEl}
                            <Divider my={3} />
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
                                        isInvalid={!!form.errors.htmlBodyTemplate && !!form.touched.htmlBodyTemplate}
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
                                Send {uploaderIds.length} emails ({filteredUploadableElements.length} items)
                            </Button>
                        </ModalFooter>
                    </Form>
                )}
            </Formik>
        </ModalContent>
    );
}
