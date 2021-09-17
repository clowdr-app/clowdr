import { EmailTemplate_BaseConfig } from "./conferenceConfiguration";

export type EmailTemplate_Defaults = {
    [K in keyof EmailTemplate_BaseConfig]: NonNullable<EmailTemplate_BaseConfig[K]>;
};

/**
 * The default template for the subtitles generated email.
 */
export const EMAIL_TEMPLATE_SUBTITLES_GENERATED: EmailTemplate_Defaults = {
    htmlBodyTemplate: `<p>Dear {{{person.name}}},</p>
<p>We have automatically generated subtitles for your content <em>{{{file.name}}}</em> ({{{item.title}}}) at {{{conference.name}}}.</p>
<p>Automated subtitles aren't always accurate, so you can <a href="{{{uploadLink}}}">review and edit them here</a>.</p>
<p>Thank you,<br/>
The Midspace team
</p>`,
    subjectTemplate: "{{{conference.shortName}}}: Subtitles generated for your {{{file.name}}} ({{{item.title}}})",
};

/**
 * The view available when rendering the subtitles generated email. Default template is {@link EMAIL_TEMPLATE_SUBTITLES_GENERATED}.
 */
export interface EmailView_SubtitlesGenerated {
    uploader: {
        name: string;
    };
    file: {
        name: string;
    };
    item: {
        title: string;
    };
    conference: {
        name: string;
        shortName: string;
    };
    uploadLink: string;
}

/**
 * The default template for the submission request email.
 */
export const EMAIL_TEMPLATE_SUBMISSION_REQUEST: EmailTemplate_Defaults = {
    htmlBodyTemplate: `<p>Dear {{{person.name}}},</p>
<p>
    The organisers of {{{conference.name}}} are requesting that you or
    your co-authors/co-presenters submit your content to Midspace.
</p>
<p>
    Please do not forward or share this email: anyone with the link contained
    herein can use it to modify your submissions.
</p>
<p>
    Please <a href="{{{uploadLink}}}">submit your content on this page</a> by 23:59 UTC on DD MMMM.
</p>
<p>
    Please <a href="https://resources.midspace.app/video-subtitles/uploading-videos/">watch this 6 minute instructional video</a> to learn how to use Midspace's content upload system. This video also shows how to edit subtitles.
</p>
<p>
    Please do not leave submitting to the last moment - this can be risky! If we are unable to automatically process your upload, it may not be possible to prepare it in time for the conference.
</p>
<p>
    <li>If you are uploading a video, Midspace will process it and auto-generate subtitles. You can then edit these subtitles.</li>
</p>
<p>We hope you enjoy your conference,<br/>
The Midspace team
</p>`,
    subjectTemplate: "Submissions for {{{conference.shortName}}}",
};

/**
 * The view available when rendering the submission request email. Default template is {@link EMAIL_TEMPLATE_SUBMISSION_REQUEST}.
 */
export interface EmailView_SubmissionRequest {
    person?: {
        name: string;
    };
    uploader?: {
        name: string;
    };
    file?: {
        name: string;
        typeName: string;
    };
    item?: {
        title: string;
    };
    conference: {
        name: string;
        shortName: string;
    };
    uploadLink: string;
}
