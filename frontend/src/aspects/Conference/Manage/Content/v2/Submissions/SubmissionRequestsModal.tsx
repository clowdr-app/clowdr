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
import type { EmailTemplate_BaseConfig } from "@midspace/shared-types/conferenceConfiguration";
import { isEmailTemplate_BaseConfig } from "@midspace/shared-types/conferenceConfiguration";
import { EMAIL_TEMPLATE_SUBMISSION_REQUEST } from "@midspace/shared-types/email";
import { gql } from "@urql/core";
import type { FieldProps } from "formik";
import { Field, Form, Formik } from "formik";
import React, { useMemo, useState } from "react";
import type {
    SubmissionRequestsModal_ConferenceConfigurationFragment,
    SubmissionRequestsModal_ItemFragment,
} from "../../../../../../generated/graphql";
import {
    Conference_ConfigurationKey_Enum,
    Content_ItemType_Enum,
    useInsertSubmissionRequestEmailJobsMutation,
    useSubmissionRequestsModalDataQuery,
} from "../../../../../../generated/graphql";
import MultiSelect from "../../../../../Chakra/MultiSelect";
import { makeContext } from "../../../../../GQL/make-context";
import QueryWrapper from "../../../../../GQL/QueryWrapper";
import { FAIcon } from "../../../../../Icons/FAIcon";
import { useConference } from "../../../../useConference";

gql`
    mutation InsertSubmissionRequestEmailJobs($objs: [job_queues_SubmissionRequestEmailJob_insert_input!]!) {
        insert_job_queues_SubmissionRequestEmailJob(objects: $objs) {
            affected_rows
        }
    }
`;

function generateItemTypeFriendlyName(type: Content_ItemType_Enum): string {
    return type
        .split("_")
        .map((x) => x[0] + x.substr(1).toLowerCase())
        .reduce((acc, x) => `${acc} ${x}`);
}

gql`
    query SubmissionRequestsModalData($conferenceId: uuid!, $itemIds: [uuid!]!) {
        conference_Configuration(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ConfigureEmailTemplates_ConferenceConfiguration
        }
        content_Item(where: { id: { _in: $itemIds } }) {
            ...SubmissionRequestsModal_Item
        }
    }

    fragment SubmissionRequestsModal_ConferenceConfiguration on conference_Configuration {
        conferenceId
        key
        value
    }

    fragment SubmissionRequestsModal_Item on content_Item {
        id
        title
        typeName
        hasUnsubmittedElements
        itemPeople {
            id
            itemId
            personId
            roleName
            hasSubmissionRequestBeenSent
        }
    }
`;

export function SendSubmissionRequestsModal({
    isOpen,
    onClose,
    itemIds,
    personIds,
}: {
    isOpen: boolean;
    onClose: () => void;
    itemIds: string[];
    personIds: string[] | null;
}): JSX.Element {
    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            {isOpen ? (
                <SendSubmissionRequestsModalLazyInner onClose={onClose} itemIds={itemIds} personIds={personIds} />
            ) : undefined}
        </Modal>
    );
}

function SendSubmissionRequestsModalLazyInner({
    onClose,
    itemIds,
    personIds,
}: {
    onClose: () => void;
    itemIds: string[];
    personIds: string[] | null;
}): JSX.Element {
    const conference = useConference();
    const context = useMemo(
        () =>
            makeContext({
                "X-Auth-Role": "organizer",
            }),
        []
    );
    const [result] = useSubmissionRequestsModalDataQuery({
        variables: {
            conferenceId: conference.id,
            itemIds,
        },
        requestPolicy: "network-only",
        context,
    });
    return (
        <QueryWrapper queryResult={result} getter={(result) => result}>
            {({
                conference_Configuration,
                content_Item,
            }: {
                conference_Configuration: readonly SubmissionRequestsModal_ConferenceConfigurationFragment[];
                content_Item: readonly SubmissionRequestsModal_ItemFragment[];
            }) => {
                const conferenceConfiguration =
                    conference_Configuration.find(
                        (c) => c.key === Conference_ConfigurationKey_Enum.EmailTemplateSubmissionRequest
                    ) ?? null;

                let existingTemplate: EmailTemplate_BaseConfig = {
                    htmlBodyTemplate: null,
                    subjectTemplate: null,
                };
                if (conferenceConfiguration?.value && isEmailTemplate_BaseConfig(conferenceConfiguration.value)) {
                    existingTemplate = conferenceConfiguration.value as unknown as EmailTemplate_BaseConfig;
                }

                return (
                    <SendSubmissionRequestsModalInner
                        onClose={onClose}
                        items={content_Item}
                        existingTemplate={existingTemplate}
                        personIds={personIds}
                    />
                );
            }}
        </QueryWrapper>
    );
}

export const roleOptions: readonly { label: string; value: string }[] = [
    {
        label: "Presenter",
        value: "PRESENTER",
    },
    {
        label: "Author",
        value: "AUTHOR",
    },
    {
        label: "Chair",
        value: "CHAIR",
    },
    {
        label: "Session Organizer",
        value: "SESSION ORGANIZER",
    },
    {
        label: "Discussant",
        value: "DISCUSSANT",
    },
    {
        label: "Reviewer",
        value: "REVIEWER",
    },
];

export function SendSubmissionRequestsModalInner({
    onClose,
    items,
    existingTemplate,
    personIds: filterToPersonIds,
}: {
    onClose: () => void;
    items: readonly SubmissionRequestsModal_ItemFragment[];
    existingTemplate: EmailTemplate_BaseConfig;
    personIds: string[] | null;
}): JSX.Element {
    const types = useMemo(() => Object.values(Content_ItemType_Enum), []);
    const [selectedType, setSelectedType] = useState<string>();
    const [onlyUnsubmitted, setOnlyUnsubmitted] = useState<boolean>(true);
    const [onlyFirsts, setOnlyFirsts] = useState<boolean>(false);
    const [roles, setRoles] = useState<
        readonly {
            label: string;
            value: string;
        }[]
    >([
        { label: "Author", value: "AUTHOR" },
        { label: "Presenter", value: "PRESENTER" },
        { label: "Discussant", value: "DISCUSSANT" },
    ]);
    const { itemEls, personIds } = useMemo(() => {
        const itemEls: JSX.Element[] = [];
        const personIds = new Set<string>();

        for (const item of items) {
            const includedPeople =
                filterToPersonIds === null
                    ? item.itemPeople
                    : item.itemPeople.filter((x) => filterToPersonIds.includes(x.personId));
            const filteredPeople = (
                onlyFirsts ? includedPeople.filter((x) => !x.hasSubmissionRequestBeenSent) : includedPeople
            ).filter((x) => roles.some((role) => role.value === x.roleName.toUpperCase()));
            if (
                (!selectedType || item.typeName === selectedType) &&
                (!onlyUnsubmitted || item.hasUnsubmittedElements) &&
                filteredPeople.length > 0
            ) {
                itemEls.push(
                    <ListItem key={item.id}>
                        <HStack>
                            <FAIcon icon="file" iconStyle="r" mr={2} />
                            <VStack alignItems="flex-start" spacing={0}>
                                <Text fontWeight="bold" fontSize="sm">
                                    {item.title}
                                </Text>
                                <Text fontSize="sm">
                                    {filteredPeople.length}
                                    {filteredPeople.length > 1 ? " people" : " person"}
                                </Text>
                            </VStack>
                        </HStack>
                    </ListItem>
                );

                filteredPeople.forEach((itemPerson) => personIds.add(itemPerson.personId));
            }
        }

        return { itemEls, personIds: [...personIds] };
    }, [items, filterToPersonIds, onlyFirsts, selectedType, onlyUnsubmitted, roles]);

    const itemsEl = useMemo(
        () => (
            <Box mt={4}>
                {itemEls.length === 0 ? (
                    <Text>No matching items.</Text>
                ) : (
                    <List spacing={2} maxH="40vh" overflowY="auto">
                        {itemEls}
                    </List>
                )}
            </Box>
        ),
        [itemEls]
    );

    const toast = useToast();

    const [, sendSubmissionRequests] = useInsertSubmissionRequestEmailJobsMutation();

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
                        const result = await sendSubmissionRequests(
                            {
                                objs: personIds.map((id) => ({
                                    personId: id,
                                    emailTemplate: {
                                        htmlBodyTemplate: values.htmlBodyTemplate,
                                        subjectTemplate: values.subjectTemplate,
                                    },
                                })),
                            },
                            {
                                fetchOptions: {
                                    headers: {
                                        "X-Auth-Role": "organizer",
                                    },
                                },
                            }
                        );
                        if (result?.error) {
                            console.error("Failed to insert SubmissionRequestEmailJob", result.error);
                            throw new Error("Error submitting query");
                        }
                        actions.resetForm();
                        onClose();
                        toast({
                            title: "Requests on their way",
                            duration: 3000,
                            isClosable: true,
                            status: "success",
                        });
                    } catch (e: any) {
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
                            <FormControl mb={4}>
                                <FormLabel>Unsubmitted only?</FormLabel>
                                <HStack>
                                    <chakra.span>No</chakra.span>
                                    <Switch
                                        isChecked={onlyUnsubmitted}
                                        onChange={(ev) => setOnlyUnsubmitted(ev.target.checked)}
                                    />
                                    <chakra.span>Yes</chakra.span>
                                </HStack>
                                <FormHelperText>
                                    Send emails only for items which have unsubmitted elements.
                                </FormHelperText>
                            </FormControl>
                            <FormControl>
                                <FormLabel>First requests only?</FormLabel>
                                <HStack>
                                    <chakra.span>No</chakra.span>
                                    <Switch
                                        isChecked={onlyFirsts}
                                        onChange={(ev) => setOnlyFirsts(ev.target.checked)}
                                    />
                                    <chakra.span>Yes</chakra.span>
                                </HStack>
                                <FormHelperText>
                                    Send emails only to people who have not already received one.
                                </FormHelperText>
                            </FormControl>
                            <FormControl>
                                <FormLabel>Roles</FormLabel>
                                <MultiSelect
                                    placeholder="Only email people with roles"
                                    options={roleOptions}
                                    value={roles}
                                    isMulti
                                    onChange={(options) => setRoles(options)}
                                />
                                <FormHelperText>Leave unselected to include all items.</FormHelperText>
                            </FormControl>
                            <Divider my={5} />
                            <FormControl>
                                <FormLabel>Item Label</FormLabel>
                                <Select
                                    placeholder="Choose items with label"
                                    onChange={(event) => setSelectedType(event.target.value)}
                                >
                                    {types.map((type) => (
                                        <option key={type} value={type}>
                                            {generateItemTypeFriendlyName(type)}
                                        </option>
                                    ))}
                                </Select>
                                <FormHelperText>Leave unselected to include all items.</FormHelperText>
                            </FormControl>
                            {itemsEl}
                            <Divider my={5} />
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
                                isDisabled={!isValid || personIds.length === 0}
                                mt={4}
                                colorScheme="purple"
                            >
                                Send {personIds.length} emails ({itemEls.length} items)
                            </Button>
                        </ModalFooter>
                    </Form>
                )}
            </Formik>
        </ModalContent>
    );
}
