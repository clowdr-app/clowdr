/**
 * The default template for the subtitles generated email.
 */
export const EMAIL_TEMPLATE_SUBTITLES_GENERATED = {
    htmlBodyTemplate: `<p>Dear {{uploader.name}},</p>
<p>We have automatically generated subtitles for your item <em>{{file.name}}</em> ({{item.title}}) at {{conference.name}}.</p>
<p>We kindly request that you now review and edit them, as we know automated subtitles aren't always accurate.</p>
<p><a href="{{uploadLink}}">View and edit subtitles on this page</a></p>
<p><b>The deadline for editing subtitles is 12:00 UTC on 6th January 2021.</b></p>
<p>After this time, subtitles will be automatically embedded into the video files and moved into the content delivery system - they will no longer be editable.</p>
<p>Thank you,<br/>
The Clowdr team
</p>`,
    subjectTemplate: "Clowdr: Submission SUCCESS: Subtitles generated for {{file.name}} at {{conference.name}}",
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
    };
    uploadLink: string;
}
