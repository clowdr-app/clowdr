import { gql } from "@apollo/client/core";
import {
    ConferenceConfigurationKey,
    EmailTemplate_BaseConfig,
    isEmailTemplate_BaseConfig,
} from "@clowdr-app/shared-types/build/conferenceConfiguration";
import { AWSJobStatus } from "@clowdr-app/shared-types/build/content";
import { EmailView_SubtitlesGenerated, EMAIL_TEMPLATE_SUBTITLES_GENERATED } from "@clowdr-app/shared-types/build/email";
import assert from "assert";
import { htmlToText } from "html-to-text";
import Mustache from "mustache";
import R from "ramda";
import {
    ContentItemAddNewVersionDocument,
    Email_Insert_Input,
    GetContentItemByRequiredItemDocument,
    GetContentItemDetailsDocument,
    GetRequiredContentItemDocument,
    GetUploadAgreementDocument,
    GetUploadersForContentItemDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { getConferenceConfiguration } from "../lib/conferenceConfiguration";
import { startPreviewTranscode } from "../lib/transcode";
import { startTranscribe } from "../lib/transcribe";
import { ContentItemData, Payload } from "../types/hasura/event";
import { insertEmails } from "./email";

gql`
    mutation ContentItemAddNewVersion($id: uuid!, $newVersion: jsonb!) {
        update_ContentItem_by_pk(pk_columns: { id: $id }, _append: { data: $newVersion }) {
            id
        }
    }
`;

export async function handleContentItemUpdated(payload: Payload<ContentItemData>): Promise<void> {
    const oldRow = payload.event.data.old;
    const newRow = payload.event.data.new;

    if (!newRow?.data) {
        console.error("handleContentItemUpdated: new content was empty", newRow?.id);
        return;
    }

    if (newRow.data.length === 0) {
        console.log("handleContentItemUpdated: content item does not have any versions yet, ignoring", newRow.id);
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
            mutation: ContentItemAddNewVersionDocument,
            variables: {
                id: newRow.id,
                newVersion,
            },
        });

        assert(mutateResult.data?.update_ContentItem_by_pk?.id, "Failed to record transcode initialisation");
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
    query GetContentItemDetails($contentItemId: uuid!) {
        ContentItem_by_pk(id: $contentItemId) {
            id
            name
            conference {
                id
                name
                shortName
            }
            contentGroup {
                id
                title
            }
        }
    }
    query GetUploadersForContentItem($contentItemId: uuid!) {
        Uploader(where: { requiredContentItem: { contentItem: { id: { _eq: $contentItemId } } } }) {
            name
            id
            email
        }
    }

    query GetRequiredContentItem($contentItemId: uuid!) {
        RequiredContentItem(where: { contentItem: { id: { _eq: $contentItemId } } }) {
            accessToken
            id
        }
    }
`;

async function trySendTranscriptionEmail(contentItemId: string) {
    try {
        const contentItemDetails = await apolloClient.query({
            query: GetContentItemDetailsDocument,
            variables: {
                contentItemId,
            },
        });

        const uploaders = await apolloClient.query({
            query: GetUploadersForContentItemDocument,
            variables: {
                contentItemId,
            },
        });

        const requiredContentItemResult = await apolloClient.query({
            query: GetRequiredContentItemDocument,
            variables: {
                contentItemId,
            },
        });

        if (requiredContentItemResult.data.RequiredContentItem.length !== 1) {
            // TODO: handle the >1 case
            throw new Error(
                `Could not find a single required item (found ${requiredContentItemResult.data.RequiredContentItem.length}) for content item`
            );
        }

        const requiredContentItem = requiredContentItemResult.data.RequiredContentItem[0];

        const contentItem = contentItemDetails.data.ContentItem_by_pk;
        if (!contentItem) {
            throw new Error("Could not find ContentItem while sending");
        }

        const magicItemLink = `${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/upload/${requiredContentItem.id}/${requiredContentItem.accessToken}`;

        let emailTemplates: EmailTemplate_BaseConfig | null = await getConferenceConfiguration(
            contentItem.conference.id,
            ConferenceConfigurationKey.EmailTemplate_SubtitlesGenerated
        );

        if (!isEmailTemplate_BaseConfig(emailTemplates)) {
            emailTemplates = null;
        }

        const emails: Email_Insert_Input[] = uploaders.data.Uploader.map((uploader) => {
            const view: EmailView_SubtitlesGenerated = {
                uploader,
                file: {
                    name: contentItem.name,
                },
                conference: {
                    name: contentItem.conference.name,
                    shortName: contentItem.conference.shortName,
                },
                item: {
                    title: contentItem.contentGroup.title,
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
<p>You are receiving this email because you are listed as an uploader for this item.
This is an automated email sent on behalf of Clowdr CIC. If you believe you have received this
email in error, please contact us via ${process.env.STOP_EMAILS_CONTACT_EMAIL_ADDRESS}.</p>`;

            return {
                emailAddress: uploader.email,
                reason: "item_transcription_succeeded",
                subject,
                htmlContents,
                plainTextContents: htmlToText(htmlContents),
            };
        });

        await insertEmails(emails);
    } catch (e) {
        console.error("Error while sending transcription emails", contentItemId, e);
        return;
    }
}

async function trySendTranscriptionFailedEmail(contentItemId: string, contentItemName: string) {
    const contentItemDetails = await apolloClient.query({
        query: GetContentItemDetailsDocument,
        variables: {
            contentItemId,
        },
    });

    const uploaders = await apolloClient.query({
        query: GetUploadersForContentItemDocument,
        variables: {
            contentItemId,
        },
    });

    const requiredContentItemResult = await apolloClient.query({
        query: GetRequiredContentItemDocument,
        variables: {
            contentItemId,
        },
    });

    if (requiredContentItemResult.data.RequiredContentItem.length !== 1) {
        // TODO: handle the >1 case
        console.error(`Could not find a single required item for content item ${contentItemId}`);
        return;
    }

    const requiredContentItem = requiredContentItemResult.data.RequiredContentItem[0];

    const magicItemLink = `${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/upload/${requiredContentItem.id}/${requiredContentItem.accessToken}`;

    const emails: Email_Insert_Input[] = uploaders.data.Uploader.map((uploader) => {
        const htmlContents = `<p>Dear ${uploader.name},</p>
<p>Your item ${contentItemName} (${contentItemDetails.data.ContentItem_by_pk?.contentGroup.title}) at ${contentItemDetails.data.ContentItem_by_pk?.conference.name} <b>has successfully entered our systems</b>. Your video will be included in the conference pre-publications and/or live streams (as appropriate).</p>
<p>However, we are sorry that unfortunately an error occurred and we were unable to auto-generate subtitles. We appreciate this is a significant inconvenience but we kindly ask that you to manually enter subtitles for your video.</p>
<p><a href="${magicItemLink}">Please manually add subtitles on this page.</a></p>
<p><b>The deadline for submitting subtitles is 12:00 UTC on 6th January 2021.</b></p>
<p>After this time, subtitles will be automatically embedded into the video files and moved into the content delivery system - they will no longer be editable.</p>
<p>We have also sent ourselves a notification of this failure via email and we will assist you at our earliest opportunity. If we can get automated subtitles working for your video, we will let you know as soon as possible!</p>
<p>Thank you,<br/>
The Clowdr team
</p>
<p>You are receiving this email because you are listed as an uploader for this item.
This is an automated email sent on behalf of Clowdr CIC. If you believe you have received this
email in error, please contact us via ${process.env.STOP_EMAILS_CONTACT_EMAIL_ADDRESS}.</p>`;

        return {
            emailAddress: uploader.email,
            reason: "item_transcription_failed",
            subject: `Clowdr: Submission ERROR: Failed to generate subtitles for ${contentItemName} at ${contentItemDetails.data.ContentItem_by_pk?.conference.name}`,
            htmlContents,
            plainTextContents: htmlToText(htmlContents),
        };
    });

    {
        const htmlContents = `<p>Yep, this is the automated system here to tell you that the automation failed.</p>
<p>Here's the content item id: ${contentItemId}.</p>
<p>Here's the magic link: <a href="${magicItemLink}">${magicItemLink}</a></p>
<p>Good luck fixing me!</p>`;
        emails.push({
            emailAddress: process.env.FAILURE_NOTIFICATIONS_EMAIL_ADDRESS,
            reason: "item_transcription_failed",
            subject: `PRIORITY: SYSTEM ERROR: Failed to generate subtitles for ${contentItemName} at ${contentItemDetails.data.ContentItem_by_pk?.conference.name}`,
            htmlContents,
            plainTextContents: htmlToText(htmlContents),
        });
    }

    await insertEmails(emails);
}

async function trySendTranscodeFailedEmail(contentItemId: string, contentItemName: string, message: string) {
    const contentItemDetails = await apolloClient.query({
        query: GetContentItemDetailsDocument,
        variables: {
            contentItemId,
        },
    });

    const uploaders = await apolloClient.query({
        query: GetUploadersForContentItemDocument,
        variables: {
            contentItemId,
        },
    });

    const requiredContentItemResult = await apolloClient.query({
        query: GetRequiredContentItemDocument,
        variables: {
            contentItemId,
        },
    });

    if (requiredContentItemResult.data.RequiredContentItem.length !== 1) {
        // TODO: handle the >1 case
        console.error(`Could not find a single required item for content item ${contentItemId}`);
        return;
    }

    const requiredContentItem = requiredContentItemResult.data.RequiredContentItem[0];

    const magicItemLink = `${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/upload/${requiredContentItem.id}/${requiredContentItem.accessToken}`;

    const emails: Email_Insert_Input[] = uploaders.data.Uploader.map((uploader) => {
        const htmlContents = `<p>Dear ${uploader.name},</p>
<p>There was a problem processing <b>${contentItemName}</b> (${contentItemDetails.data.ContentItem_by_pk?.contentGroup.title}) for ${contentItemDetails.data.ContentItem_by_pk?.conference.name}. Your video is not currently accepted by Clowdr's systems and currently will not be included in the conference pre-publications or live streams.</p>
<p>Error details: ${message}</p>
<p><a href="${magicItemLink}">You may try uploading a new version</a> but we recommend you forward this email to your conference's organisers and ask for technical assistance.</p>
<p>We have also sent ourselves a notification of this failure via email and we will assist you as soon as possible. Making Clowdr work for you is our top priority! We will try to understand the error and solve the issue either by fixing our software or providing you instructions for how to work around it.</p>
<p>Thank you,<br/>
The Clowdr team
</p>
<p>You are receiving this email because you are listed as an uploader for this item.
This is an automated email sent on behalf of Clowdr CIC. If you believe you have received this
email in error, please contact us via ${process.env.STOP_EMAILS_CONTACT_EMAIL_ADDRESS}.</p>`;

        return {
            emailAddress: uploader.email,
            reason: "item_transcode_failed",
            subject: `Clowdr: Submission ERROR: Failed to process ${contentItemName} at ${contentItemDetails.data.ContentItem_by_pk?.conference.name}`,
            htmlContents,
            plainTextContents: htmlToText(htmlContents),
        };
    });

    {
        const htmlContents = `<p>Yep, this is the automated system here to tell you that the automation failed.</p>
<p>Here's the content item id: ${contentItemId}.</p>
<p>Here's the magic link: <a href="${magicItemLink}">${magicItemLink}</a></p>
<p>Good luck fixing me!</p>`;
        emails.push({
            emailAddress: process.env.FAILURE_NOTIFICATIONS_EMAIL_ADDRESS,
            reason: "item_transcode_failed",
            subject: `URGENT: SYSTEM ERROR: Failed to process ${contentItemName} at ${contentItemDetails.data.ContentItem_by_pk?.conference.name}`,
            htmlContents,
            plainTextContents: htmlToText(htmlContents),
        });
    }

    await insertEmails(emails);
}

gql`
    query GetContentItemByRequiredItem($accessToken: String!) {
        ContentItem(where: { requiredContentItem: { accessToken: { _eq: $accessToken } } }) {
            id
            contentTypeName
            data
            layoutData
            name
            contentGroup {
                title
            }
        }
    }
`;

export async function handleGetByRequiredItem(args: getContentItemArgs): Promise<Array<GetContentItemOutput>> {
    const result = await apolloClient.query({
        query: GetContentItemByRequiredItemDocument,
        variables: {
            accessToken: args.magicToken,
        },
    });

    if (result.error) {
        throw new Error("No item found");
    }

    return result.data.ContentItem.map((item) => ({
        id: item.id,
        name: item.name,
        layoutData: item.layoutData,
        data: item.data,
        contentTypeName: item.contentTypeName,
        contentGroupTitle: item.contentGroup.title,
    }));
}

gql`
    query GetUploadAgreement($accessToken: String!) {
        RequiredContentItem(where: { accessToken: { _eq: $accessToken } }) {
            conference {
                configurations(where: { key: { _eq: "UPLOAD_AGREEMENT" } }) {
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
        result.data.RequiredContentItem.length === 1 &&
        result.data.RequiredContentItem[0].conference.configurations.length === 1 &&
        "text" in result.data.RequiredContentItem[0].conference.configurations[0].value
    ) {
        return {
            agreementText: result.data.RequiredContentItem[0].conference.configurations[0].value.text,
        };
    }

    return {};
}
