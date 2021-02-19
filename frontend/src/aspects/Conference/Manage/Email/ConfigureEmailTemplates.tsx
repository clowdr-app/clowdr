import { gql } from "@apollo/client";
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
} from "@chakra-ui/react";
import {
    ConferenceConfigurationKey,
    EmailTemplate_BaseConfig,
    isEmailTemplate_BaseConfig,
} from "@clowdr-app/shared-types/build/conferenceConfiguration";
import {
    EmailTemplate_Defaults,
    EMAIL_TEMPLATE_SUBMISSION_REQUEST,
    EMAIL_TEMPLATE_SUBTITLES_GENERATED,
} from "@clowdr-app/shared-types/build/email";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ConfigureEmailTemplates_ConferenceConfigurationFragment,
    ConfigureEmailTemplates_ConferenceConfigurationFragmentDoc,
    useConfigureEmailTemplates_GetConferenceConfigurationsQuery,
    useConfigureEmailTemplates_UpdateConferenceConfigurationMutation,
} from "../../../../generated/graphql";
import ApolloQueryWrapper from "../../../GQL/ApolloQueryWrapper";
import { useConference } from "../../useConference";

gql`
    query ConfigureEmailTemplates_GetConferenceConfigurations($conferenceId: uuid!) {
        ConferenceConfiguration(where: { conferenceId: { _eq: $conferenceId } }) {
            ...ConfigureEmailTemplates_ConferenceConfiguration
        }
    }

    fragment ConfigureEmailTemplates_ConferenceConfiguration on ConferenceConfiguration {
        id
        conferenceId
        key
        value
    }

    mutation ConfigureEmailTemplates_UpdateConferenceConfiguration(
        $value: jsonb!
        $conferenceId: uuid!
        $key: String!
    ) {
        insert_ConferenceConfiguration_one(
            object: { value: $value, conferenceId: $conferenceId, key: $key }
            on_conflict: { constraint: ConferenceConfiguration_conferenceId_key_key, update_columns: value }
        ) {
            id
        }
    }
`;

export function ConfigureEmailTemplates(): JSX.Element {
    const conference = useConference();

    const conferenceConfigurationResult = useConfigureEmailTemplates_GetConferenceConfigurationsQuery({
        variables: {
            conferenceId: conference.id,
        },
    });

    return (
        <ApolloQueryWrapper
            getter={(result) => result.ConferenceConfiguration}
            queryResult={conferenceConfigurationResult}
        >
            {(conferenceConfigurations: readonly ConfigureEmailTemplates_ConferenceConfigurationFragment[]) => (
                <ConfigureEmailTemplatesInner conferenceConfigurations={conferenceConfigurations} />
            )}
        </ApolloQueryWrapper>
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
                (c) => c.key === ConferenceConfigurationKey.EmailTemplate_SubtitlesGenerated
            ) ?? null;
        if (!conferenceConfiguration || !isEmailTemplate_BaseConfig(conferenceConfiguration.value)) {
            return null;
        }
        return (conferenceConfiguration.value as unknown) as EmailTemplate_BaseConfig;
    }, [conferenceConfigurations]);

    const emailTemplateConfig_SubmissionRequest = useMemo<EmailTemplate_BaseConfig | null>(() => {
        const conferenceConfiguration =
            conferenceConfigurations.find(
                (c) => c.key === ConferenceConfigurationKey.EmailTemplate_SubmissionRequest
            ) ?? null;
        if (!conferenceConfiguration || !isEmailTemplate_BaseConfig(conferenceConfiguration.value)) {
            return null;
        }
        return (conferenceConfiguration.value as unknown) as EmailTemplate_BaseConfig;
    }, [conferenceConfigurations]);

    const [
        updateConferenceConfiguration,
        updateConferenceConfigurationResponse,
    ] = useConfigureEmailTemplates_UpdateConferenceConfigurationMutation();

    const update = useCallback(
        (key: string) => (newValue: EmailTemplate_BaseConfig) => {
            updateConferenceConfiguration({
                variables: {
                    conferenceId: conference.id,
                    key,
                    value: newValue,
                },
                update: (cache, { data: _data }) => {
                    if (_data?.insert_ConferenceConfiguration_one) {
                        const data = _data.insert_ConferenceConfiguration_one;
                        const item: ConfigureEmailTemplates_ConferenceConfigurationFragment = {
                            id: data.id,
                            conferenceId: conference.id,
                            key,
                            __typename: "ConferenceConfiguration",
                            value: newValue,
                        };
                        cache.writeFragment({
                            data: item,
                            fragment: ConfigureEmailTemplates_ConferenceConfigurationFragmentDoc,
                            fragmentName: "ConfigureEmailTemplates_ConferenceConfiguration",
                        });
                    }
                },
            });
        },
        [conference.id, updateConferenceConfiguration]
    );

    return (
        <>
            {updateConferenceConfigurationResponse.loading ? <Spinner /> : undefined}
            <Accordion minW="50vw" allowToggle allowMultiple>
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="sm">
                                Submission request email
                            </Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                        <EmailTemplateForm
                            templateConfig={emailTemplateConfig_SubmissionRequest}
                            templateDefaults={EMAIL_TEMPLATE_SUBMISSION_REQUEST}
                            update={update(ConferenceConfigurationKey.EmailTemplate_SubmissionRequest)}
                        />
                    </AccordionPanel>
                </AccordionItem>
                <AccordionItem>
                    <AccordionButton>
                        <Box flex="1" textAlign="left">
                            <Heading as="h3" size="sm">
                                Subtitles notification email
                            </Heading>
                        </Box>
                        <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel>
                        <EmailTemplateForm
                            templateConfig={emailTemplateConfig_SubtitlesGenerated}
                            templateDefaults={EMAIL_TEMPLATE_SUBTITLES_GENERATED}
                            update={update(ConferenceConfigurationKey.EmailTemplate_SubtitlesGenerated)}
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
}: {
    templateConfig: EmailTemplate_BaseConfig | null;
    templateDefaults: EmailTemplate_Defaults;
    update: (_templateConfig: EmailTemplate_BaseConfig) => void;
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
        <>
            <HStack justifyContent="space-between" alignItems="center" my={4}>
                <Text>
                    This email is sent to uploaders automatically once subtitles have been generated for one of their
                    items.
                </Text>
                {templateConfig?.htmlBodyTemplate || templateConfig?.subjectTemplate ? (
                    <Button
                        size="sm"
                        aria-label="Reset email text and subject line to defaults"
                        onClick={() => update({ subjectTemplate: null, htmlBodyTemplate: null })}
                    >
                        Reset to default
                    </Button>
                ) : undefined}
            </HStack>
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
        </>
    );
}
