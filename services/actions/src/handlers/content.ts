import { gql } from "@apollo/client/core";
import type { GetUploadAgreementOutput, migrateElementArgs, MigrateElementOutput } from "@midspace/hasura/action-types";
import type { EventPayload } from "@midspace/hasura/event";
import type { ElementData } from "@midspace/hasura/event-data";
import type { EmailTemplate_BaseConfig } from "@midspace/shared-types/conferenceConfiguration";
import type { ElementVersionData, SubtitleDetails } from "@midspace/shared-types/content";
import { AWSJobStatus, ElementBaseType } from "@midspace/shared-types/content";
import { SourceType } from "@midspace/shared-types/content/element";
import type { EmailView_SubtitlesGenerated } from "@midspace/shared-types/email";
import AmazonS3URI from "amazon-s3-uri";
import assert from "assert";
import { compile } from "handlebars";
import type { P } from "pino";
import R from "ramda";
import type { ElementUpdateNotification_ElementDetailsFragment, Email_Insert_Input } from "../generated/graphql";
import {
    ElementAddNewVersionDocument,
    GetElementDetailsDocument,
    GetUploadAgreementDocument,
    MigrateElementDocument,
    MigrateElement_GetInfoDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { S3 } from "../lib/aws/awsClient";
import {
    getEmailTemplatesSubtitlesGenerated,
    getRecordingEmailNotificationsEnabled,
    getSubmissionNotificationRoles,
} from "../lib/conferenceConfiguration";
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

export async function handleElementUpdated(logger: P.Logger, payload: EventPayload<ElementData>): Promise<void> {
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
                oldVersion.data.transcode?.s3Url !== currentVersion.data.transcode.s3Url &&
                currentVersion.createdBy !== "migration") ||
            (oldVersion &&
                oldVersion.data.baseType === "video" &&
                currentVersion.data.transcode?.s3Url &&
                oldVersion.data.transcode?.s3Url === currentVersion.data.transcode.s3Url &&
                Boolean(oldVersion.data.subtitles["en_US"]?.s3Url) &&
                !currentVersion.data.subtitles["en_US"]?.s3Url &&
                currentVersion.createdBy !== "migration") ||
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
                oldVersion.data.s3Url !== currentVersion.data.s3Url &&
                currentVersion.createdBy !== "migration") ||
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
            await trySendTranscriptionEmail(logger, newRow);
        }
    }

    if (
        oldVersion &&
        (oldVersion.data.baseType === "video" || oldVersion.data.baseType === "audio") &&
        oldVersion.data.subtitles["en_US"]?.status !== "FAILED" &&
        currentVersion.data.subtitles["en_US"]?.status === "FAILED"
    ) {
        await trySendTranscriptionFailedEmail(logger, newRow, currentVersion.data.subtitles["en_US"]?.message ?? null);
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
                newRow,
                currentVersion.data.transcode.message ?? "No details available."
            );
        }
    }
}

gql`
    fragment ElementUpdateNotification_ElementDetails on content_Element {
        id
        name
        subconference {
            id
            name
            shortName
        }
        conference {
            id
            name
            shortName
            ...Configuration_RecordingEmailNotificationsEnabled
            ...Configuration_SubmissionNotificationRoles
            ...Configuration_EmailTemplateSubtitlesGenerated
        }
        item {
            id
            title
            itemPeople(where: { person: { _and: [{ email: { _is_null: false } }, { email: { _neq: "" } }] } }) {
                id
                person {
                    id
                    name
                    email
                    accessToken
                }
                roleName
            }
        }
        source
    }

    query GetElementDetails($elementId: uuid!) {
        content_Element_by_pk(id: $elementId) {
            ...ElementUpdateNotification_ElementDetails
        }
    }
`;

async function getElementDetails(elementId: string): Promise<{
    submissionNotificationRoles: string[];
    recordingNotificationsEnabled: boolean;
    emailTemplates: EmailTemplate_BaseConfig;
    elementDetails: ElementUpdateNotification_ElementDetailsFragment;
}> {
    const result = await apolloClient.query({
        query: GetElementDetailsDocument,
        variables: {
            elementId,
        },
    });

    const elementDetails = result.data.content_Element_by_pk;
    if (!elementDetails) {
        throw new Error("Could not find Element");
    }

    const emailTemplates = getEmailTemplatesSubtitlesGenerated(elementDetails.conference);
    const submissionNotificationRoles = getSubmissionNotificationRoles(elementDetails.conference);
    const recordingNotificationsEnabled = getRecordingEmailNotificationsEnabled(elementDetails.conference);

    return {
        emailTemplates,
        submissionNotificationRoles,
        recordingNotificationsEnabled,
        elementDetails,
    };
}

async function trySendTranscriptionEmail(logger: P.Logger, elementData: ElementData) {
    try {
        const { elementDetails, emailTemplates, submissionNotificationRoles, recordingNotificationsEnabled } =
            await getElementDetails(elementData.id);

        if (elementData.source?.source === SourceType.EventRecording && !recordingNotificationsEnabled) {
            return;
        }

        const bodyTemplate = compile(emailTemplates.htmlBodyTemplate);
        const subjectTemplate = compile(emailTemplates.subjectTemplate);

        const emails: Email_Insert_Input[] = elementDetails.item.itemPeople
            .filter((p) => submissionNotificationRoles.includes(p.roleName))
            .map(({ person }) => {
                const magicItemLink = `{{frontendHost}}/submissions/${person.accessToken}`;

                const context: EmailView_SubtitlesGenerated = {
                    person: {
                        name: person.name,
                    },
                    file: {
                        name: elementData.name,
                    },
                    conference: {
                        name: elementDetails.subconference?.name ?? elementDetails.conference.name,
                        shortName: elementDetails.subconference?.shortName ?? elementDetails.conference.shortName,
                    },
                    item: {
                        title: elementDetails.item.title,
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

        await insertEmails(logger, emails, elementData.conferenceId, elementData.subconferenceId, undefined);
    } catch (err) {
        logger.error({ elementData, err }, "Error while sending transcription emails");
        return;
    }
}

async function trySendTranscriptionFailedEmail(logger: P.Logger, elementData: ElementData, message: string | null) {
    const { elementDetails, submissionNotificationRoles, recordingNotificationsEnabled } = await getElementDetails(
        elementData.id
    );

    if (elementData.source?.source === SourceType.EventRecording && !recordingNotificationsEnabled) {
        return;
    }

    const elementType = R.last(elementData.data)?.data.baseType ?? "item";

    const emails: Email_Insert_Input[] = elementDetails.item.itemPeople
        .filter((p) => submissionNotificationRoles.includes(p.roleName))
        .map(({ person }) => {
            const magicItemLink = `{{frontendHost}}/submissions/${person.accessToken}/item/${elementDetails.item.id}/element/${elementData.id}`;

            const htmlContents = `<p>Dear ${person.name},</p>
<p>Your item ${elementData.name} (${elementDetails.item.title}) at ${
                elementDetails.subconference?.name ?? elementDetails.conference.name
            } <b>has successfully entered our systems</b>. Your ${elementType} will be included in the conference pre-publications and/or live streams (as appropriate).</p>
<p>However, we are sorry that unfortunately an error occurred and we were unable to auto-generate subtitles. We appreciate this is a significant inconvenience but we kindly ask that you to manually enter subtitles for your ${elementType}.</p>
<p><a href="${magicItemLink}">Please manually add subtitles on this page.</a></p>
<p>We have also sent ourselves a notification of this failure via email and we will assist you at our earliest opportunity. If we can get automated subtitles working for your ${elementType}, we will let you know as soon as possible!</p>`;

            return {
                recipientName: person.name,
                emailAddress: person.email,
                reason: EmailReason.ItemTranscriptionFailed,
                subject: `Submission ERROR: Failed to generate subtitles for ${elementData.name} at ${
                    elementDetails.subconference?.name ?? elementDetails.conference.name
                }`,
                htmlContents,
            };
        });

    {
        const htmlContents = `<p>Yep, this is the automated system here to tell you that the automation failed.</p>
        <pre>
failure           Failed to generate subtitles
message           ${message}
itemId            ${elementDetails.item.id}
itemTitle         ${elementDetails.item.title}
elementId         ${elementData.id}
elementName       ${elementData.name}
conferenceName    ${elementDetails.conference.name}
subconferenceName ${elementDetails.subconference?.name ?? "N/A"}
path              /item/${elementDetails.item.id}/element/${elementData.id}
        </pre>
<p>Good luck fixing me!</p>`;
        emails.push({
            recipientName: "System Administrator",
            emailAddress: process.env.FAILURE_NOTIFICATIONS_EMAIL_ADDRESS,
            reason: EmailReason.FailureNotification,
            subject: `PRIORITY: SYSTEM ERROR: Failed to generate subtitles for ${elementData.name} at ${
                elementDetails.subconference?.name ?? elementDetails.conference.name
            }`,
            htmlContents,
        });
    }

    await insertEmails(logger, emails, elementData.conferenceId, elementData.subconferenceId, undefined);
}

async function trySendTranscodeFailedEmail(logger: P.Logger, elementData: ElementData, message: string) {
    const { elementDetails, recordingNotificationsEnabled, submissionNotificationRoles } = await getElementDetails(
        elementData.id
    );

    if (elementData.source?.source === SourceType.EventRecording && !recordingNotificationsEnabled) {
        return;
    }

    const elementType = R.last(elementData.data)?.data.baseType ?? "item";

    const emails: Email_Insert_Input[] = elementDetails.item.itemPeople
        .filter((p) => submissionNotificationRoles.includes(p.roleName))
        .map(({ person }) => {
            const magicItemLink = `{{frontendHost}}/submissions/${person.accessToken}/item/${elementDetails.item.id}/element/${elementData.id}`;

            const htmlContents = `<p>Dear ${person.name},</p>
<p>There was a problem processing <b>${elementData.name}</b> (${elementDetails.item.title}) for ${
                elementDetails.subconference?.name ?? elementDetails.conference.name
            }. Your ${elementType} is not currently accepted by Midspace's systems and currently will not be included in the conference pre-publications or live streams.</p>
<p>Error details: ${message}</p>
<p><a href="${magicItemLink}">You may try uploading a new version</a> but we recommend you forward this email to your conference's organisers and ask for technical assistance.</p>
<p>We have also sent ourselves a notification of this failure via email and we will assist you as soon as possible. Making Midspace work for you is our top priority! We will try to understand the error and solve the issue either by fixing our software or providing you instructions for how to work around it.</p>`;

            return {
                recipientName: person.name,
                emailAddress: person.email,
                reason: "item_transcode_failed",
                subject: `Submission ERROR: Failed to process ${elementData.name} at ${
                    elementDetails.subconference?.name ?? elementDetails.conference.name
                }`,
                htmlContents,
            };
        });

    {
        const htmlContents = `<p>Yep, this is the automated system here to tell you that the automation failed.</p>
        <pre>
failure           Failed to transcode video
message           ${message}
itemId            ${elementDetails.item.id}
itemTitle         ${elementDetails.item.title}
elementId         ${elementData.id}
elementName       ${elementData.name}
conferenceName    ${elementDetails.conference.name}
subconferenceName ${elementDetails.subconference?.name ?? "N/A"}
path              /item/${elementDetails.item.id}/element/${elementData.id}
        </pre>
<p>Good luck fixing me!</p>`;
        emails.push({
            recipientName: "System Administrator",
            emailAddress: process.env.FAILURE_NOTIFICATIONS_EMAIL_ADDRESS,
            reason: EmailReason.ItemTranscodeFailed,
            subject: `URGENT: SYSTEM ERROR: Failed to process ${elementData.name} at ${
                elementDetails.subconference?.name ?? elementDetails.conference.name
            }`,
            htmlContents,
        });
    }

    await insertEmails(logger, emails, elementData.conferenceId, elementData.subconferenceId, undefined);
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

export async function handleGetUploadAgreement(magicToken: string): Promise<GetUploadAgreementOutput> {
    const result = await apolloClient.query({
        query: GetUploadAgreementDocument,
        variables: {
            accessToken: magicToken,
        },
    });

    const value = result.data.collection_ProgramPerson?.[0]?.conference?.configurations?.[0]?.value;
    const agreement = {
        agreementText: value?.text,
        agreementUrl: value?.url,
    };
    if (!agreement.agreementText) {
        delete agreement.agreementText;
    }
    if (!agreement.agreementUrl) {
        delete agreement.agreementUrl;
    }
    return agreement;
}

gql`
    query MigrateElement_GetInfo($elementId: uuid!) {
        content_Element_by_pk(id: $elementId) {
            id
            typeName
            data
        }
    }

    mutation MigrateElement($elementId: uuid!, $data: jsonb!) {
        update_content_Element_by_pk(pk_columns: { id: $elementId }, _set: { data: $data }) {
            id
        }
    }
`;

export async function handleMigrateElement(_logger: P.Logger, args: migrateElementArgs): Promise<MigrateElementOutput> {
    const elementId = args.elementId;

    const elementResp = await apolloClient.query({
        query: MigrateElement_GetInfoDocument,
        variables: {
            elementId,
        },
    });
    if (elementResp.data.content_Element_by_pk) {
        if (
            elementResp.data.content_Element_by_pk.data &&
            elementResp.data.content_Element_by_pk.data instanceof Array &&
            elementResp.data.content_Element_by_pk.data.length
        ) {
            const currentVersion: ElementVersionData =
                elementResp.data.content_Element_by_pk.data[elementResp.data.content_Element_by_pk.data.length - 1];
            let s3Url: string | undefined;
            let subtitleDetails: Record<string, SubtitleDetails> | undefined;

            switch (currentVersion.data.baseType) {
                case ElementBaseType.Audio:
                    s3Url = currentVersion.data.s3Url;
                    subtitleDetails = currentVersion.data.subtitles;
                    break;
                case ElementBaseType.Video:
                    s3Url = currentVersion.data.s3Url;
                    subtitleDetails = currentVersion.data.subtitles;
                    break;
                case ElementBaseType.File:
                    s3Url = currentVersion.data.s3Url;
                    break;
                default:
                    return {
                        success: true,
                    };
            }

            const deleteObjectKeys: string[] = [];

            if (s3Url) {
                const { key } = AmazonS3URI(s3Url);

                if (key && !key.startsWith(elementId)) {
                    const newKey = elementId + "/" + key;
                    await S3.copyObject({
                        Bucket: process.env.AWS_CONTENT_BUCKET_ID,
                        CopySource: process.env.AWS_CONTENT_BUCKET_ID + "/" + key,
                        Key: newKey,
                    });

                    currentVersion.data.s3Url = `s3://${process.env.AWS_CONTENT_BUCKET_ID}/${newKey}`;

                    deleteObjectKeys.push(key);
                }
            }

            if (subtitleDetails) {
                for (const langKey in subtitleDetails) {
                    const details = subtitleDetails[langKey];

                    if (details.status === AWSJobStatus.Completed) {
                        const { key } = AmazonS3URI(details.s3Url);

                        if (key && !key.startsWith(elementId)) {
                            const newKey = elementId + "/" + key;
                            await S3.copyObject({
                                Bucket: process.env.AWS_CONTENT_BUCKET_ID,
                                CopySource: process.env.AWS_CONTENT_BUCKET_ID + "/" + key,
                                Key: newKey,
                            });

                            details.s3Url = `s3://${process.env.AWS_CONTENT_BUCKET_ID}/${newKey}`;

                            deleteObjectKeys.push(key);
                        }
                    }
                }
            }

            if (
                currentVersion.data.baseType === ElementBaseType.Video &&
                currentVersion.data.transcode &&
                currentVersion.data.transcode.s3Url?.length &&
                currentVersion.data.transcode.status === AWSJobStatus.Completed
            ) {
                const { key } = AmazonS3URI(currentVersion.data.transcode.s3Url);

                if (key && !key.startsWith(elementId)) {
                    const newKey = elementId + "/" + key;
                    await S3.copyObject({
                        Bucket: process.env.AWS_CONTENT_BUCKET_ID,
                        CopySource: process.env.AWS_CONTENT_BUCKET_ID + "/" + key,
                        Key: newKey,
                    });

                    currentVersion.data.transcode.s3Url = `s3://${process.env.AWS_CONTENT_BUCKET_ID}/${newKey}`;

                    deleteObjectKeys.push(key);
                }
            }

            if (deleteObjectKeys.length > 0) {
                currentVersion.createdBy = "migration";

                await apolloClient.mutate({
                    mutation: MigrateElementDocument,
                    variables: {
                        elementId,
                        data: elementResp.data.content_Element_by_pk.data,
                    },
                });

                await S3.deleteObjects({
                    Bucket: process.env.AWS_CONTENT_BUCKET_ID,
                    Delete: {
                        Objects: deleteObjectKeys.map((x) => ({ Key: x })),
                    },
                });
            }
        }

        return {
            success: true,
        };
    } else {
        return {
            success: false,
        };
    }
}
