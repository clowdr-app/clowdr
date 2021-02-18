import { gql, Reference } from "@apollo/client";
import {
    Accordion,
    AccordionButton,
    AccordionIcon,
    AccordionItem,
    AccordionPanel,
    Box,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Spinner,
    Textarea,
} from "@chakra-ui/react";
import {
    ConferenceConfigurationKey,
    EmailTemplate_BaseConfig,
    isEmailTemplate_BaseConfig,
} from "@clowdr-app/shared-types/build/conferenceConfiguration";
import { EMAIL_TEMPLATE_SUBTITLES_GENERATED } from "@clowdr-app/shared-types/build/email";
import React, { useEffect, useMemo, useState } from "react";
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
    const conferenceConfiguration = useMemo<ConfigureEmailTemplates_ConferenceConfigurationFragment | null>(
        () =>
            conferenceConfigurations.find(
                (c) => c.key === ConferenceConfigurationKey.EmailTemplate_SubtitlesGenerated
            ) ?? null,
        [conferenceConfigurations]
    );

    const emailTemplateConfig_SubtitlesGenerated = useMemo<EmailTemplate_BaseConfig | null>(() => {
        if (!conferenceConfiguration || !isEmailTemplate_BaseConfig(conferenceConfiguration.value)) {
            return null;
        }
        return (conferenceConfiguration.value as unknown) as EmailTemplate_BaseConfig;
    }, [conferenceConfiguration]);

    const [
        updateConferenceConfiguration,
        updateConferenceConfigurationResponse,
    ] = useConfigureEmailTemplates_UpdateConferenceConfigurationMutation();

    return (
        <>
            {updateConferenceConfigurationResponse.loading ? <Spinner /> : undefined}
            <Accordion minW="50vw" allowToggle allowMultiple>
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
                            update={(newValue) => {
                                updateConferenceConfiguration({
                                    variables: {
                                        conferenceId: conference.id,
                                        key: ConferenceConfigurationKey.EmailTemplate_SubtitlesGenerated,
                                        value: newValue,
                                    },
                                    update: (cache, { data: _data }) => {
                                        if (_data?.insert_ConferenceConfiguration_one) {
                                            const data = _data.insert_ConferenceConfiguration_one;
                                            const item: ConfigureEmailTemplates_ConferenceConfigurationFragment = {
                                                id: data.id,
                                                conferenceId: conference.id,
                                                key: ConferenceConfigurationKey.EmailTemplate_SubtitlesGenerated,
                                                __typename: "ConferenceConfiguration",
                                                value: newValue,
                                            };
                                            cache.modify({
                                                fields: {
                                                    ConferenceConfiguration(
                                                        existingRefs: Reference[] = [],
                                                        { readField }
                                                    ) {
                                                        const newRef = cache.writeFragment({
                                                            data: item,
                                                            fragment: ConfigureEmailTemplates_ConferenceConfigurationFragmentDoc,
                                                            fragmentName:
                                                                "ConfigureEmailTemplates_ConferenceConfiguration",
                                                        });
                                                        if (
                                                            existingRefs.some((ref) => readField("id", ref) === data.id)
                                                        ) {
                                                            return existingRefs;
                                                        }
                                                        return [...existingRefs, newRef];
                                                    },
                                                },
                                            });
                                        }
                                    },
                                });
                            }}
                        />
                    </AccordionPanel>
                </AccordionItem>
            </Accordion>
        </>
    );
}

function EmailTemplateForm({
    templateConfig,
    update,
}: {
    templateConfig: EmailTemplate_BaseConfig | null;
    update: (_templateConfig: EmailTemplate_BaseConfig) => void;
}) {
    const [subjectTemplate, setSubjectTemplate] = useState<string | null>(null);
    const [htmlBodyTemplate, setHtmlBodyTemplate] = useState<string | null>(null);

    const subjectTemplateValue = useMemo(
        () => subjectTemplate ?? templateConfig?.subjectTemplate ?? EMAIL_TEMPLATE_SUBTITLES_GENERATED.subjectTemplate,
        [subjectTemplate, templateConfig?.subjectTemplate]
    );
    const htmlBodyTemplateValue = useMemo(
        () =>
            htmlBodyTemplate ?? templateConfig?.htmlBodyTemplate ?? EMAIL_TEMPLATE_SUBTITLES_GENERATED.htmlBodyTemplate,
        [htmlBodyTemplate, templateConfig?.htmlBodyTemplate]
    );

    useEffect(() => {
        setSubjectTemplate(null);
    }, [templateConfig?.subjectTemplate]);

    useEffect(() => {
        setHtmlBodyTemplate(null);
    }, [templateConfig?.htmlBodyTemplate]);

    return (
        <>
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
