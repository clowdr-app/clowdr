import { insertEmails } from "../../handlers/email";

export async function sendFailureEmail(failureReason: string, stackTrace?: string): Promise<void> {
    try {
        const htmlContents = `<p>Yep, this is the automated system here to tell you that the automation failed.</p>
<p>Good luck fixing me!</p>
<p>Failure reason: ${failureReason}</p>
${stackTrace ? `<p>Stack trace: ${stackTrace}</p>` : ""}`;
        const emails = [
            {
                recipientName: "System Administrator",
                emailAddress: process.env.FAILURE_NOTIFICATIONS_EMAIL_ADDRESS,
                reason: "item_transcode_failed",
                subject: `URGENT: SYSTEM ERROR: Failure due to ${failureReason}`,
                htmlContents,
            },
        ];

        await insertEmails(emails, undefined);
    } catch (e: any) {
        console.error("Failed to send failure email!", failureReason, e);
    }
}
