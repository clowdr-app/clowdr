import { gql } from "@apollo/client/core";
import { AWSJobStatus } from "@clowdr-app/shared-types/build/content";
import assert from "assert";
import { htmlToText } from "html-to-text";
import R from "ramda";
import {
    ContentItemAddNewVersionDocument,
    Email_Insert_Input,
    GetContentItemByRequiredItemDocument,
    GetContentItemDetailsDocument,
    GetRequiredContentItemDocument,
    GetUploadAgreementDocument,
    GetUploadersForContentItemDocument,
    InsertEmailsDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { startPreviewTranscode } from "../lib/transcode";
import { startTranscribe } from "../lib/transcribe";
import { ContentItemData, Payload } from "../types/event";

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
        (oldVersion && oldVersion.data.baseType === "video" && oldVersion.data.s3Url !== currentVersion.data.s3Url) ||
        (!oldVersion && currentVersion.data.s3Url)
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
            oldVersion.data.transcode?.s3Url !== currentVersion.data.transcode.s3Url) ||
        (!oldVersion && currentVersion.data.transcode?.s3Url)
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
            await sendTranscriptionEmail(newRow.id, newRow.name);
        }
    }

    if (
        oldVersion &&
        oldVersion.data.baseType === "video" &&
        oldVersion.data.subtitles["en_US"]?.status !== "FAILED" &&
        currentVersion.data.subtitles["en_US"]?.status === "FAILED"
    ) {
        await sendTranscriptionFailedEmail(newRow.id, newRow.name);
    }

    if (
        (oldVersion &&
            oldVersion.data.baseType === "video" &&
            oldVersion.data.transcode?.status !== "FAILED" &&
            currentVersion.data.transcode?.status === "FAILED") ||
        (!oldVersion && currentVersion.data.transcode?.status === "FAILED")
    ) {
        await sendTranscodeFailedEmail(
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
            conference {
                name
            }
            contentGroup {
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

async function sendTranscriptionEmail(contentItemId: string, contentItemName: string) {
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
            <p>We automatically generated subtitles for your item <em>${contentItemName}</em> (${contentItemDetails.data.ContentItem_by_pk?.contentGroup.title}) at ${contentItemDetails.data.ContentItem_by_pk?.conference.name}. You can now review and edit them.</p>
            <p><a href="${magicItemLink}">View and edit subtitles</a></p>
            <p>You are receiving this email because you are listed as an uploader for this item.
            This is an automated email sent on behalf of Clowdr CIC. If you believe you have received this
            email in error, please contact us via ${process.env.STOP_EMAILS_CONTACT_EMAIL_ADDRESS}.</p>`;

        return {
            emailAddress: uploader.email,
            reason: "item_transcription_succeeded",
            subject: `Clowdr: generated subtitles for item ${contentItemName} at ${contentItemDetails.data.ContentItem_by_pk?.conference.name}`,
            htmlContents,
            plainTextContents: htmlToText(htmlContents),
        };
    });

    await apolloClient.mutate({
        mutation: InsertEmailsDocument,
        variables: {
            objects: emails,
        },
    });
}

async function sendTranscriptionFailedEmail(contentItemId: string, contentItemName: string) {
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
            <p>There was a problem during automatic subtitle generation for your item <em>${contentItemName}</em> (${contentItemDetails.data.ContentItem_by_pk?.contentGroup.title}) at ${contentItemDetails.data.ContentItem_by_pk?.conference.name}.</p>
            <p><a href="${magicItemLink}">Manually add subtitles</a></p>
            <p>You are receiving this email because you are listed as an uploader for this item.
            This is an automated email sent on behalf of Clowdr CIC. If you believe you have received this
            email in error, please contact us via ${process.env.STOP_EMAILS_CONTACT_EMAIL_ADDRESS}.</p>`;

        return {
            emailAddress: uploader.email,
            reason: "item_transcription_failed",
            subject: `Clowdr: failed to generate subtitles for item ${contentItemName} at ${contentItemDetails.data.ContentItem_by_pk?.conference.name}`,
            htmlContents,
            plainTextContents: htmlToText(htmlContents),
        };
    });

    await apolloClient.mutate({
        mutation: InsertEmailsDocument,
        variables: {
            objects: emails,
        },
    });
}

async function sendTranscodeFailedEmail(contentItemId: string, contentItemName: string, message: string) {
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
            <p>There was a problem while processing your item <em>${contentItemName}</em> (${contentItemDetails.data.ContentItem_by_pk?.contentGroup.title}) at ${contentItemDetails.data.ContentItem_by_pk?.conference.name}.</p>
            <p>Details: ${message}</p>
            <p><a href="${magicItemLink}">Try uploading a new version</a></p>
            <p>You are receiving this email because you are listed as an uploader for this item.
            This is an automated email sent on behalf of Clowdr CIC. If you believe you have received this
            email in error, please contact us via ${process.env.STOP_EMAILS_CONTACT_EMAIL_ADDRESS}.</p>`;

        return {
            emailAddress: uploader.email,
            reason: "item_transcode_failed",
            subject: `Clowdr: failed to process item ${contentItemName} at ${contentItemDetails.data.ContentItem_by_pk?.conference.name}`,
            htmlContents,
            plainTextContents: htmlToText(htmlContents),
        };
    });

    await apolloClient.mutate({
        mutation: InsertEmailsDocument,
        variables: {
            objects: emails,
        },
    });
}

gql`
    query GetContentItemByRequiredItem($accessToken: String!) {
        ContentItem(where: { requiredContentItem: { accessToken: { _eq: $accessToken } } }) {
            id
            contentTypeName
            data
            layoutData
            name
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
