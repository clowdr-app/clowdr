/**
 * The default template for the subtitles generated email.
 */
export const EMAIL_TEMPLATE_SUBTITLES_GENERATED = {
    htmlBodyTemplate: `<p>Dear {{uploader.name}},</p>
<p>We have automatically generated subtitles for your item <em>{{file.name}}</em> ({{item.title}}) at {{conference.name}}.</p>
<p>Automated subtitles aren't always accurate, so you can <a href="{{uploadLink}}">review and edit them here</a>.</p>
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
