import { assertType, is } from "typescript-is";

export interface EmailTemplate_BaseConfig {
    subjectTemplate: string | null;
    htmlBodyTemplate: string | null;
}

export enum ConferenceConfigurationKey {
    EmailTemplate_SubtitlesGenerated = "EMAIL_TEMPLATE_SUBTITLES_GENERATED",
    EmailTemplate_SubmissionRequest = "EMAIL_TEMPLATE_SUBMISSION_REQUEST",
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isEmailTemplate_BaseConfig(data: any): boolean {
    return is<EmailTemplate_BaseConfig>(data);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function assertIsEmailTemplate_BaseConfig(data: any): asserts data is EmailTemplate_BaseConfig {
    assertType<EmailTemplate_BaseConfig>(data);
}
