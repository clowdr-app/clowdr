import { assertType, is } from "typescript-is";

export interface EmailTemplate_BaseConfig {
    subjectTemplate: string | null;
    htmlBodyTemplate: string | null;
}

export enum Conference_ConfigurationKey_Enum {
    /** A list of videos to be used as the background for title/sponsor slides. */
    BackgroundVideos = "BACKGROUND_VIDEOS",
    /** A string representing the app version. Changing this causes the user's browsers to refresh. */
    ClowdrAppVersion = "CLOWDR_APP_VERSION",
    EmailTemplateSubmissionRequest = "EMAIL_TEMPLATE_SUBMISSION_REQUEST",
    EmailTemplateSubtitlesGenerated = "EMAIL_TEMPLATE_SUBTITLES_GENERATED",
    /** List of S3 URLs. */
    FillerVideos = "FILLER_VIDEOS",
    /** A string representing the full frontend host URL for the conference. If not provided, this defaults to the system configuration. */
    FrontendHost = "FRONTEND_HOST",
    /** An image to be displayed if AWS MediaLive loses input. */
    InputLossSlate = "INPUT_LOSS_SLATE",
    /** A string representing a valid URL for users to register for the conference. */
    RegistrationUrl = "REGISTRATION_URL",
    /** A string representing a valid email address for contacting the conference organisers. */
    SupportAddress = "SUPPORT_ADDRESS",
    /** A string representing a valid email address for contacting the service hosting company for technical support related to the conference. */
    TechSupportAddress = "TECH_SUPPORT_ADDRESS",
    /** Text of the upload agreement or a URL to one. */
    UploadAgreement = "UPLOAD_AGREEMENT",
    /** The time in milliseconds since the UNIX epoch, as a string. */
    UploadCutoffTimestamp = "UPLOAD_CUTOFF_TIMESTAMP",
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isEmailTemplate_BaseConfig(data: any): boolean {
    return is<EmailTemplate_BaseConfig>(data);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function assertIsEmailTemplate_BaseConfig(data: any): asserts data is EmailTemplate_BaseConfig {
    assertType<EmailTemplate_BaseConfig>(data);
}
