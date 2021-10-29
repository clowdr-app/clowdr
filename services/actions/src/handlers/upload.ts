import { gql } from "@apollo/client/core";
import type { EmailTemplate_BaseConfig } from "@midspace/shared-types/conferenceConfiguration";
import { isEmailTemplate_BaseConfig } from "@midspace/shared-types/conferenceConfiguration";
import type {
    AudioElementBlob,
    ElementBlob,
    ElementVersionData,
    VideoElementBlob,
} from "@midspace/shared-types/content";
import { AWSJobStatus, Content_ElementType_Enum, ElementBaseType } from "@midspace/shared-types/content";
import type { EmailView_SubmissionRequest } from "@midspace/shared-types/email";
import { EMAIL_TEMPLATE_SUBMISSION_REQUEST } from "@midspace/shared-types/email";
import AmazonS3URI from "amazon-s3-uri";
import assert from "assert";
import { compile } from "handlebars";
import R from "ramda";
import { is } from "typescript-is";
import { v4 as uuidv4 } from "uuid";
import type { Email_Insert_Input, UploadableElementFieldsFragment } from "../generated/graphql";
import {
    Conference_ConfigurationKey_Enum,
    ElementAddNewVersionDocument,
    GetUploadersDocument,
    InsertSubmissionRequestEmailsDocument,
    MarkAndSelectUnprocessedSubmissionRequestEmailJobsDocument,
    SetUploadableElementUploadsRemainingDocument,
    UnmarkSubmissionRequestEmailJobsDocument,
    UploadableElementDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { S3 } from "../lib/aws/awsClient";
import { getConferenceConfiguration } from "../lib/conferenceConfiguration";
import { extractLatestVersion } from "../lib/element";
import { callWithRetry } from "../utils";
import { insertEmails } from "./email";

gql`
    query UploadableElement($accessToken: String!) {
        content_Element(where: { item: { itemPeople: { person: { accessToken: { _eq: $accessToken } } } } }) {
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

    fragment UploadableElementFields on content_Element {
        id
        typeName
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
    } catch (e: any) {
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
            typeName
            item {
                id
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
                    }
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
            emails = uploaders.data.content_Element_by_pk.item.itemPeople.map(({ person }) => {
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

        await insertEmails(emails, uploaders.data.content_Element_by_pk.conferenceId);
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
        } catch (e: any) {
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
    } catch (e: any) {
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
    } catch (e: any) {
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
    mutation InsertSubmissionRequestEmails($personIds: [uuid!]!) {
        update_collection_ProgramPerson(where: { id: { _in: $personIds } }, _inc: { submissionRequestsSentCount: 1 }) {
            affected_rows
        }
    }
`;

gql`
    mutation MarkAndSelectUnprocessedSubmissionRequestEmailJobs {
        update_job_queues_SubmissionRequestEmailJob(where: { processed: { _eq: false } }, _set: { processed: true }) {
            returning {
                id
                emailTemplate
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
    }

    mutation UnmarkSubmissionRequestEmailJobs($ids: [uuid!]!) {
        update_job_queues_SubmissionRequestEmailJob(where: { id: { _in: $ids } }, _set: { processed: false }) {
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

export async function processSendSubmissionRequestsJobQueue(): Promise<void> {
    const jobsToProcess = await apolloClient.mutate({
        mutation: MarkAndSelectUnprocessedSubmissionRequestEmailJobsDocument,
        variables: {},
    });
    assert(jobsToProcess.data?.update_job_queues_SubmissionRequestEmailJob, "Failed to fetch jobs to process.");

    const emails = new Map<string, SubmissionRequestEmail[]>();
    for (const job of jobsToProcess.data.update_job_queues_SubmissionRequestEmailJob.returning) {
        let result: SubmissionRequestEmail | undefined;
        let conferenceId: string | undefined;

        if (job.person) {
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
                await insertEmails(emailsToInsert, conferenceId);
            }

            await apolloClient.mutate({
                mutation: InsertSubmissionRequestEmailsDocument,
                variables: {
                    // uploaderIds: emailsRecords
                    //     .map((x) => ("uploaderId" in x ? x.uploaderId : undefined))
                    //     .filter(isNotUndefined),
                    personIds: emailsRecords
                        .map((x) => ("personId" in x ? x.personId : undefined))
                        .filter(isNotUndefined),
                },
            });
        } catch (e: any) {
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
            } catch (e: any) {
                console.error(`Could not unmark failed emails: ${e.toString()}`);
            }
        }
    });
}
