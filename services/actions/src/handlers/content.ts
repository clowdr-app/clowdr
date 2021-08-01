import { gql } from "@apollo/client/core";
import {
    EmailTemplate_BaseConfig,
    isEmailTemplate_BaseConfig,
} from "@clowdr-app/shared-types/build/conferenceConfiguration";
import { AWSJobStatus } from "@clowdr-app/shared-types/build/content";
import { EmailView_SubtitlesGenerated, EMAIL_TEMPLATE_SUBTITLES_GENERATED } from "@clowdr-app/shared-types/build/email";
import assert from "assert";
import Mustache from "mustache";
import R from "ramda";
import {
    Conference_ConfigurationKey_Enum,
    ElementAddNewVersionDocument,
    Email_Insert_Input,
    GetElementDetailsDocument,
    GetUploadableElementDocument,
    GetUploadAgreementDocument,
    GetUploadersForElementDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { getConferenceConfiguration } from "../lib/conferenceConfiguration";
import { startPreviewTranscode } from "../lib/transcode";
import { startTranscribe } from "../lib/transcribe";
import { ElementData, Payload } from "../types/hasura/event";
import { insertEmails } from "./email";

gql`
    mutation ElementAddNewVersion($id: uuid!, $newVersion: jsonb!) {
        update_content_Element_by_pk(pk_columns: { id: $id }, _append: { data: $newVersion }) {
            id
        }
    }
`;

export async function handleElementUpdated(payload: Payload<ElementData>): Promise<void> {
    const oldRow = payload.event.data.old;
    const newRow = payload.event.data.new;

    if (!newRow?.data) {
        console.error("handleElementUpdated: new content was empty", newRow?.id);
        return;
    }

    if (newRow.data.length === 0) {
        console.log("handleElementUpdated: content item does not have any versions yet, ignoring", newRow.id);
        return;
    }

    const oldVersion = oldRow?.data[oldRow.data.length - 1];
    const currentVersion = newRow.data[newRow.data.length - 1];

    // If new version is not a video
    if (currentVersion.data.baseType !== "video") {
        console.log("Content item updated: was not a VideoBroadcast", newRow.id);
        return;
    }

    // If there is a new video source URL, start transcoding
    if (
        ((oldVersion && oldVersion.data.baseType === "video" && oldVersion.data.s3Url !== currentVersion.data.s3Url) ||
            (oldVersion &&
                oldVersion.data.baseType === "video" &&
                oldVersion.data.transcode &&
                !currentVersion.data.transcode) ||
            (!oldVersion && currentVersion.data.s3Url)) &&
        (!currentVersion.data.transcode || currentVersion.data.transcode.updatedTimestamp < currentVersion.createdAt)
    ) {
        const transcodeResult = await startPreviewTranscode(currentVersion.data.s3Url, newRow.id);

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
        console.log("Content item video URL has not changed.", newRow.id);
    }

    // If there is a new transcode URL, begin transcribing it
    if (
        (oldVersion &&
            oldVersion.data.baseType === "video" &&
            currentVersion.data.transcode?.s3Url &&
            !currentVersion.data.sourceHasEmbeddedSubtitles &&
            oldVersion.data.transcode?.s3Url !== currentVersion.data.transcode.s3Url) ||
        (!oldVersion && currentVersion.data.transcode?.s3Url && !currentVersion.data.subtitles["en_US"]?.s3Url)
    ) {
        await startTranscribe(currentVersion.data.transcode.s3Url, newRow.id);
    }

    if (
        (oldVersion &&
            oldVersion.data.baseType === "video" &&
            currentVersion.data.subtitles["en_US"] &&
            oldVersion.data.subtitles["en_US"]?.s3Url !== currentVersion.data.subtitles["en_US"]?.s3Url) ||
        (!oldVersion && currentVersion.data.subtitles["en_US"]?.s3Url)
    ) {
        // Send email if new machine-generated subtitles have been added
        if (currentVersion.createdBy === "system") {
            await trySendTranscriptionEmail(newRow.id);
        }
    }

    if (
        oldVersion &&
        oldVersion.data.baseType === "video" &&
        oldVersion.data.subtitles["en_US"]?.status !== "FAILED" &&
        currentVersion.data.subtitles["en_US"]?.status === "FAILED"
    ) {
        await trySendTranscriptionFailedEmail(newRow.id, newRow.name);
    }

    if (
        (oldVersion &&
            oldVersion.data.baseType === "video" &&
            oldVersion.data.transcode?.status !== "FAILED" &&
            currentVersion.data.transcode?.status === "FAILED") ||
        (!oldVersion && currentVersion.data.transcode?.status === "FAILED")
    ) {
        await trySendTranscodeFailedEmail(
            newRow.id,
            newRow.name,
            currentVersion.data.transcode.message ?? "No details available."
        );
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
            }
        }
    }
    query GetUploadersForElement($elementId: uuid!) {
        content_Uploader(where: { element: { id: { _eq: $elementId } } }) {
            name
            id
            email
        }
    }

    query GetUploadableElement($elementId: uuid!) {
        content_Element_by_pk(id: $elementId) {
            accessToken
            id
        }
    }
`;

async function trySendTranscriptionEmail(elementId: string) {
    try {
        const elementDetails = await apolloClient.query({
            query: GetElementDetailsDocument,
            variables: {
                elementId,
            },
        });

        const uploaders = await apolloClient.query({
            query: GetUploadersForElementDocument,
            variables: {
                elementId,
            },
        });

        const uploadableElementResult = await apolloClient.query({
            query: GetUploadableElementDocument,
            variables: {
                elementId,
            },
        });

        if (!uploadableElementResult.data.content_Element_by_pk) {
            throw new Error("Could not find the specified element");
        }

        const uploadableElement = uploadableElementResult.data.content_Element_by_pk;

        const element = elementDetails.data.content_Element_by_pk;
        if (!element) {
            throw new Error("Could not find Element while sending");
        }

        const magicItemLink = `${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/upload/${uploadableElement.id}/${uploadableElement.accessToken}`;

        let emailTemplates: EmailTemplate_BaseConfig | null = await getConferenceConfiguration(
            element.conference.id,
            Conference_ConfigurationKey_Enum.EmailTemplateSubtitlesGenerated
        );

        if (!isEmailTemplate_BaseConfig(emailTemplates)) {
            emailTemplates = null;
        }

        const emails: Email_Insert_Input[] = uploaders.data.content_Uploader.map((uploader) => {
            const view: EmailView_SubtitlesGenerated = {
                uploader,
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

            const htmlBody = Mustache.render(
                emailTemplates?.htmlBodyTemplate ?? EMAIL_TEMPLATE_SUBTITLES_GENERATED.htmlBodyTemplate,
                view
            );
            const subject = Mustache.render(
                emailTemplates?.subjectTemplate ?? EMAIL_TEMPLATE_SUBTITLES_GENERATED.subjectTemplate,
                view
            );
            const htmlContents = `${htmlBody}
<p>You are receiving this email because you are listed as an uploader for this item.</p>`;

            return {
                emailAddress: uploader.email,
                reason: "item_transcription_succeeded",
                subject,
                htmlContents,
            };
        });

        await insertEmails(emails, element.conference.id);
    } catch (e) {
        console.error("Error while sending transcription emails", elementId, e);
        return;
    }
}

async function trySendTranscriptionFailedEmail(elementId: string, elementName: string) {
    const elementDetails = await apolloClient.query({
        query: GetElementDetailsDocument,
        variables: {
            elementId,
        },
    });

    const uploaders = await apolloClient.query({
        query: GetUploadersForElementDocument,
        variables: {
            elementId,
        },
    });

    const uploadableElementResult = await apolloClient.query({
        query: GetUploadableElementDocument,
        variables: {
            elementId,
        },
    });

    if (!uploadableElementResult.data.content_Element_by_pk) {
        console.error("Could not find the specified element");
        return;
    }

    const uploadableElement = uploadableElementResult.data.content_Element_by_pk;

    const magicItemLink = `${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/upload/${uploadableElement.id}/${uploadableElement.accessToken}`;

    const emails: Email_Insert_Input[] = uploaders.data.content_Uploader.map((uploader) => {
        const htmlContents = `<p>Dear ${uploader.name},</p>
<p>Your item ${elementName} (${elementDetails.data.content_Element_by_pk?.item.title}) at ${elementDetails.data.content_Element_by_pk?.conference.name} <b>has successfully entered our systems</b>. Your video will be included in the conference pre-publications and/or live streams (as appropriate).</p>
<p>However, we are sorry that unfortunately an error occurred and we were unable to auto-generate subtitles. We appreciate this is a significant inconvenience but we kindly ask that you to manually enter subtitles for your video.</p>
<p><a href="${magicItemLink}">Please manually add subtitles on this page.</a></p>
<p><b>The deadline for submitting subtitles is 12:00 UTC on 6th January 2021.</b></p>
<p>After this time, subtitles will be automatically embedded into the video files and moved into the content delivery system - they will no longer be editable.</p>
<p>We have also sent ourselves a notification of this failure via email and we will assist you at our earliest opportunity. If we can get automated subtitles working for your video, we will let you know as soon as possible!</p>
<p>Thank you,<br/>
The Clowdr team
</p>
<p>You are receiving this email because you are listed as an uploader for this item.</p>`;

        return {
            emailAddress: uploader.email,
            reason: "item_transcription_failed",
            subject: `Clowdr: Submission ERROR: Failed to generate subtitles for ${elementName} at ${elementDetails.data.content_Element_by_pk?.conference.name}`,
            htmlContents,
        };
    });

    {
        const htmlContents = `<p>Yep, this is the automated system here to tell you that the automation failed.</p>
<p>Here's the content item id: ${elementId}.</p>
<p>Here's the magic link: <a href="${magicItemLink}">${magicItemLink}</a></p>
<p>Good luck fixing me!</p>`;
        emails.push({
            emailAddress: process.env.FAILURE_NOTIFICATIONS_EMAIL_ADDRESS,
            reason: "item_transcription_failed",
            subject: `PRIORITY: SYSTEM ERROR: Failed to generate subtitles for ${elementName} at ${elementDetails.data.content_Element_by_pk?.conference.name}`,
            htmlContents,
        });
    }

    await insertEmails(emails, elementDetails.data.content_Element_by_pk?.conference.id);
}

async function trySendTranscodeFailedEmail(elementId: string, elementName: string, message: string) {
    const elementDetails = await apolloClient.query({
        query: GetElementDetailsDocument,
        variables: {
            elementId,
        },
    });

    const uploaders = await apolloClient.query({
        query: GetUploadersForElementDocument,
        variables: {
            elementId,
        },
    });

    const uploadableElementResult = await apolloClient.query({
        query: GetUploadableElementDocument,
        variables: {
            elementId,
        },
    });

    if (!uploadableElementResult.data.content_Element_by_pk) {
        console.error("Could not find the specified element");
        return;
    }

    const uploadableElement = uploadableElementResult.data.content_Element_by_pk;

    const magicItemLink = `${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/upload/${uploadableElement.id}/${uploadableElement.accessToken}`;

    const emails: Email_Insert_Input[] = uploaders.data.content_Uploader.map((uploader) => {
        const htmlContents = `<p>Dear ${uploader.name},</p>
<p>There was a problem processing <b>${elementName}</b> (${elementDetails.data.content_Element_by_pk?.item.title}) for ${elementDetails.data.content_Element_by_pk?.conference.name}. Your video is not currently accepted by Clowdr's systems and currently will not be included in the conference pre-publications or live streams.</p>
<p>Error details: ${message}</p>
<p><a href="${magicItemLink}">You may try uploading a new version</a> but we recommend you forward this email to your conference's organisers and ask for technical assistance.</p>
<p>We have also sent ourselves a notification of this failure via email and we will assist you as soon as possible. Making Clowdr work for you is our top priority! We will try to understand the error and solve the issue either by fixing our software or providing you instructions for how to work around it.</p>
<p>Thank you,<br/>
The Clowdr team
</p>
<p>You are receiving this email because you are listed as an uploader for this item.</p>`;

        return {
            emailAddress: uploader.email,
            reason: "item_transcode_failed",
            subject: `Clowdr: Submission ERROR: Failed to process ${elementName} at ${elementDetails.data.content_Element_by_pk?.conference.name}`,
            htmlContents,
        };
    });

    {
        const htmlContents = `<p>Yep, this is the automated system here to tell you that the automation failed.</p>
<p>Here's the content item id: ${elementId}.</p>
<p>Here's the magic link: <a href="${magicItemLink}">${magicItemLink}</a></p>
<p>Good luck fixing me!</p>`;
        emails.push({
            emailAddress: process.env.FAILURE_NOTIFICATIONS_EMAIL_ADDRESS,
            reason: "item_transcode_failed",
            subject: `URGENT: SYSTEM ERROR: Failed to process ${elementName} at ${elementDetails.data.content_Element_by_pk?.conference.name}`,
            htmlContents,
        });
    }

    await insertEmails(emails, elementDetails.data.content_Element_by_pk?.conference.id);
}

gql`
    query GetUploadAgreement($accessToken: String!) {
        content_Element(where: { accessToken: { _eq: $accessToken } }) {
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
        result.data.content_Element.length === 1 &&
        result.data.content_Element[0].conference.configurations.length === 1 &&
        "text" in result.data.content_Element[0].conference.configurations[0].value
    ) {
        return {
            agreementText: result.data.content_Element[0].conference.configurations[0].value.text,
        };
    }

    return {};
}
