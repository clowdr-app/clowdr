import { gql } from "@apollo/client/core";
import {
    EmailTemplate_BaseConfig,
    isEmailTemplate_BaseConfig,
} from "@clowdr-app/shared-types/build/conferenceConfiguration";
import {
    AWSJobStatus,
    Content_ElementType_Enum,
    ElementBaseType,
    ElementBlob,
    ElementVersionData,
    VideoElementBlob,
} from "@clowdr-app/shared-types/build/content";
import { EmailView_SubmissionRequest, EMAIL_TEMPLATE_SUBMISSION_REQUEST } from "@clowdr-app/shared-types/build/email";
import AmazonS3URI from "amazon-s3-uri";
import assert from "assert";
import Mustache from "mustache";
import R from "ramda";
import { is } from "typescript-is";
import { v4 as uuidv4 } from "uuid";
import {
    Conference_ConfigurationKey_Enum,
    ElementAddNewVersionDocument,
    Email_Insert_Input,
    GetUploadersDocument,
    InsertSubmissionRequestEmailsDocument,
    MarkAndSelectUnprocessedSubmissionRequestEmailJobsDocument,
    SetUploadableElementUploadsRemainingDocument,
    UnmarkSubmissionRequestEmailJobsDocument,
    UploadableElementDocument,
    UploadableElementFieldsFragment,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { S3 } from "../lib/aws/awsClient";
import { getConferenceConfiguration } from "../lib/conferenceConfiguration";
import { extractLatestVersion } from "../lib/element";
import { callWithRetry } from "../utils";
import { insertEmails } from "./email";

gql`
    query UploadableElement($accessToken: String!) {
        content_Element(where: { accessToken: { _eq: $accessToken } }) {
            ...UploadableElementFields
            conference {
                configurations(where: { key: { _eq: UPLOAD_CUTOFF_TIMESTAMP } }) {
                    conferenceId
                    key
                    value
                }
            }
        }
    }

    fragment UploadableElementPermissionGrantFields on content_ElementPermissionGrant {
        id
        permissionSetId
        groupId
        entityId
        conferenceSlug
    }

    fragment UploadableElementFields on content_Element {
        id
        typeName
        accessToken
        name
        uploadsRemaining
        isHidden
        data
        conference {
            id
            name
        }
        item {
            id
            title
        }
        permissionGrants {
            ...UploadableElementPermissionGrantFields
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

async function createBlob(
    inputData: any,
    typeName: Content_ElementType_Enum
): Promise<ElementBlob | { error: string }> {
    switch (typeName) {
        case Content_ElementType_Enum.Abstract:
        case Content_ElementType_Enum.Text:
            if (!inputData.text) {
                return { error: "No text supplied" };
            }
            return {
                baseType: ElementBaseType.Text,
                type: typeName,
                text: inputData.text,
            };
        case Content_ElementType_Enum.ImageFile:
        case Content_ElementType_Enum.PaperFile:
        case Content_ElementType_Enum.PosterFile: {
            if (!inputData.s3Url) {
                return { error: "No S3 URL supplied" };
            }
            const result = await checkS3Url(inputData.s3Url);
            if (result.result === "error") {
                return { error: result.message };
            }
            return {
                baseType: ElementBaseType.File,
                type: typeName,
                s3Url: result.url,
            };
        }
        case Content_ElementType_Enum.ImageUrl:
        case Content_ElementType_Enum.PaperUrl:
        case Content_ElementType_Enum.PosterUrl:
        case Content_ElementType_Enum.VideoUrl:
        case Content_ElementType_Enum.Zoom:
            if (!inputData.url) {
                return { error: "No URL supplied" };
            }
            return {
                baseType: ElementBaseType.URL,
                type: typeName,
                url: inputData.url,
            };
        case Content_ElementType_Enum.Link:
        case Content_ElementType_Enum.LinkButton:
        case Content_ElementType_Enum.PaperLink:
        case Content_ElementType_Enum.VideoLink:
            if (!inputData.url || !inputData.text) {
                return { error: "Text or URL not supplied" };
            }
            return {
                baseType: ElementBaseType.Link,
                type: typeName,
                text: inputData.text,
                url: inputData.url,
            };
        case Content_ElementType_Enum.VideoBroadcast:
        case Content_ElementType_Enum.VideoCountdown:
        case Content_ElementType_Enum.VideoFile:
        case Content_ElementType_Enum.VideoFiller:
        case Content_ElementType_Enum.VideoPrepublish:
        case Content_ElementType_Enum.VideoSponsorsFiller:
        case Content_ElementType_Enum.VideoTitles: {
            if (!inputData.s3Url) {
                return { error: "No S3 URL supplied" };
            }
            const result = await checkS3Url(inputData.s3Url);
            if (result.result === "error") {
                return { error: result.message };
            }
            return {
                baseType: ElementBaseType.Video,
                type: typeName,
                s3Url: result.url,
                subtitles: {},
            };
        }
        case Content_ElementType_Enum.ContentGroupList:
        case Content_ElementType_Enum.WholeSchedule:
        case Content_ElementType_Enum.ExploreProgramButton:
        case Content_ElementType_Enum.ExploreScheduleButton:
        case Content_ElementType_Enum.LiveProgramRooms:
        case Content_ElementType_Enum.ActiveSocialRooms:
        case Content_ElementType_Enum.Divider:
        case Content_ElementType_Enum.SponsorBooths:
            return { error: "Component elements cannot be uploaded." };
    }
}

interface ItemByToken {
    uploadableElement: UploadableElementFieldsFragment;
    uploadCutoffTimestamp?: Date;
}

async function getItemByToken(magicToken: string): Promise<ItemByToken | { error: string }> {
    if (!magicToken) {
        return {
            error: "Access token not provided.",
        };
    }

    const response = await apolloClient.query({
        query: UploadableElementDocument,
        variables: {
            accessToken: magicToken,
        },
    });

    if (response.data.content_Element.length !== 1) {
        return {
            error: "Could not find an element that matched the request.",
        };
    }

    const element = response.data.content_Element[0];

    const result: ItemByToken = { uploadableElement: element };

    if (element.conference.configurations.length === 1) {
        // UPLOAD_CUTOFF_TIMESTAMP is specified in epoch milliseconds
        result.uploadCutoffTimestamp = new Date(parseInt(element.conference.configurations[0].value));
    }

    return result;
}

gql`
    query GetUploaders($elementId: uuid!) {
        content_Uploader(where: { elementId: { _eq: $elementId } }) {
            name
            id
            email
            conferenceId
        }
    }
`;

async function sendSubmittedEmail(
    elementId: string,
    uploadableElementName: string,
    itemTitle: string,
    conferenceName: string
) {
    const uploaders = await apolloClient.query({
        query: GetUploadersDocument,
        variables: {
            elementId,
        },
    });

    if (uploaders.data.content_Uploader.length > 0) {
        const emails: Email_Insert_Input[] = uploaders.data.content_Uploader.map((uploader) => {
            const htmlContents = `<p>Dear ${uploader.name},</p>
<p>A new version of <em>${uploadableElementName}</em> (${itemTitle}) was uploaded to ${conferenceName}.</p>
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
The Midspace team
</p>
<p>You are receiving this email because you are listed as an uploader for this item.</p>`;

            return {
                recipientName: uploader.name,
                emailAddress: uploader.email,
                reason: "item_submitted",
                subject: `Midspace: Submission RECEIVED: ${uploadableElementName} to ${conferenceName}`,
                htmlContents,
            };
        });

        await insertEmails(emails, uploaders.data.content_Uploader[0].conferenceId);
    }
}

export async function handleElementSubmitted(args: submitElementArgs): Promise<SubmitElementOutput> {
    const itemByToken = await getItemByToken(args.magicToken);
    if ("error" in itemByToken) {
        return {
            success: false,
            message: itemByToken.error,
        };
    }

    const uploadableElement = itemByToken.uploadableElement;

    if (uploadableElement.uploadsRemaining === 0) {
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

    const newVersionData = await createBlob(args.data, uploadableElement.typeName);
    if ("error" in newVersionData) {
        return {
            success: false,
            message: newVersionData.error,
        };
    }

    if (newVersionData.type !== uploadableElement.typeName) {
        return {
            success: false,
            message: "Uploaded item type does not match required type.",
        };
    }

    const latestVersion = extractLatestVersion(uploadableElement.id);

    if (latestVersion && newVersionData.type !== latestVersion.data.type) {
        return {
            success: false,
            message: "An item of a different type has already been uploaded.",
        };
    } else {
        try {
            const newVersion: ElementVersionData = {
                createdAt: Date.now(),
                createdBy: "user",
                data: newVersionData,
            };

            await apolloClient.mutate({
                mutation: ElementAddNewVersionDocument,
                variables: {
                    id: uploadableElement.id,
                    newVersion,
                },
            });
            await sendSubmittedEmail(
                uploadableElement.id,
                uploadableElement.name,
                uploadableElement.item.title,
                uploadableElement.conference.name
            );
        } catch (e) {
            console.error("Failed to save new version of content item", e);
            return {
                success: false,
                message: "Failed to save new version of content item",
            };
        }
    }

    gql`
        mutation SetUploadableElementUploadsRemaining($id: uuid!, $uploadsRemaining: Int!) {
            update_content_Element_by_pk(pk_columns: { id: $id }, _set: { uploadsRemaining: $uploadsRemaining }) {
                id
            }
        }
    `;

    if (uploadableElement.uploadsRemaining) {
        await apolloClient.mutate({
            mutation: SetUploadableElementUploadsRemainingDocument,
            variables: {
                id: uploadableElement.id,
                uploadsRemaining: R.max(uploadableElement.uploadsRemaining - 1, 0),
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

    const uploadableElement = itemByToken.uploadableElement;

    if (!uploadableElement) {
        return {
            message: "No matching content item",
            success: false,
        };
    }

    const latestVersion = extractLatestVersion(uploadableElement.data);

    if (!latestVersion) {
        return {
            message: "No existing content item data",
            success: false,
        };
    }

    const newVersion = R.clone(latestVersion);
    newVersion.createdAt = new Date().getTime();
    newVersion.createdBy = "user";
    assert(is<VideoElementBlob>(newVersion.data), "Content item is not a video");

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
            mutation: ElementAddNewVersionDocument,
            variables: {
                id: uploadableElement.id,
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
    fragment UploaderParts on content_Uploader {
        id
        conference {
            id
            name
            shortName
        }
        email
        emailsSentCount
        name
        element {
            ...UploadableElementFields
        }
    }

    mutation InsertSubmissionRequestEmails($uploaderIds: [uuid!]!) {
        update_content_Uploader(where: { id: { _in: $uploaderIds } }, _inc: { emailsSentCount: 1 }) {
            affected_rows
        }
    }
`;

function generateContentTypeFriendlyName(type: Content_ElementType_Enum) {
    switch (type) {
        case Content_ElementType_Enum.Abstract:
            return "Abstract";
        case Content_ElementType_Enum.ContentGroupList:
            return "Content group list";
        case Content_ElementType_Enum.ImageFile:
            return "Image file";
        case Content_ElementType_Enum.ImageUrl:
            return "Image URL";
        case Content_ElementType_Enum.Link:
            return "Link";
        case Content_ElementType_Enum.LinkButton:
            return "Link button";
        case Content_ElementType_Enum.PaperFile:
            return "Paper file";
        case Content_ElementType_Enum.PaperLink:
            return "Paper link";
        case Content_ElementType_Enum.PaperUrl:
            return "Paper URL";
        case Content_ElementType_Enum.PosterFile:
            return "Poster file";
        case Content_ElementType_Enum.PosterUrl:
            return "Poster URL";
        case Content_ElementType_Enum.Text:
            return "Text";
        case Content_ElementType_Enum.VideoBroadcast:
            return "Video for broadcast";
        case Content_ElementType_Enum.VideoCountdown:
            return "Video countdown";
        case Content_ElementType_Enum.VideoFile:
            return "Video file";
        case Content_ElementType_Enum.VideoFiller:
            return "Filler video";
        case Content_ElementType_Enum.VideoLink:
            return "Link to video";
        case Content_ElementType_Enum.VideoPrepublish:
            return "Video for pre-publication";
        case Content_ElementType_Enum.VideoSponsorsFiller:
            return "Sponsors filler video";
        case Content_ElementType_Enum.VideoTitles:
            return "Pre-roll titles video";
        case Content_ElementType_Enum.VideoUrl:
            return "Video URL";
        case Content_ElementType_Enum.WholeSchedule:
            return "Whole schedule";
        case Content_ElementType_Enum.Zoom:
            return "Zoom";
        case Content_ElementType_Enum.ActiveSocialRooms:
            return "Active social rooms";
        case Content_ElementType_Enum.LiveProgramRooms:
            return "Live program rooms";
        case Content_ElementType_Enum.Divider:
            return "Divider";
        case Content_ElementType_Enum.SponsorBooths:
            return "Sponsor booths";
        case Content_ElementType_Enum.ExploreProgramButton:
            return "Explore program button";
        case Content_ElementType_Enum.ExploreScheduleButton:
            return "Explore schedule button";
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

    const emails = new Map<string, { email: Email_Insert_Input; uploaderId: string; jobId: string }[]>();
    for (const job of jobsToProcess.data.update_job_queues_SubmissionRequestEmailJob.returning) {
        const contentTypeFriendlyName = generateContentTypeFriendlyName(job.uploader.element.typeName);

        let emailTemplates: EmailTemplate_BaseConfig | null = await getConferenceConfiguration(
            job.uploader.conference.id,
            Conference_ConfigurationKey_Enum.EmailTemplateSubmissionRequest
        );

        if (!isEmailTemplate_BaseConfig(emailTemplates)) {
            emailTemplates = null;
        }

        const uploadLink = `{[FRONTEND_HOST]}/upload/${job.uploader.element.id}/${job.uploader.element.accessToken}`;

        const view: EmailView_SubmissionRequest = {
            uploader: {
                name: job.uploader.name,
            },
            file: {
                name: job.uploader.element.name,
                typeName: contentTypeFriendlyName,
            },
            conference: {
                name: job.uploader.conference.name,
                shortName: job.uploader.conference.shortName,
            },
            item: {
                title: job.uploader.element.item.title,
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
<p>You are receiving this email because you are listed as an uploader for this item.</p>`;

        const newEmail: Email_Insert_Input = {
            recipientName: job.uploader.name,
            emailAddress: job.uploader.email,
            htmlContents,
            reason: "upload-request",
            subject,
        };

        let arr = emails.get(job.uploader.conference.id);
        if (!arr) {
            arr = [];
            emails.set(job.uploader.conference.id, arr);
        }
        arr.push({ email: newEmail, uploaderId: job.uploader.id, jobId: job.id });
    }

    emails.forEach(async (emailsRecords, conferenceId) => {
        try {
            await insertEmails(
                emailsRecords.map((x) => x.email),
                conferenceId
            );
            await apolloClient.mutate({
                mutation: InsertSubmissionRequestEmailsDocument,
                variables: {
                    uploaderIds: emailsRecords.map((x) => x.uploaderId),
                },
            });
        } catch (e) {
            console.error(
                `Could not process jobs: ${emailsRecords
                    .map((x) => x.jobId)
                    .reduce((acc, x) => `${acc}, ${x}`, "")}:\n${e.toString()}`
            );

            try {
                const jobIds = emailsRecords.map((x) => x.jobId);
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
    });
}
