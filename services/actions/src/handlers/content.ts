import { gql } from "@apollo/client/core";
import type { getUploadAgreementArgs, GetUploadAgreementOutput } from "@midspace/hasura/actionTypes";
import type { ElementData, Payload } from "@midspace/hasura/event";
import type { EmailTemplate_BaseConfig } from "@midspace/shared-types/conferenceConfiguration";
import { isEmailTemplate_BaseConfig } from "@midspace/shared-types/conferenceConfiguration";
import { AWSJobStatus } from "@midspace/shared-types/content";
import type { EmailView_SubtitlesGenerated } from "@midspace/shared-types/email";
import { EMAIL_TEMPLATE_SUBTITLES_GENERATED } from "@midspace/shared-types/email";
import assert from "assert";
import { compile } from "handlebars";
import type { P } from "pino";
import R from "ramda";
import type { Email_Insert_Input } from "../generated/graphql";
import {
    Conference_ConfigurationKey_Enum,
    ElementAddNewVersionDocument,
    GetElementDetailsDocument,
    GetUploadAgreementDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { getConferenceConfiguration } from "../lib/conferenceConfiguration";
import { EmailReason } from "../lib/email/sendingReasons";
import { startPreviewTranscode } from "../lib/transcode";
import { startTranscribe } from "../lib/transcribe";
import { insertEmails } from "./email";

gql`
    mutation ElementAddNewVersion($id: uuid!, $newVersion: jsonb!) {
        update_content_Element_by_pk(pk_columns: { id: $id }, _append: { data: $newVersion }) {
            id
        }
    }
`;

export async function handleElementUpdated(logger: P.Logger, payload: Payload<ElementData>): Promise<void> {
    const oldRow = payload.event.data.old;
    const newRow = payload.event.data.new;

    if (!newRow?.data) {
        logger.error(
            { oldElementId: oldRow?.id, newElementId: newRow?.id },
            "handleElementUpdated: new content was empty"
        );
        return;
    }

    if (newRow.data.length === 0) {
        logger.info(
            { elementId: newRow.id },
            "handleElementUpdated: content item does not have any versions yet, ignoring"
        );
        return;
    }

    const oldVersion = oldRow?.data[oldRow.data.length - 1];
    const currentVersion = newRow.data[newRow.data.length - 1];

    // If new version is not a video or audio file
    if (currentVersion.data.baseType !== "video" && currentVersion.data.baseType !== "audio") {
        logger.info({ elementId: newRow.id }, "Content item updated: was not a video or audio file.");
        return;
    }

    // If there is a new video source URL, start transcoding
    if (currentVersion.data.baseType === "video") {
        if (
            ((oldVersion &&
                oldVersion.data.baseType === "video" &&
                oldVersion.data.s3Url !== currentVersion.data.s3Url) ||
                (oldVersion &&
                    oldVersion.data.baseType === "video" &&
                    oldVersion.data.transcode &&
                    !currentVersion.data.transcode) ||
                (!oldVersion && currentVersion.data.s3Url)) &&
            (!currentVersion.data.transcode ||
                currentVersion.data.transcode.updatedTimestamp < currentVersion.createdAt)
        ) {
            const transcodeResult = await startPreviewTranscode(logger, currentVersion.data.s3Url, newRow.id);

            // Update data item with new version
            const newVersion = R.clone(currentVersion);
            assert(newVersion.data.type === currentVersion.data.type, "Clone failed (this should never happen!)"); // give TypeScript's inference a nudge

            newVersion.createdAt = Date.now();
            newVersion.createdBy = "system";
            newVersion.data.transcode = {
                jobId: transcodeResult.jobId,
                status: AWSJobStatus.InProgress,
                updatedTimestamp: transcodeResult.timestamp.getTime(),
            };

            const mutateResult = await apolloClient.mutate({
                mutation: ElementAddNewVersionDocument,
                variables: {
                    id: newRow.id,
                    newVersion,
                },
            });

            assert(mutateResult.data?.update_content_Element_by_pk?.id, "Failed to record transcode initialisation");
        } else {
            logger.info({ elementId: newRow.id }, "Content item video URL has not changed.");
        }
    }

    // If there is a new transcode URL, begin transcribing it
    if (currentVersion.data.baseType === "video") {
        if (
            (oldVersion &&
                oldVersion.data.baseType === "video" &&
                currentVersion.data.transcode?.s3Url &&
                !currentVersion.data.sourceHasEmbeddedSubtitles &&
                oldVersion.data.transcode?.s3Url !== currentVersion.data.transcode.s3Url) ||
            (!oldVersion && currentVersion.data.transcode?.s3Url && !currentVersion.data.subtitles["en_US"]?.s3Url)
        ) {
            await startTranscribe(logger, currentVersion.data.transcode.s3Url, newRow.id);
        }
    } else if (currentVersion.data.baseType === "audio") {
        if (
            (oldVersion &&
                oldVersion.data.baseType === "audio" &&
                currentVersion.data.s3Url &&
                !currentVersion.data.sourceHasEmbeddedSubtitles &&
                oldVersion.data.s3Url !== currentVersion.data.s3Url) ||
            (!oldVersion && currentVersion.data.s3Url && !currentVersion.data.subtitles["en_US"]?.s3Url)
        ) {
            await startTranscribe(logger, currentVersion.data.s3Url, newRow.id);
        }
    }

    if (
        (oldVersion &&
            (oldVersion.data.baseType === "video" || oldVersion.data.baseType === "audio") &&
            currentVersion.data.subtitles["en_US"] &&
            oldVersion.data.subtitles["en_US"]?.s3Url !== currentVersion.data.subtitles["en_US"]?.s3Url) ||
        (!oldVersion && currentVersion.data.subtitles["en_US"]?.s3Url)
    ) {
        // Send email if new machine-generated subtitles have been added
        if (currentVersion.createdBy === "system") {
            await trySendTranscriptionEmail(logger, newRow.id);
        }
    }

    if (
        oldVersion &&
        (oldVersion.data.baseType === "video" || oldVersion.data.baseType === "audio") &&
        oldVersion.data.subtitles["en_US"]?.status !== "FAILED" &&
        currentVersion.data.subtitles["en_US"]?.status === "FAILED"
    ) {
        await trySendTranscriptionFailedEmail(
            logger,
            newRow.id,
            newRow.name,
            currentVersion.data.baseType,
            currentVersion.data.subtitles["en_US"]?.message ?? null
        );
    }

    if (currentVersion.data.baseType === "video") {
        if (
            (oldVersion &&
                oldVersion.data.baseType === "video" &&
                oldVersion.data.transcode?.status !== "FAILED" &&
                currentVersion.data.transcode?.status === "FAILED") ||
            (!oldVersion && currentVersion.data.transcode?.status === "FAILED")
        ) {
            await trySendTranscodeFailedEmail(
                logger,
                newRow.id,
                newRow.name,
                currentVersion.data.baseType,
                currentVersion.data.transcode.message ?? "No details available."
            );
        }
    }
}

gql`
    query GetElementDetails($elementId: uuid!) {
        content_Element_by_pk(id: $elementId) {
            id
            name
            conference {
                id
                name
                shortName
            }
            item {
                id
                title
                itemPeople(
                    where: {
                        person: { _and: [{ email: { _is_null: false } }, { email: { _neq: "" } }] }
                        roleName: { _in: ["AUTHOR", "PRESENTER", "DISCUSSANT"] }
                    }
                ) {
                    id
                    person {
                        id
                        name
                        email
                        accessToken
                    }
                }
            }
        }
    }
`;

async function trySendTranscriptionEmail(logger: P.Logger, elementId: string) {
    try {
        const elementDetails = await apolloClient.query({
            query: GetElementDetailsDocument,
            variables: {
                elementId,
            },
        });

        if (!elementDetails.data.content_Element_by_pk) {
            throw new Error("Could not find the specified element");
        }

        const element = elementDetails.data.content_Element_by_pk;
        if (!element) {
            throw new Error("Could not find Element while sending");
        }

        let emailTemplates: EmailTemplate_BaseConfig | null = await getConferenceConfiguration(
            element.conference.id,
            Conference_ConfigurationKey_Enum.EmailTemplateSubtitlesGenerated
        );

        if (!isEmailTemplate_BaseConfig(emailTemplates)) {
            emailTemplates = null;
        }

        const bodyTemplate = compile(
            emailTemplates?.htmlBodyTemplate ?? EMAIL_TEMPLATE_SUBTITLES_GENERATED.htmlBodyTemplate
        );
        const subjectTemplate = compile(
            emailTemplates?.subjectTemplate ?? EMAIL_TEMPLATE_SUBTITLES_GENERATED.subjectTemplate
        );

        const emails: Email_Insert_Input[] = element.item.itemPeople.map(({ person }) => {
            const magicItemLink = `{{frontendHost}}/submissions/${person.accessToken}`;

            const context: EmailView_SubtitlesGenerated = {
                person: {
                    name: person.name,
                },
                file: {
                    name: element.name,
                },
                conference: {
                    name: element.conference.name,
                    shortName: element.conference.shortName,
                },
                item: {
                    title: element.item.title,
                },
                uploadLink: magicItemLink,
            };

            const htmlBody = bodyTemplate(context);
            const subject = subjectTemplate(context);

            return {
                recipientName: person.name,
                emailAddress: person.email,
                reason: EmailReason.ItemTranscriptionSucceeded,
                subject,
                htmlContents: htmlBody,
            };
        });

        await insertEmails(logger, emails, element.conference.id);
    } catch (err) {
        logger.error({ elementId, err }, "Error while sending transcription emails");
        return;
    }
}

async function trySendTranscriptionFailedEmail(
    logger: P.Logger,
    elementId: string,
    elementName: string,
    elementType: "video" | "audio",
    message: string | null
) {
    const elementDetails = await apolloClient.query({
        query: GetElementDetailsDocument,
        variables: {
            elementId,
        },
    });

    if (!elementDetails.data.content_Element_by_pk) {
        logger.error({ elementId }, "Could not find the specified element");
        return;
    }

    const element = elementDetails.data.content_Element_by_pk;
    const emails: Email_Insert_Input[] = element.item.itemPeople.map(({ person }) => {
        const magicItemLink = `{{frontendHost}}/submissions/${person.accessToken}/item/${element.item.id}/element/${element.id}`;

        const htmlContents = `<p>Dear ${person.name},</p>
<p>Your item ${elementName} (${element.item.title}) at ${element.conference.name} <b>has successfully entered our systems</b>. Your ${elementType} will be included in the conference pre-publications and/or live streams (as appropriate).</p>
<p>However, we are sorry that unfortunately an error occurred and we were unable to auto-generate subtitles. We appreciate this is a significant inconvenience but we kindly ask that you to manually enter subtitles for your ${elementType}.</p>
<p><a href="${magicItemLink}">Please manually add subtitles on this page.</a></p>
<p>We have also sent ourselves a notification of this failure via email and we will assist you at our earliest opportunity. If we can get automated subtitles working for your ${elementType}, we will let you know as soon as possible!</p>`;

        return {
            recipientName: person.name,
            emailAddress: person.email,
            reason: EmailReason.ItemTranscriptionFailed,
            subject: `Submission ERROR: Failed to generate subtitles for ${elementName} at ${element.conference.name}`,
            htmlContents,
        };
    });

    {
        const htmlContents = `<p>Yep, this is the automated system here to tell you that the automation failed.</p>
        <pre>
failure         Failed to generate subtitles
message         ${message}
itemId          ${element.item.id}
itemTitle       ${element.item.title}
elementId       ${elementId}
elementName     ${elementName}
conferenceName  ${element.conference.name}
path            /item/${element.item.id}/element/${elementId}
        </pre>
<p>Good luck fixing me!</p>`;
        emails.push({
            recipientName: "System Administrator",
            emailAddress: process.env.FAILURE_NOTIFICATIONS_EMAIL_ADDRESS,
            reason: EmailReason.FailureNotification,
            subject: `PRIORITY: SYSTEM ERROR: Failed to generate subtitles for ${elementName} at ${elementDetails.data.content_Element_by_pk?.conference.name}`,
            htmlContents,
        });
    }

    await insertEmails(logger, emails, elementDetails.data.content_Element_by_pk?.conference.id);
}

async function trySendTranscodeFailedEmail(
    logger: P.Logger,
    elementId: string,
    elementName: string,
    elementType: "video" | "audio",
    message: string
) {
    const elementDetails = await apolloClient.query({
        query: GetElementDetailsDocument,
        variables: {
            elementId,
        },
    });

    if (!elementDetails.data.content_Element_by_pk) {
        logger.error({ elementId }, "Could not find the specified element");
        return;
    }

    const element = elementDetails.data.content_Element_by_pk;

    const emails: Email_Insert_Input[] = element.item.itemPeople.map(({ person }) => {
        const magicItemLink = `{{frontendHost}}/submissions/${person.accessToken}/item/${element.item.id}/element/${element.id}`;

        const htmlContents = `<p>Dear ${person.name},</p>
<p>There was a problem processing <b>${elementName}</b> (${element.item.title}) for ${element.conference.name}. Your ${elementType} is not currently accepted by Midspace's systems and currently will not be included in the conference pre-publications or live streams.</p>
<p>Error details: ${message}</p>
<p><a href="${magicItemLink}">You may try uploading a new version</a> but we recommend you forward this email to your conference's organisers and ask for technical assistance.</p>
<p>We have also sent ourselves a notification of this failure via email and we will assist you as soon as possible. Making Midspace work for you is our top priority! We will try to understand the error and solve the issue either by fixing our software or providing you instructions for how to work around it.</p>`;

        return {
            recipientName: person.name,
            emailAddress: person.email,
            reason: "item_transcode_failed",
            subject: `Submission ERROR: Failed to process ${elementName} at ${element.conference.name}`,
            htmlContents,
        };
    });

    {
        const htmlContents = `<p>Yep, this is the automated system here to tell you that the automation failed.</p>
        <pre>
failure         Failed to transcode video
message         ${message}
itemId          ${element.item.id}
itemTitle       ${element.item.title}
elementId       ${elementId}
elementName     ${elementName}
conferenceName  ${element.conference.name}
path            /item/${element.item.id}/element/${elementId}
        </pre>
<p>Good luck fixing me!</p>`;
        emails.push({
            recipientName: "System Administrator",
            emailAddress: process.env.FAILURE_NOTIFICATIONS_EMAIL_ADDRESS,
            reason: EmailReason.ItemTranscodeFailed,
            subject: `URGENT: SYSTEM ERROR: Failed to process ${elementName} at ${elementDetails.data.content_Element_by_pk?.conference.name}`,
            htmlContents,
        });
    }

    await insertEmails(logger, emails, elementDetails.data.content_Element_by_pk?.conference.id);
}

gql`
    query GetUploadAgreement($accessToken: String!) {
        collection_ProgramPerson(where: { accessToken: { _eq: $accessToken } }) {
            conference {
                configurations(where: { key: { _eq: UPLOAD_AGREEMENT } }) {
                    conferenceId
                    key
                    value
                }
            }
        }
    }
`;

export async function handleGetUploadAgreement(args: getUploadAgreementArgs): Promise<GetUploadAgreementOutput> {
    const result = await apolloClient.query({
        query: GetUploadAgreementDocument,
        variables: {
            accessToken: args.magicToken,
        },
    });

    if (result.error) {
        throw new Error("No item found");
    }

    if (
        result.data.collection_ProgramPerson.length === 1 &&
        result.data.collection_ProgramPerson[0].conference.configurations.length === 1
    ) {
        const value = result.data.collection_ProgramPerson[0].conference.configurations[0].value;
        if ("text" in value && "url" in value) {
            return {
                agreementText: value.text,
                agreementUrl: value.url,
            };
        } else if ("text" in value) {
            return {
                agreementText: value.text,
            };
        } else if ("url" in value) {
            return {
                agreementUrl: value.url,
            };
        }
    }

    return {};
}
