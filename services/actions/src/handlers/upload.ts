import { gql } from "@apollo/client/core";
import {
    AWSJobStatus,
    ContentBaseType,
    ContentBlob,
    ContentItemDataBlob,
    ContentItemVersionData,
    ContentType_Enum,
    VideoContentBlob,
} from "@clowdr-app/shared-types/build/content";
import AmazonS3URI from "amazon-s3-uri";
import assert from "assert";
import { htmlToText } from "html-to-text";
import R from "ramda";
import { is } from "typescript-is";
import { v4 as uuidv4 } from "uuid";
import { S3 } from "../aws/awsClient";
import {
    ContentItemAddNewVersionDocument,
    CreateContentItemDocument,
    Email_Insert_Input,
    GetUploadersDocument,
    InsertEmailsDocument,
    InsertSubmissionRequestEmailsDocument,
    RequiredItemDocument,
    RequiredItemFieldsFragment,
    SelectUploaderDocument,
    SetRequiredContentItemUploadsRemainingDocument,
    UploaderPartsFragment,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { getLatestVersion } from "../lib/contentItem";
import { SubmissionRequestEmailJobData } from "../types/hasura/event";

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
        $layoutData: jsonb!
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

    await apolloClient.mutate({
        mutation: InsertEmailsDocument,
        variables: {
            objects: emails,
        },
    });
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

    if (requiredContentItem.uploadsRemaining === 0) {
        return {
            success: false,
            message: "No upload attempts remaining",
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
                    isHidden: false,
                    layoutData: {},
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
        apolloClient.mutate({
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
        }
        email
        emailsSentCount
        name
        requiredContentItem {
            ...RequiredItemFields
        }
    }

    query SelectUploader($id: uuid!) {
        Uploader_by_pk(id: $id) {
            ...UploaderParts
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

async function getUploader(
    uploaderId: string
): Promise<{
    uploader: UploaderPartsFragment;
}> {
    const query = await apolloClient.query({
        query: SelectUploaderDocument,
        variables: {
            id: uploaderId,
        },
    });
    assert(query.data.Uploader_by_pk);
    const uploader = query.data.Uploader_by_pk;
    return {
        uploader,
    };
}

function generateEmailContents(uploader: UploaderPartsFragment) {
    const contentTypeFriendlyName = generateContentTypeFriendlyName(uploader.requiredContentItem.contentTypeName);
    const url = `${process.env.FRONTEND_PROTOCOL}://${process.env.FRONTEND_DOMAIN}/upload/${uploader.requiredContentItem.id}/${uploader.requiredContentItem.accessToken}`;

    // TODO: Make info like deadlines, max file sizes, tutorial video link, etc configurable
    const htmlContents = `<p>Dear ${uploader.name},</p>
<p>
    The organisers of ${uploader.conference.name} are requesting that you or
    your co-authors/co-presenters upload ${contentTypeFriendlyName} for
    "${uploader.requiredContentItem.contentGroup.title}".
</p>
<p>
    Please do not forward or share this email: anyone with the link contained
    herein can use it to upload content to your conference item.
</p>
<p>
    Please <a href="${url}">submit your content on this page</a>.
</p>
<p>
    Please <a href="https://youtu.be/l0SqCISybqk">watch this 6 minute instructional video</a> to learn how to use Clowdr's content upload system. This video also shows how to edit subtitles.
</p>
<p>
    You should have received two emails (including this one) for the two separate videos you should
    upload. These are the <b>Broadcast video</b> and the <b>Pre-publication video</b>.
</p>
<ul>
    <li><b>Broadcast video:</b> Max 5 mins. For POPL, this will be both pre-published and live streamed during the main conference before the live Q&amp;A.
        <ul>
            <li>If your video is longer than 5 minutes, it will be abruptly cut short during the live stream. The system is automated and there is no leeway in the schedule. Please make sure your video is under 5 minutes long.</li>
        </ul>
    </li>
    <li><span><b>Pre-published video:</b> Max 30 mins. Published around the 11th Jan for attendees to watch before the conference.</span>
        <ul>
            <li>If your video is longer than 30 minutes, we are likely to cut it down (by clipping it to 30 mins).</li>
        </ul>
    </li>
    <li><b>Submission deadline: 12:00 UTC on 4th January 2021.</b>
        <ul>
            <li>The deadline time has been chosen as it is equivalent to 'end of 3rd January for anywhere in the world'.</li>
            <li>Your upload must start before this deadline, but any ongoing (uninterrupted) uploads will be allowed to continue past this time.</li>
            <li>Please do not leave submitting to the last moment; Submitting at the last moment is risky. If we are unable to automatically process your video and are only made aware of an issue after the deadline, we may not have time to resolve the problem.</li>
            <li>If you fail to submit on time, your videos may not be processed for pre-publication.</li>
            <li>Submissions after this time may be blocked and will require you to contact the POPL organising committee.</li>
        </ul>
    </li>
    <li><span><b>Up to 3 uploads</b> per requested video are allowed.</span>
        <ul>
            <li><b>Additional uploads are not available.</b></li>
            <li>Only the last uploaded version will be used. We recommend you review and edit your video locally (e.g. using VLC Media Player) before uploading to Clowdr.</li>
        </ul>
    </li>
    <li>After uploading your video, Clowdr will process it and auto-generate subtitles. You will receive emails for each stage of processing.</li>
    <li><b>Once subtitles have been generated, you will have the opportunity to edit them.</b></li>
    <li><b>The deadline for editing subtitles is 12:00 UTC on 6th January 2021.</b>
        <ul>
            <li>After editing subtitles, please remember to <b>click the "Save" button!</b></li>
        </ul>
    </li>
</ul>
<p>We hope you enjoy your conference,<br/>
The Clowdr team
</p>
<p>This is an automated email sent on behalf of Clowdr CIC. If you believe you have
received this email in error, please contact us via <a href="mailto:${process.env.STOP_EMAILS_CONTACT_EMAIL_ADDRESS}">${process.env.STOP_EMAILS_CONTACT_EMAIL_ADDRESS}</a></p>`;

    const plainTextContents = htmlToText(htmlContents);
    return {
        htmlContents,
        plainTextContents,
    };
}

function generateContentTypeFriendlyName(type: ContentType_Enum) {
    switch (type) {
        case ContentType_Enum.Abstract:
            return "Abstract";
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
        case ContentType_Enum.Zoom:
            return "Zoom Meeting URL";
    }
}

export async function uploadSendSubmissionRequestsHandler(
    data: SubmissionRequestEmailJobData
): Promise<UploaderSendSubmissionRequestResult> {
    const { uploader } = await getUploader(data.uploaderId);

    let ok = false;
    try {
        const { htmlContents, plainTextContents } = generateEmailContents(uploader);
        const contentTypeFriendlyName = generateContentTypeFriendlyName(uploader.requiredContentItem.contentTypeName);
        const newEmail: Email_Insert_Input = {
            emailAddress: uploader.email,
            htmlContents,
            plainTextContents,
            reason: "upload-request",
            subject: `#${
                uploader.requiredContentItem.contentTypeName === "VIDEO_BROADCAST" ? "1" : "2"
            } of 2, Clowdr submission request: ${contentTypeFriendlyName} for ${
                uploader.requiredContentItem.contentGroup.title
            }`,
        };

        await apolloClient.mutate({
            mutation: InsertSubmissionRequestEmailsDocument,
            variables: {
                emails: [newEmail],
                uploaderIds: [uploader.id],
            },
        });

        ok = true;
    } catch (_e) {
        ok = false;
    }

    return { uploaderId: data.uploaderId, sent: ok };
}
