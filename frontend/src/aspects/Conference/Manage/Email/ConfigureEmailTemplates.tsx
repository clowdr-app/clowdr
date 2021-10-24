import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    Button,
    FormControl,
    FormLabel,
    Heading,
    HStack,
    Input,
    Spinner,
    Text,
    Textarea,
    VStack,
} from "@chakra-ui/react";
import type { EmailTemplate_BaseConfig } from "@clowdr-app/shared-types/build/conferenceConfiguration";
import { isEmailTemplate_BaseConfig } from "@clowdr-app/shared-types/build/conferenceConfiguration";
import type { EmailTemplate_Defaults } from "@clowdr-app/shared-types/build/email";
import {
    EMAIL_TEMPLATE_SUBMISSION_REQUEST,
    EMAIL_TEMPLATE_SUBTITLES_GENERATED,
} from "@clowdr-app/shared-types/build/email";
import { gql } from "@urql/core";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ConfigureEmailTemplates_ConferenceConfigurationFragment } from "../../../../generated/graphql";
import {
    Conference_ConfigurationKey_Enum,
    useConfigureEmailTemplates_GetConferenceConfigurationsQuery,
    useConfigureEmailTemplates_UpdateConferenceConfigurationMutation,
} from "../../../../generated/graphql";
import QueryWrapper from "../../../GQL/QueryWrapper";
import { useConference } from "../../useConference";

gql`
    query ConfigureEmailTemplates_GetConferenceConfigurations($conferenceId: uuid!) {
        conference_Configuration(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ConfigureEmailTemplates_ConferenceConfiguration
        }
    }

    fragment ConfigureEmailTemplates_ConferenceConfiguration on conference_Configuration {
        conferenceId
        key
        value
    }

    mutation ConfigureEmailTemplates_UpdateConferenceConfiguration(
        $value: jsonb!
        $conferenceId: uuid!
        $key: conference_ConfigurationKey_enum!
    ) {
        insert_conference_Configuration_one(
            object: { value: $value, conferenceId: $conferenceId, key: $key }
            on_conflict: { constraint: Configuration_pkey, update_columns: value }
        ) {
            conferenceId
            key
            value
        }
    }
`;

export function ConfigureEmailTemplates(): JSX.Element {
    const conference = useConference();

    const [conferenceConfigurationResult] = useConfigureEmailTemplates_GetConferenceConfigurationsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    return (
        <QueryWrapper getter={(result) => result.conference_Configuration} queryResult={conferenceConfigurationResult}>
            {(conferenceConfigurations: readonly ConfigureEmailTemplates_ConferenceConfigurationFragment[]) => (
                <ConfigureEmailTemplatesInner conferenceConfigurations={conferenceConfigurations} />
            )}
        </QueryWrapper>
    );
}

export function ConfigureEmailTemplatesInner({
    conferenceConfigurations,
}: {
    conferenceConfigurations: readonly ConfigureEmailTemplates_ConferenceConfigurationFragment[];
}): JSX.Element {
    const conference = useConference();

    const emailTemplateConfig_SubtitlesGenerated = useMemo<EmailTemplate_BaseConfig | null>(() => {
        const conferenceConfiguration =
            conferenceConfigurations.find(
                (c) => c.key === Conference_ConfigurationKey_Enum.EmailTemplateSubtitlesGenerated
            ) ?? null;
        if (!conferenceConfiguration || !isEmailTemplate_BaseConfig(conferenceConfiguration.value)) {
            return null;
        }
        return conferenceConfiguration.value as unknown as EmailTemplate_BaseConfig;
    }, [conferenceConfigurations]);

    const emailTemplateConfig_SubmissionRequest = useMemo<EmailTemplate_BaseConfig | null>(() => {
        const conferenceConfiguration =
            conferenceConfigurations.find(
                (c) => c.key === Conference_ConfigurationKey_Enum.EmailTemplateSubmissionRequest
            ) ?? null;
        if (!conferenceConfiguration || !isEmailTemplate_BaseConfig(conferenceConfiguration.value)) {
            return null;
        }
        return conferenceConfiguration.value as unknown as EmailTemplate_BaseConfig;
    }, [conferenceConfigurations]);

    const [updateConferenceConfigurationResponse, updateConferenceConfiguration] =
        useConfigureEmailTemplates_UpdateConferenceConfigurationMutation();

    const update = useCallback(
        (key: Conference_ConfigurationKey_Enum) => (newValue: EmailTemplate_BaseConfig) => {
            updateConferenceConfiguration(
                {
                    conferenceId: conference.id,
                    key,
                    value: newValue,
                },
                {
                    fetchOptions: {
                        headers: {
                            "X-Auth-Role": "main-conference-organizer",
                        },
                    },
                }
            );
        },
        [conference.id, updateConferenceConfiguration]
    );

    return (
        <>
            <Box minH="3ex" py={4}>
                {updateConferenceConfigurationResponse.fetching ? (
                    <HStack spacing={2}>
                        <Text>Saving</Text> <Spinner />
                    </HStack>
                ) : updateConferenceConfigurationResponse.data ? (
                    updateConferenceConfigurationResponse.error ? (
                        <Text>Error saving changes.</Text>
                    ) : (
                        <Text>Changes saved.</Text>
                    )
                ) : undefined}
            </Box>
            <Accordion w="100%" allowToggle allowMultiple reduceMotion>
                <AccordionItem>
                    <AccordionButton>
                        <AccordionIcon mr={2} />
                        <Heading as="h3" size="sm" textAlign="left" fontWeight="normal">
                            Submission request email
                        </Heading>
                    </AccordionButton>
                    <AccordionPanel>
                        <EmailTemplateForm
                            templateConfig={emailTemplateConfig_SubmissionRequest}
                            templateDefaults={EMAIL_TEMPLATE_SUBMISSION_REQUEST}
                            update={update(Conference_ConfigurationKey_Enum.EmailTemplateSubmissionRequest)}
                            description="This email is sent to people when requesting submissions. You can also customise this email before each time you send out requests."
                        />
                    </AccordionPanel>
                </AccordionItem>
                <AccordionItem>
                    <AccordionButton>
                        <AccordionIcon mr={2} />
                        <Heading as="h3" size="sm" textAlign="left" fontWeight="normal">
                            Subtitles notification email
                        </Heading>
                    </AccordionButton>
                    <AccordionPanel>
                        <EmailTemplateForm
                            templateConfig={emailTemplateConfig_SubtitlesGenerated}
                            templateDefaults={EMAIL_TEMPLATE_SUBTITLES_GENERATED}
                            update={update(Conference_ConfigurationKey_Enum.EmailTemplateSubtitlesGenerated)}
                            description="This email is sent to people automatically when subtitles have been generated for one of their items."
                        />
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        </>
    );
}

function EmailTemplateForm({
    templateConfig,
    templateDefaults,
    update,
    description,
}: {
    templateConfig: EmailTemplate_BaseConfig | null;
    templateDefaults: EmailTemplate_Defaults;
    update: (_templateConfig: EmailTemplate_BaseConfig) => void;
    description: string;
}) {
    const [subjectTemplate, setSubjectTemplate] = useState<string | null>(null);
    const [htmlBodyTemplate, setHtmlBodyTemplate] = useState<string | null>(null);

    const subjectTemplateValue = useMemo(
        () => subjectTemplate ?? templateConfig?.subjectTemplate ?? templateDefaults.subjectTemplate,
        [subjectTemplate, templateConfig?.subjectTemplate, templateDefaults.subjectTemplate]
    );
    const htmlBodyTemplateValue = useMemo(
        () => htmlBodyTemplate ?? templateConfig?.htmlBodyTemplate ?? templateDefaults.htmlBodyTemplate,
        [htmlBodyTemplate, templateConfig?.htmlBodyTemplate, templateDefaults.htmlBodyTemplate]
    );

    useEffect(() => {
        setSubjectTemplate(null);
    }, [templateConfig?.subjectTemplate]);

    useEffect(() => {
        setHtmlBodyTemplate(null);
    }, [templateConfig?.htmlBodyTemplate]);

    return (
        <VStack spacing={4} alignItems="flex-start">
            <Text>{description}</Text>
            {templateDefaults?.htmlBodyTemplate || templateDefaults?.subjectTemplate ? (
                <Button
                    colorScheme="purple"
                    size="sm"
                    aria-label="Reset email text and subject line to defaults"
                    onClick={() => update({ subjectTemplate: null, htmlBodyTemplate: null })}
                    isDisabled={
                        templateDefaults.htmlBodyTemplate === htmlBodyTemplateValue &&
                        templateDefaults.subjectTemplate === subjectTemplateValue
                    }
                >
                    Reset to default
                </Button>
            ) : undefined}
            <FormControl>
                <FormLabel>Subject</FormLabel>
                <Input
                    value={subjectTemplateValue}
                    onChange={(event) => setSubjectTemplate(event.target.value)}
                    onBlur={() => {
                        if (subjectTemplate && subjectTemplateValue !== templateConfig?.subjectTemplate) {
                            update({
                                subjectTemplate: subjectTemplateValue,
                                htmlBodyTemplate: htmlBodyTemplateValue,
                            });
                        }
                    }}
                />
            </FormControl>
            <FormControl mt={4}>
                <FormLabel>Body</FormLabel>
                <Textarea
                    fontFamily="monospace"
                    lineHeight="lg"
                    minH="md"
                    value={htmlBodyTemplateValue}
                    onChange={(event) => setHtmlBodyTemplate(event.target.value)}
                    onBlur={() => {
                        if (htmlBodyTemplate && htmlBodyTemplateValue !== templateConfig?.htmlBodyTemplate) {
                            update({
                                subjectTemplate: subjectTemplateValue,
                                htmlBodyTemplate: htmlBodyTemplateValue,
                            });
                        }
                    }}
                />
            </FormControl>
        </VStack>
    );
}
