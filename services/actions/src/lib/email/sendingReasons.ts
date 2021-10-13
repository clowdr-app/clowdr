export enum EmailReason {
    UploadRequest = "upload-request",
    ItemSubmitted = "item_submitted",
    ItemTranscriptionSucceeded = "item_transcription_succeeded",
    ItemTranscriptionFailed = "item_transcription_failed",
    ItemTranscodeFailed = "item_transcode_failed",
    CustomEmail = "custom-email",
    ChatModerationReport = "chat_moderation_report",
    FailureNotification = "failure-notification",
}

export type EmailReasonDescriptions = {
    [K in EmailReason]: string;
};

const emailReasonDescriptions: EmailReasonDescriptions = {
    "upload-request": "the organisers have invited you to submit some content",
    item_submitted: "the organisers have invited you to submit some content",
    item_transcode_failed: "the organisers have invited you to submit some content",
    item_transcription_failed: "the organisers have invited you to submit some content",
    item_transcription_succeeded: "the organisers have invited you to submit some content",
    "custom-email": "the organisers have added you as a registrant",
    chat_moderation_report: "this is the designated support address",
    "failure-notification": "this is the designated failure notification address",
};

export function formatSendingReason(reason: string | EmailReason, conferenceName: string | null): string | null {
    const knownReasons: string[] = Object.values(EmailReason);
    if (knownReasons.includes(reason)) {
        if (conferenceName) {
            return `You received this email in connection with ${conferenceName} because ${
                emailReasonDescriptions[reason as EmailReason]
            }.`;
        } else {
            return `You received this email because ${emailReasonDescriptions[reason as EmailReason]}.`;
        }
    }

    if (conferenceName) {
        return `You received this email in connection with ${conferenceName}.`;
    }

    return null;
}
