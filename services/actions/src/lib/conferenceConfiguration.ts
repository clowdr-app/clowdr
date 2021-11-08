import { gql } from "@apollo/client/core";
import { EmailTemplate_BaseConfig } from "@clowdr-app/shared-types/build/conferenceConfiguration";
import { EMAIL_TEMPLATE_SUBTITLES_GENERATED } from "@clowdr-app/shared-types/build/email";
import { is } from "typescript-is";
import {
    Conference_ConfigurationKey_Enum,
    Configuration_EmailTemplateSubtitlesGeneratedFragment,
    Configuration_RecordingEmailNotificationsEnabledFragment,
    Configuration_SubmissionNotificationRolesFragment,
    GetConfigurationValueDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";

gql`
    query GetConfigurationValue($key: conference_ConfigurationKey_enum!, $conferenceId: uuid!) {
        conference_Configuration_by_pk(conferenceId: $conferenceId, key: $key) {
            key
            value
        }
    }
`;

export async function getConferenceConfiguration<T = any>(
    conferenceId: string,
    key: Conference_ConfigurationKey_Enum
): Promise<any | null> {
    const result = await apolloClient.query({
        query: GetConfigurationValueDocument,
        variables: {
            conferenceId,
            key,
        },
    });

    if (
        result.data?.conference_Configuration_by_pk?.value !== undefined &&
        result.data?.conference_Configuration_by_pk?.value !== null &&
        is<T>(result.data.conference_Configuration_by_pk.value)
    ) {
        return result.data.conference_Configuration_by_pk.value;
    } else {
        return null;
    }
}

gql`
    fragment Configuration_RecordingEmailNotificationsEnabled on conference_Conference {
        recordingNotificationsEnabled: configurations(
            where: { key: { _eq: ENABLE_RECORDING_SUBTITLE_EMAIL_NOTIFICATIONS } }
        ) {
            value
        }
    }
`;

export function getRecordingEmailNotificationsEnabled(
    rawConfiguration: Configuration_RecordingEmailNotificationsEnabledFragment
): boolean {
    const defaultValue = true;
    if (is<boolean>(rawConfiguration.recordingNotificationsEnabled?.[0]?.value)) {
        return Boolean(rawConfiguration.recordingNotificationsEnabled[0].value);
    }
    return defaultValue;
}

gql`
    fragment Configuration_SubmissionNotificationRoles on conference_Conference {
        submissionNotificationRoles: configurations(where: { key: { _eq: SUBMISSION_NOTIFICATION_ROLES } }) {
            value
        }
    }
`;

export function getSubmissionNotificationRoles(
    rawConfiguration: Configuration_SubmissionNotificationRolesFragment
): string[] {
    const defaultValue = ["PRESENTER", "AUTHOR"];
    if (is<string[]>(rawConfiguration.submissionNotificationRoles?.[0]?.value)) {
        return rawConfiguration.submissionNotificationRoles[0].value;
    }
    return defaultValue;
}

gql`
    fragment Configuration_EmailTemplateSubtitlesGenerated on conference_Conference {
        emailTemplateSubtitlesGenerated: configurations(where: { key: { _eq: EMAIL_TEMPLATE_SUBTITLES_GENERATED } }) {
            value
        }
    }
`;

export function getEmailTemplatesSubtitlesGenerated(
    rawConfiguration: Configuration_EmailTemplateSubtitlesGeneratedFragment
): EmailTemplate_BaseConfig {
    const defaultValue: EmailTemplate_BaseConfig = {
        htmlBodyTemplate: EMAIL_TEMPLATE_SUBTITLES_GENERATED.htmlBodyTemplate,
        subjectTemplate: EMAIL_TEMPLATE_SUBTITLES_GENERATED.subjectTemplate,
    };
    const value = rawConfiguration.emailTemplateSubtitlesGenerated?.[0]?.value;
    if (is<EmailTemplate_BaseConfig>(value)) {
        return {
            htmlBodyTemplate: value.htmlBodyTemplate ?? defaultValue.htmlBodyTemplate,
            subjectTemplate: value.subjectTemplate ?? defaultValue.subjectTemplate,
        };
    }
    return defaultValue;
}
