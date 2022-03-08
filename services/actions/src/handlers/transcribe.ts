import crypto from "crypto";
import { createPresignedURL } from "../lib/aws/awsSignatureV4";

export async function handleGeneratePresignedTranscribeWebsocketURL(
    languageCode: string,
    sampleRate: string
): Promise<{ url: string }> {
    const accessKeyId = process.env.AWS_PUBLIC_TRANSCRIBE_USER_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_PUBLIC_TRANSCRIBE_USER_SECRET_ACCESS_KEY;
    const region = process.env.AWS_PUBLIC_TRANSCRIBE_REGION;
    if (!accessKeyId || !secretAccessKey || !region) {
        throw new Error("Transcribe not configured.");
    }

    const endpoint = "transcribestreaming." + region + ".amazonaws.com:8443";
    return {
        url: createPresignedURL(
            "GET",
            endpoint,
            "/stream-transcription-websocket",
            "transcribe",
            crypto.createHash("sha256").update("", "utf8").digest("hex"),
            {
                key: accessKeyId,
                secret: secretAccessKey,
                sessionToken: "",
                protocol: "wss",
                expires: 4 * 60, // 4 hours?
                region: region,
                query:
                    "language-code=" +
                    languageCode +
                    "&media-encoding=pcm&sample-rate=" +
                    sampleRate +
                    "&enable-partial-results-stabilization=true&partial-results-stability=medium&content-redaction-type=PII&pii-entity-types=BANK_ACCOUNT_NUMBER,BANK_ROUTING,CREDIT_DEBIT_NUMBER,CREDIT_DEBIT_CVV,CREDIT_DEBIT_EXPIRY,PIN,EMAIL,ADDRESS,PHONE,SSN",
            }
        ),
    };
}
