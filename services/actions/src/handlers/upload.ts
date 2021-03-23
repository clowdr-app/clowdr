import { gql } from "@apollo/client/core";
import {
    ConferenceConfigurationKey,
    EmailTemplate_BaseConfig,
    isEmailTemplate_BaseConfig,
} from "@clowdr-app/shared-types/build/conferenceConfiguration";
import {
    AWSJobStatus,
    ContentBaseType,
    ContentBlob,
    ContentItemDataBlob,
    ContentItemVersionData,
    ContentType_Enum,
    VideoContentBlob,
} from "@clowdr-app/shared-types/build/content";
import { EmailView_SubmissionRequest, EMAIL_TEMPLATE_SUBMISSION_REQUEST } from "@clowdr-app/shared-types/build/email";
import AmazonS3URI from "amazon-s3-uri";
import assert from "assert";
import { htmlToText } from "html-to-text";
import Mustache from "mustache";
import R from "ramda";
import { is } from "typescript-is";
import { v4 as uuidv4 } from "uuid";
import {
    ContentItemAddNewVersionDocument,
    CreateContentItemDocument,
    Email_Insert_Input,
    GetUploadersDocument,
    InsertSubmissionRequestEmailsDocument,
    MarkAndSelectUnprocessedSubmissionRequestEmailJobsDocument,
    RequiredItemDocument,
    RequiredItemFieldsFragment,
    SetRequiredContentItemUploadsRemainingDocument,
    UnmarkSubmissionRequestEmailJobsDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { S3 } from "../lib/aws/awsClient";
import { getConferenceConfiguration } from "../lib/conferenceConfiguration";
import { getLatestVersion } from "../lib/contentItem";
import { callWithRetry } from "../utils";
import { insertEmails } from "./email";

gql`
    query RequiredItem($accessToken: String!) {
        RequiredContentItem(where: { accessToken: { _eq: $accessToken } }) {
            ...RequiredItemFields
            conference {
                configurations(where: { key: { _eq: "UPLOAD_CUTOFF_TIMESTAMP" } }) {
                    id
                    value
                }
            }
        }
    }

    fragment RequiredItemFields on RequiredContentItem {
        id
        contentTypeName
        accessToken
        name
        uploadsRemaining
        isHidden
        conference {
            id
            name
        }
        contentItem {
            id
            data
            contentTypeName
        }
        contentGroup {
            id
            title
        }
    }

    mutation CreateContentItem(
        $conferenceId: uuid!
        $contentGroupId: uuid!
        $contentTypeName: ContentType_enum!
        $data: jsonb!
        $isHidden: Boolean!
        $layoutData: jsonb = null
        $name: String!
        $requiredContentId: uuid!
    ) {
        insert_ContentItem_one(
            object: {
                conferenceId: $conferenceId
                contentGroupId: $contentGroupId
                contentTypeName: $contentTypeName
                data: $data
                isHidden: $isHidden
                layoutData: $layoutData
                name: $name
                requiredContentId: $requiredContentId
            }
            on_conflict: { constraint: ContentItem_requiredContentId_key, update_columns: data }
        ) {
            id
        }
    }
`;

async function checkS3Url(
    url: string
): Promise<{ result: "success"; url: string } | { result: "error"; message: string }> {
    const { region, bucket, key } = AmazonS3URI(url);
    if (region !== process.env.AWS_REGION) {
        return { result: "error", message: "Invalid S3 URL (region mismatch)" };
    }
    if (bucket !== process.env.AWS_CONTENT_BUCKET_ID) {
        return { result: "error", message: "Invalid S3 URL (bucket mismatch)" };
    }
    if (!key) {
        return { result: "error", message: "Invalid S3 URL (missing key)" };
    }

    try {
        await S3.headObject({
            Bucket: bucket,
            Key: key,
        });
    } catch (e) {
        return {
            result: "error",
            message: "Could not retrieve object from S3",
        };
    }

    return { result: "success", url: `s3://${bucket}/${key}` };
}

async function createBlob(inputData: any, contentTypeName: ContentType_Enum): Promise<ContentBlob | { error: string }> {
    switch (contentTypeName) {
        case ContentType_Enum.Abstract:
        case ContentType_Enum.Text:
            if (!inputData.text) {
                return { error: "No text supplied" };
            }
            return {
                baseType: ContentBaseType.Text,
                type: contentTypeName,
                text: inputData.text,
            };
        case ContentType_Enum.ImageFile:
        case ContentType_Enum.PaperFile:
        case ContentType_Enum.PosterFile: {
            if (!inputData.s3Url) {
                return { error: "No S3 URL supplied" };
            }
            const result = await checkS3Url(inputData.s3Url);
            if (result.result === "error") {
                return { error: result.message };
            }
            return {
                baseType: ContentBaseType.File,
                type: contentTypeName,
                s3Url: result.url,
            };
        }
        case ContentType_Enum.ImageUrl:
        case ContentType_Enum.PaperUrl:
        case ContentType_Enum.PosterUrl:
        case ContentType_Enum.VideoUrl:
        case ContentType_Enum.Zoom:
            if (!inputData.url) {
                return { error: "No URL supplied" };
            }
            return {
                baseType: ContentBaseType.URL,
                type: contentTypeName,
                url: inputData.url,
            };
        case ContentType_Enum.Link:
        case ContentType_Enum.LinkButton:
        case ContentType_Enum.PaperLink:
        case ContentType_Enum.VideoLink:
            if (!inputData.url || !inputData.text) {
                return { error: "Text or URL not supplied" };
            }
            return {
                baseType: ContentBaseType.Link,
                type: contentTypeName,
                text: inputData.text,
                url: inputData.url,
            };
        case ContentType_Enum.VideoBroadcast:
        case ContentType_Enum.VideoCountdown:
        case ContentType_Enum.VideoFile:
        case ContentType_Enum.VideoFiller:
        case ContentType_Enum.VideoPrepublish:
        case ContentType_Enum.VideoSponsorsFiller:
        case ContentType_Enum.VideoTitles: {
            if (!inputData.s3Url) {
                return { error: "No S3 URL supplied" };
            }
            const result = await checkS3Url(inputData.s3Url);
            if (result.result === "error") {
                return { error: result.message };
            }
            return {
                baseType: ContentBaseType.Video,
                type: contentTypeName,
                s3Url: result.url,
                subtitles: {},
            };
        }
        case ContentType_Enum.ContentGroupList:
        case ContentType_Enum.WholeSchedule:
            return { error: "Component content item types cannot be uploaded." };
    }
}

interface ItemByToken {
    requiredContentItem: RequiredItemFieldsFragment;
    uploadCutoffTimestamp?: Date;
}

async function getItemByToken(magicToken: string): Promise<ItemByToken | { error: string }> {
    if (!magicToken) {
        return {
            error: "Access token not provided.",
        };
    }

    const response = await apolloClient.query({
        query: RequiredItemDocument,
        variables: {
            accessToken: magicToken,
        },
    });

    if (response.data.RequiredContentItem.length !== 1) {
        return {
            error: "Could not find a required item that matched the request.",
        };
    }

    const requiredContentItem = response.data.RequiredContentItem[0];

    const result: ItemByToken = { requiredContentItem };

    if (requiredContentItem.conference.configurations.length === 1) {
        // UPLOAD_CUTOFF_TIMESTAMP is specified in epoch milliseconds
        result.uploadCutoffTimestamp = new Date(parseInt(requiredContentItem.conference.configurations[0].value));
    }

    return result;
}

gql`
    query GetUploaders($requiredContentItemId: uuid!) {
        Uploader(where: { requiredContentItem: { id: { _eq: $requiredContentItemId } } }) {
            name
            id
            email
        }
    }
`;

async function sendSubmittedEmail(
    requiredContentItemId: string,
    requiredContentItemName: string,
    contentGroupTitle: string,
    conferenceName: string
) {
    const uploaders = await apolloClient.query({
        query: GetUploadersDocument,
        variables: {
            requiredContentItemId,
        },
    });

    const emails: Email_Insert_Input[] = uploaders.data.Uploader.map((uploader) => {
        const htmlContents = `<p>Dear ${uploader.name},</p>
<p>A new version of <em>${requiredContentItemName}</em> (${contentGroupTitle}) was uploaded to ${conferenceName}.</p>
<p>Our systems will now start processing your content. For videos, we will process your video and then auto-generate subtitles.</p>
<p>For video submissions, you will receive two further emails:</p>
<ol>
    <li><b>Within the next hour</b> you should receive the first email, letting you know when we've successfully processed your video.</li>
    <li><b>Within the next 2 hours</b> the second email will let you know subtitles have been generated for your video and are available for editing.</li>
    <li>In the unlikely event that processing your video fails, you will receive an email. You should then forward this to your conference's organising committee to ask for technical assistance.</li>
    <li>Please remember to check your spam/junk folder for emails from us, just in case.</li>
    <li>If you don't receive an update within 4 hours, please contact your conference organisers for technical support.</li>
</ol>
<p>Thank you,<br/>
The Clowdr team
</p>
<p>You are receiving this email because you are listed as an uploader for this item.
This is an automated email sent on behalf of Clowdr CIC. If you believe you have received this
email in error, please contact us via ${process.env.STOP_EMAILS_CONTACT_EMAIL_ADDRESS}.</p>`;

        return {
            emailAddress: uploader.email,
            reason: "item_submitted",
            subject: `Clowdr: Submission RECEIVED: ${requiredContentItemName} to ${conferenceName}`,
            htmlContents,
            plainTextContents: htmlToText(htmlContents),
        };
    });

    await insertEmails(emails);
}

export async function handleContentItemSubmitted(args: submitContentItemArgs): Promise<SubmitContentItemOutput> {
    const itemByToken = await getItemByToken(args.magicToken);
    if ("error" in itemByToken) {
        return {
            success: false,
            message: itemByToken.error,
        };
    }

    const requiredContentItem = itemByToken.requiredContentItem;

    if (requiredContentItem.uploadsRemaining === 0) {
        return {
            success: false,
            message: "No upload attempts remaining",
        };
    }

    if (itemByToken.uploadCutoffTimestamp && itemByToken.uploadCutoffTimestamp < new Date()) {
        return {
            success: false,
            message: "Upload deadline has passed",
        };
    }

    const newVersionData = await createBlob(args.data, requiredContentItem.contentTypeName);
    if ("error" in newVersionData) {
        return {
            success: false,
            message: newVersionData.error,
        };
    }

    if (!requiredContentItem.contentItem) {
        try {
            const data: ContentItemDataBlob = [
                {
                    createdAt: Date.now(),
                    createdBy: "user",
                    data: newVersionData,
                },
            ];
            await apolloClient.mutate({
                mutation: CreateContentItemDocument,
                variables: {
                    conferenceId: requiredContentItem.conference.id,
                    contentGroupId: requiredContentItem.contentGroup.id,
                    contentTypeName: requiredContentItem.contentTypeName,
                    data,
                    isHidden: requiredContentItem.isHidden,
                    layoutData: null,
                    name: requiredContentItem.name,
                    requiredContentId: requiredContentItem.id,
                },
            });

            await sendSubmittedEmail(
                requiredContentItem.id,
                requiredContentItem.name,
                requiredContentItem.contentGroup.title,
                requiredContentItem.conference.name
            );
        } catch (e) {
            console.error("Failed to save new content item", e);
            return {
                success: false,
                message: "Failed to save new item.",
            };
        }
    } else if (requiredContentItem.contentItem.contentTypeName !== requiredContentItem.contentTypeName) {
        return {
            success: false,
            message: "An item of a different type has already been uploaded.",
        };
    } else {
        const { latestVersion } = await getLatestVersion(requiredContentItem.contentItem.id);

        if (newVersionData.type !== latestVersion?.data.type) {
            return {
                success: false,
                message: "An item of a different type has already been uploaded.",
            };
        } else {
            try {
                const newVersion: ContentItemVersionData = {
                    createdAt: Date.now(),
                    createdBy: "user",
                    data: newVersionData,
                };

                await apolloClient.mutate({
                    mutation: ContentItemAddNewVersionDocument,
                    variables: {
                        id: requiredContentItem.contentItem.id,
                        newVersion,
                    },
                });
                await sendSubmittedEmail(
                    requiredContentItem.id,
                    requiredContentItem.name,
                    requiredContentItem.contentGroup.title,
                    requiredContentItem.conference.name
                );
            } catch (e) {
                console.error("Failed to save new version of content item", e);
                return {
                    success: false,
                    message: "Failed to save new version of content item",
                };
            }
        }
    }

    gql`
        mutation SetRequiredContentItemUploadsRemaining($id: uuid!, $uploadsRemaining: Int!) {
            update_RequiredContentItem_by_pk(pk_columns: { id: $id }, _set: { uploadsRemaining: $uploadsRemaining }) {
                id
            }
        }
    `;

    if (requiredContentItem.uploadsRemaining) {
        await apolloClient.mutate({
            mutation: SetRequiredContentItemUploadsRemainingDocument,
            variables: {
                id: requiredContentItem.id,
                uploadsRemaining: R.max(requiredContentItem.uploadsRemaining - 1, 0),
            },
        });
    }

    return {
        success: true,
        message: "",
    };
}

export async function handleUpdateSubtitles(args: updateSubtitlesArgs): Promise<SubmitUpdatedSubtitlesOutput> {
    const itemByToken = await getItemByToken(args.magicToken);
    if ("error" in itemByToken) {
        return {
            success: false,
            message: itemByToken.error,
        };
    }

    const requiredContentItem = itemByToken.requiredContentItem;

    if (!requiredContentItem.contentItem) {
        return {
            message: "No matching content item",
            success: false,
        };
    }

    const { latestVersion } = await getLatestVersion(requiredContentItem.contentItem.id);

    if (!latestVersion) {
        return {
            message: "No existing content item data",
            success: false,
        };
    }

    const newVersion = R.clone(latestVersion);
    newVersion.createdAt = new Date().getTime();
    newVersion.createdBy = "user";
    assert(is<VideoContentBlob>(newVersion.data), "Content item is not a video");

    const bucket = process.env.AWS_CONTENT_BUCKET_ID;
    const key = `${uuidv4()}.srt`;

    try {
        await S3.putObject({
            Bucket: bucket,
            Key: key,
            Body: args.subtitleText,
        });
    } catch (e) {
        console.error("Failed to upload new subtitles", e);
        return {
            message: "Failed to upload new subtitles",
            success: false,
        };
    }

    if (!newVersion.data.subtitles) {
        newVersion.data.subtitles = {};
    }

    newVersion.data.subtitles["en_US"] = {
        s3Url: `s3://${bucket}/${key}`,
        status: AWSJobStatus.Completed,
    };

    try {
        await apolloClient.mutate({
            mutation: ContentItemAddNewVersionDocument,
            variables: {
                id: requiredContentItem.contentItem.id,
                newVersion,
            },
        });
    } catch (e) {
        console.error("Failed to save new content item version", e);
        return {
            message: "Failed to save new content item version",
            success: false,
        };
    }

    return {
        message: "",
        success: true,
    };
}

gql`
    fragment UploaderParts on Uploader {
        id
        conference {
            id
            name
            shortName
        }
        email
        emailsSentCount
        name
        requiredContentItem {
            ...RequiredItemFields
        }
    }

    mutation InsertSubmissionRequestEmails($emails: [Email_insert_input!]!, $uploaderIds: [uuid!]!) {
        insert_Email(objects: $emails) {
            affected_rows
        }
        update_Uploader(where: { id: { _in: $uploaderIds } }, _inc: { emailsSentCount: 1 }) {
            affected_rows
        }
    }
`;

function generateContentTypeFriendlyName(type: ContentType_Enum) {
    switch (type) {
        case ContentType_Enum.Abstract:
            return "Abstract";
        case ContentType_Enum.ContentGroupList:
            return "Content group list";
        case ContentType_Enum.ImageFile:
            return "Image file";
        case ContentType_Enum.ImageUrl:
            return "Image URL";
        case ContentType_Enum.Link:
            return "Link";
        case ContentType_Enum.LinkButton:
            return "Link button";
        case ContentType_Enum.PaperFile:
            return "Paper file";
        case ContentType_Enum.PaperLink:
            return "Paper link";
        case ContentType_Enum.PaperUrl:
            return "Paper URL";
        case ContentType_Enum.PosterFile:
            return "Poster file";
        case ContentType_Enum.PosterUrl:
            return "Poster URL";
        case ContentType_Enum.Text:
            return "Text";
        case ContentType_Enum.VideoBroadcast:
            return "Video for broadcast";
        case ContentType_Enum.VideoCountdown:
            return "Video countdown";
        case ContentType_Enum.VideoFile:
            return "Video file";
        case ContentType_Enum.VideoFiller:
            return "Filler video";
        case ContentType_Enum.VideoLink:
            return "Link to video";
        case ContentType_Enum.VideoPrepublish:
            return "Video for pre-publication";
        case ContentType_Enum.VideoSponsorsFiller:
            return "Sponsors filler video";
        case ContentType_Enum.VideoTitles:
            return "Pre-roll titles video";
        case ContentType_Enum.VideoUrl:
            return "Video URL";
        case ContentType_Enum.WholeSchedule:
            return "Whole schedule";
        case ContentType_Enum.Zoom:
            return "Zoom Meeting URL";
    }
}

gql`
    mutation MarkAndSelectUnprocessedSubmissionRequestEmailJobs {
        update_job_queues_SubmissionRequestEmailJob(where: { processed: { _eq: false } }, _set: { processed: true }) {
            returning {
                id
                emailTemplate
                uploader {
                    ...UploaderParts
                }
            }
        }
    }

    mutation UnmarkSubmissionRequestEmailJobs($ids: [uuid!]!) {
        update_job_queues_SubmissionRequestEmailJob(where: { id: { _in: $ids } }, _set: { processed: false }) {
            affected_rows
        }
    }
`;

export async function processSendSubmissionRequestsJobQueue(): Promise<void> {
    const jobsToProcess = await apolloClient.mutate({
        mutation: MarkAndSelectUnprocessedSubmissionRequestEmailJobsDocument,
        variables: {},
    });
    assert(jobsToProcess.data?.update_job_queues_SubmissionRequestEmailJob, "Failed to fetch jobs to process.");

    const emails: Email_Insert_Input[] = [];
    const uploaderIds: string[] = [];
    for (const job of jobsToProcess.data.update_job_queues_SubmissionRequestEmailJob.returning) {
        const contentTypeFriendlyName = generateContentTypeFriendlyName(
            job.uploader.requiredContentItem.contentTypeName
        );

        let emailTemplates: EmailTemplate_BaseConfig | null = await getConferenceConfiguration(
            job.uploader.conference.id,
            ConferenceConfigurationKey.EmailTemplate_SubmissionRequest
        );

        if (!isEmailTemplate_BaseConfig(emailTemplates)) {
            emailTemplates = null;
        }

        const uploadLink = `${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/upload/${job.uploader.requiredContentItem.id}/${job.uploader.requiredContentItem.accessToken}`;

        const view: EmailView_SubmissionRequest = {
            uploader: {
                name: job.uploader.name,
            },
            file: {
                name: job.uploader.requiredContentItem.name,
                typeName: contentTypeFriendlyName,
            },
            conference: {
                name: job.uploader.conference.name,
                shortName: job.uploader.conference.shortName,
            },
            item: {
                title: job.uploader.requiredContentItem.contentGroup.title,
            },
            uploadLink,
        };

        const overrideEmailTemplate: EmailTemplate_BaseConfig | null = isEmailTemplate_BaseConfig(job.emailTemplate)
            ? job.emailTemplate
            : null;

        const htmlBody = Mustache.render(
            overrideEmailTemplate?.htmlBodyTemplate ??
                emailTemplates?.htmlBodyTemplate ??
                EMAIL_TEMPLATE_SUBMISSION_REQUEST.htmlBodyTemplate,
            view
        );

        const subject = Mustache.render(
            overrideEmailTemplate?.subjectTemplate ??
                emailTemplates?.subjectTemplate ??
                EMAIL_TEMPLATE_SUBMISSION_REQUEST.subjectTemplate,
            view
        );

        const htmlContents = `${htmlBody}
<p>You are receiving this email because you are listed as an uploader for this item.
This is an automated email sent on behalf of Clowdr CIC. If you believe you have received this
email in error, please contact us via ${process.env.STOP_EMAILS_CONTACT_EMAIL_ADDRESS}.</p>`;

        const newEmail: Email_Insert_Input = {
            emailAddress: job.uploader.email,
            htmlContents,
            plainTextContents: htmlToText(htmlContents),
            reason: "upload-request",
            subject,
        };
        emails.push(newEmail);
        uploaderIds.push(job.uploader.id);
    }

    try {
        await apolloClient.mutate({
            mutation: InsertSubmissionRequestEmailsDocument,
            variables: {
                emails: emails,
                uploaderIds: uploaderIds,
            },
        });
    } catch (e) {
        console.error(
            `Could not process jobs: ${jobsToProcess.data.update_job_queues_SubmissionRequestEmailJob.returning.reduce(
                (acc, x) => `${acc}, ${x}`,
                ""
            )}:\n${e.toString()}`
        );

        try {
            const jobIds = jobsToProcess.data.update_job_queues_SubmissionRequestEmailJob.returning.map((x) => x.id);
            await callWithRetry(async () => {
                await apolloClient.mutate({
                    mutation: UnmarkSubmissionRequestEmailJobsDocument,
                    variables: {
                        ids: jobIds,
                    },
                });
            });
        } catch (e) {
            console.error(`Could not unmark failed emails: ${e.toString()}`);
        }
    }
}
