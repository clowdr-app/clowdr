import { gql } from "@apollo/client/core";
import {
    EmailTemplate_BaseConfig,
    isEmailTemplate_BaseConfig,
} from "@clowdr-app/shared-types/build/conferenceConfiguration";
import {
    AudioElementBlob,
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
import { compile } from "handlebars";
import R from "ramda";
import { is } from "typescript-is";
import { v4 as uuidv4, v5 as uuidv5 } from "uuid";
import {
    CompleteSubmissionRequestEmailJobsDocument,
    Conference_ConfigurationKey_Enum,
    ElementAddNewVersionDocument,
    Email_Insert_Input,
    GetUploadersDocument,
    InsertSubmissionRequestEmailsDocument,
    SelectUnprocessedSubmissionRequestEmailJobsDocument,
    SetUploadableElementUploadsRemainingDocument,
    UploadableElementDocument,
    UploadableElementFieldsFragment,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { S3 } from "../lib/aws/awsClient";
import { getConferenceConfiguration, getSubmissionNotificationRoles } from "../lib/conferenceConfiguration";
import { extractLatestVersion } from "../lib/element";
import { EMAIL_IDEMPOTENCY_NAMESPACE, insertEmails } from "./email";

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
                altText: inputData.altText,
            };
        }
        case Content_ElementType_Enum.AudioUrl:
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
                title: inputData.title,
            };
        case Content_ElementType_Enum.AudioLink:
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
        case Content_ElementType_Enum.AudioFile: {
            if (!inputData.s3Url) {
                return { error: "No S3 URL supplied" };
            }
            const result = await checkS3Url(inputData.s3Url);
            if (result.result === "error") {
                return { error: result.message };
            }
            return {
                baseType: ElementBaseType.Audio,
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
        content_Element_by_pk(id: $elementId) {
            id
            conferenceId
            conference {
                ...Configuration_SubmissionNotificationRoles
            }
            typeName
            item {
                id
                itemPeople(where: { person: { _and: [{ email: { _is_null: false } }, { email: { _neq: "" } }] } }) {
                    id
                    person {
                        id
                        name
                        email
                    }
                    roleName
                }
            }
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

    if (uploaders.data.content_Element_by_pk?.item.itemPeople.length) {
        const submissionNotificationRoles = getSubmissionNotificationRoles(
            uploaders.data.content_Element_by_pk.conference
        );
        let emails: Email_Insert_Input[];
        if (
            uploaders.data.content_Element_by_pk.typeName === Content_ElementType_Enum.VideoBroadcast ||
            uploaders.data.content_Element_by_pk.typeName === Content_ElementType_Enum.VideoCountdown ||
            uploaders.data.content_Element_by_pk.typeName === Content_ElementType_Enum.VideoFile ||
            uploaders.data.content_Element_by_pk.typeName === Content_ElementType_Enum.VideoFiller ||
            uploaders.data.content_Element_by_pk.typeName === Content_ElementType_Enum.VideoTitles ||
            uploaders.data.content_Element_by_pk.typeName === Content_ElementType_Enum.VideoPrepublish ||
            uploaders.data.content_Element_by_pk.typeName === Content_ElementType_Enum.VideoSponsorsFiller
        ) {
            emails = uploaders.data.content_Element_by_pk.item.itemPeople
                .filter((p) => submissionNotificationRoles.includes(p.roleName))
                .map(({ person }) => {
                    const htmlContents = `<p>Dear ${person.name},</p>
        <p>A new version of <em>${uploadableElementName}</em> (${itemTitle}) was uploaded to ${conferenceName}.</p>
        <p>Our systems will now start processing your video and then auto-generate subtitles.</p>
        <ol>
            <li><b>Within the next 2 hours</b> you will receive an email to let you know subtitles have been generated for your video and are available for editing.</li>
            <li>In the unlikely event that processing your video fails, you will receive an email. You should then forward this to your conference's organising committee to ask for technical assistance.</li>
            <li>Please remember to check your spam/junk folder for emails from us.</li>
            <li>If you don't receive an update within 4 hours, please contact us for technical support.</li>
        </ol>`;

                    return {
                        recipientName: person.name,
                        emailAddress: person.email,
                        reason: "item_submitted",
                        subject: `Submission RECEIVED: ${uploadableElementName} to ${conferenceName}`,
                        htmlContents,
                    };
                });
        } else {
            emails = uploaders.data.content_Element_by_pk.item.itemPeople.map(({ person }) => {
                const htmlContents = `<p>Dear ${person.name},</p>
    <p>A new version of <em>${uploadableElementName}</em> (${itemTitle}) was uploaded to ${conferenceName} and it will now be included in the conference.</p>`;

                return {
                    recipientName: person.name,
                    emailAddress: person.email,
                    reason: "item_submitted",
                    subject: `Submission RECEIVED: ${uploadableElementName} to ${conferenceName}`,
                    htmlContents,
                };
            });
        }

        await insertEmails(emails, uploaders.data.content_Element_by_pk.conferenceId, undefined);
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
            message: "Submission deadline has passed",
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
    assert(
        is<VideoElementBlob>(newVersion.data) || is<AudioElementBlob>(newVersion.data),
        "Content item is not a video or audio file."
    );

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

    mutation InsertSubmissionRequestEmails($uploaderIds: [uuid!]!, $personIds: [uuid!]!) {
        update_content_Uploader(where: { id: { _in: $uploaderIds } }, _inc: { emailsSentCount: 1 }) {
            affected_rows
        }
        update_collection_ProgramPerson(where: { id: { _in: $personIds } }, _inc: { submissionRequestsSentCount: 1 }) {
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
        case Content_ElementType_Enum.AudioFile:
            return "Audio file";
        case Content_ElementType_Enum.AudioLink:
            return "Audio link";
        case Content_ElementType_Enum.AudioUrl:
            return "Audio URL";
    }
}

gql`
    query SelectUnprocessedSubmissionRequestEmailJobs {
        job_queues_SubmissionRequestEmailJob(where: { processed: { _eq: false } }) {
            id
            emailTemplate
            uploader {
                ...UploaderParts
            }
            person {
                id
                name
                email
                accessToken
                conference {
                    id
                    name
                    shortName
                }
            }
        }
    }

    mutation CompleteSubmissionRequestEmailJobs($ids: [uuid!]!) {
        update_job_queues_SubmissionRequestEmailJob(where: { id: { _in: $ids } }, _set: { processed: true }) {
            affected_rows
        }
    }
`;

function isNotUndefined<T>(x: T | undefined): x is T {
    if (x === undefined) {
        return false;
    }
    return true;
}

type SubmissionRequestEmail = { email: Email_Insert_Input; jobId: string } & (
    | { uploaderId: string }
    | { personId: string }
);

/** @summary Generate an idempotency key that uniquely identifies each email in a submission request job. */
function generateIdempotencyKey(jobId: string): string {
    return uuidv5(`invite-email,${jobId}`, EMAIL_IDEMPOTENCY_NAMESPACE);
}

export async function processSendSubmissionRequestsJobQueue(): Promise<void> {
    const jobsToProcess = await apolloClient.mutate({
        mutation: SelectUnprocessedSubmissionRequestEmailJobsDocument,
        variables: {},
    });
    assert(jobsToProcess.data?.job_queues_SubmissionRequestEmailJob, "Failed to fetch jobs to process.");

    const emails = new Map<string, SubmissionRequestEmail[]>();
    for (const job of jobsToProcess.data.job_queues_SubmissionRequestEmailJob) {
        let result: SubmissionRequestEmail | undefined;
        let conferenceId: string | undefined;

        if (job.uploader) {
            const contentTypeFriendlyName = generateContentTypeFriendlyName(job.uploader.element.typeName);
            const uploadLink = `{{frontendHost}}/upload/${job.uploader.element.id}/${job.uploader.element.accessToken}`;
            const context: EmailView_SubmissionRequest = {
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

            const emailTemplate: EmailTemplate_BaseConfig | null = isEmailTemplate_BaseConfig(job.emailTemplate)
                ? job.emailTemplate
                : await getConferenceConfiguration<EmailTemplate_BaseConfig>(
                      job.uploader.conference.id,
                      Conference_ConfigurationKey_Enum.EmailTemplateSubmissionRequest
                  );

            const bodyTemplate = compile(
                emailTemplate?.htmlBodyTemplate ?? EMAIL_TEMPLATE_SUBMISSION_REQUEST.htmlBodyTemplate
            );
            const subjectTemplate = compile(
                emailTemplate?.subjectTemplate ?? EMAIL_TEMPLATE_SUBMISSION_REQUEST.subjectTemplate
            );

            const htmlBody = bodyTemplate(context);
            const subject = subjectTemplate(context);

            const newEmail: Email_Insert_Input = {
                recipientName: job.uploader.name,
                emailAddress: job.uploader.email,
                htmlContents: htmlBody,
                reason: "upload-request",
                subject,
                idempotencyKey: generateIdempotencyKey(job.id),
            };
            conferenceId = job.uploader.conference.id;

            result = { email: newEmail, uploaderId: job.uploader.id, jobId: job.id };
        } else if (job.person) {
            const uploadLink = `{{frontendHost}}/submissions/${job.person.accessToken}`;

            const context: EmailView_SubmissionRequest = {
                person: {
                    name: job.person.name,
                },
                conference: {
                    name: job.person.conference.name,
                    shortName: job.person.conference.shortName,
                },
                uploadLink,
            };

            const emailTemplate: EmailTemplate_BaseConfig | null = isEmailTemplate_BaseConfig(job.emailTemplate)
                ? job.emailTemplate
                : await getConferenceConfiguration<EmailTemplate_BaseConfig>(
                      job.person.conference.id,
                      Conference_ConfigurationKey_Enum.EmailTemplateSubmissionRequest
                  );

            const bodyTemplate = compile(
                emailTemplate?.htmlBodyTemplate ?? EMAIL_TEMPLATE_SUBMISSION_REQUEST.htmlBodyTemplate
            );
            const subjectTemplate = compile(
                emailTemplate?.subjectTemplate ?? EMAIL_TEMPLATE_SUBMISSION_REQUEST.subjectTemplate
            );

            const htmlBody = bodyTemplate(context);
            const subject = subjectTemplate(context);

            const newEmail: Email_Insert_Input = {
                recipientName: job.person.name,
                emailAddress: job.person.email,
                htmlContents: htmlBody,
                reason: "upload-request",
                subject,
                idempotencyKey: generateIdempotencyKey(job.id),
            };
            conferenceId = job.person.conference.id;

            result = { email: newEmail, personId: job.person.id, jobId: job.id };
        }

        if (result && conferenceId) {
            let arr = emails.get(conferenceId);
            if (!arr) {
                arr = [];
                emails.set(conferenceId, arr);
            }
            arr.push(result);
        }
    }

    emails.forEach(async (emailsRecords, conferenceId) => {
        try {
            const emailsToInsert = emailsRecords.map((x) => x.email).filter(isNotUndefined);
            if (emailsToInsert.length > 0) {
                await insertEmails(emailsToInsert, conferenceId, undefined);
            }

            await apolloClient.mutate({
                mutation: InsertSubmissionRequestEmailsDocument,
                variables: {
                    uploaderIds: emailsRecords
                        .map((x) => ("uploaderId" in x ? x.uploaderId : undefined))
                        .filter(isNotUndefined),
                    personIds: emailsRecords
                        .map((x) => ("personId" in x ? x.personId : undefined))
                        .filter(isNotUndefined),
                },
            });

            await apolloClient.mutate({
                mutation: CompleteSubmissionRequestEmailJobsDocument,
                variables: {
                    ids: emailsRecords.map((x) => x.jobId),
                },
            });
        } catch (error: any) {
            console.error("Could not process submission request jobs", {
                jobIds: emailsRecords.map((x) => x.jobId),
                conferenceId,
                error,
            });
        }
    });
}
