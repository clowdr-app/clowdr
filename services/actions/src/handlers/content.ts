import { gql } from "@apollo/client/core";
import { EmailTemplate_BaseConfig } from "@clowdr-app/shared-types/build/conferenceConfiguration";
import { AWSJobStatus } from "@clowdr-app/shared-types/build/content";
import { SourceType } from "@clowdr-app/shared-types/build/content/element";
import { EmailView_SubtitlesGenerated } from "@clowdr-app/shared-types/build/email";
import assert from "assert";
import { compile } from "handlebars";
import R from "ramda";
import {
    ElementAddNewVersionDocument,
    ElementUpdateNotification_ElementDetailsFragment,
    Email_Insert_Input,
    FindMatchingProgramPersonForUploaderDocument,
    GetElementDetailsDocument,
    GetUploadAgreementDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import {
    getEmailTemplatesSubtitlesGenerated,
    getRecordingEmailNotificationsEnabled,
    getSubmissionNotificationRoles,
} from "../lib/conferenceConfiguration";
import { EmailReason } from "../lib/email/sendingReasons";
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

    // If new version is not a video or audio file
    if (currentVersion.data.baseType !== "video" && currentVersion.data.baseType !== "audio") {
        console.log("Content item updated: was not a video or audio file.", newRow.id);
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
    }

    // If there is a new transcode URL, begin transcribing it
    if (currentVersion.data.baseType === "video") {
        if (
            (oldVersion &&
                oldVersion.data.baseType === "video" &&
                currentVersion.data.transcode?.s3Url &&
                !currentVersion.data.sourceHasEmbeddedSubtitles &&
                oldVersion.data.transcode?.s3Url !== currentVersion.data.transcode.s3Url) ||
            (oldVersion &&
                oldVersion.data.baseType === "video" &&
                currentVersion.data.transcode?.s3Url &&
                oldVersion.data.transcode?.s3Url === currentVersion.data.transcode.s3Url &&
                Boolean(oldVersion.data.subtitles["en_US"]?.s3Url) &&
                !currentVersion.data.subtitles["en_US"]?.s3Url) ||
            (!oldVersion && currentVersion.data.transcode?.s3Url && !currentVersion.data.subtitles["en_US"]?.s3Url)
        ) {
            await startTranscribe(currentVersion.data.transcode.s3Url, newRow.id);
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
            await startTranscribe(currentVersion.data.s3Url, newRow.id);
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
            await trySendTranscriptionEmail(newRow);
        }
    }

    if (
        oldVersion &&
        (oldVersion.data.baseType === "video" || oldVersion.data.baseType === "audio") &&
        oldVersion.data.subtitles["en_US"]?.status !== "FAILED" &&
        currentVersion.data.subtitles["en_US"]?.status === "FAILED"
    ) {
        await trySendTranscriptionFailedEmail(newRow, currentVersion.data.subtitles["en_US"]?.message ?? null);
    }

    if (currentVersion.data.baseType === "video") {
        if (
            (oldVersion &&
                oldVersion.data.baseType === "video" &&
                oldVersion.data.transcode?.status !== "FAILED" &&
                currentVersion.data.transcode?.status === "FAILED") ||
            (!oldVersion && currentVersion.data.transcode?.status === "FAILED")
        ) {
            await trySendTranscodeFailedEmail(newRow, currentVersion.data.transcode.message ?? "No details available.");
        }
    }
}

gql`
    fragment ElementUpdateNotification_ElementDetails on content_Element {
        id
        name
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

async function trySendTranscriptionEmail(elementData: ElementData) {
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
                        name: elementDetails.conference.name,
                        shortName: elementDetails.conference.shortName,
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

        await insertEmails(emails, elementData.conferenceId, undefined);
    } catch (err) {
        console.error("Error while sending transcription emails", { elementId: elementData.id, err });
        return;
    }
}

async function trySendTranscriptionFailedEmail(elementData: ElementData, message: string | null) {
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
<p>Your item ${elementData.name} (${elementDetails.item.title}) at ${elementDetails.conference.name} <b>has successfully entered our systems</b>. Your ${elementType} will be included in the conference pre-publications and/or live streams (as appropriate).</p>
<p>However, we are sorry that unfortunately an error occurred and we were unable to auto-generate subtitles. We appreciate this is a significant inconvenience but we kindly ask that you to manually enter subtitles for your ${elementType}.</p>
<p><a href="${magicItemLink}">Please manually add subtitles on this page.</a></p>
<p>We have also sent ourselves a notification of this failure via email and we will assist you at our earliest opportunity. If we can get automated subtitles working for your ${elementType}, we will let you know as soon as possible!</p>`;

            return {
                recipientName: person.name,
                emailAddress: person.email,
                reason: EmailReason.ItemTranscriptionFailed,
                subject: `Submission ERROR: Failed to generate subtitles for ${elementData.name} at ${elementDetails.conference.name}`,
                htmlContents,
            };
        });

    {
        const htmlContents = `<p>Yep, this is the automated system here to tell you that the automation failed.</p>
        <pre>
failure         Failed to generate subtitles
message         ${message}
itemId          ${elementDetails.item.id}
itemTitle       ${elementDetails.item.title}
elementId       ${elementData.id}
elementName     ${elementData.name}
conferenceName  ${elementDetails.conference.name}
path            /item/${elementDetails.item.id}/element/${elementData.id}
        </pre>
<p>Good luck fixing me!</p>`;
        emails.push({
            recipientName: "System Administrator",
            emailAddress: process.env.FAILURE_NOTIFICATIONS_EMAIL_ADDRESS,
            reason: EmailReason.FailureNotification,
            subject: `PRIORITY: SYSTEM ERROR: Failed to generate subtitles for ${elementData.name} at ${elementDetails.conference.name}`,
            htmlContents,
        });
    }

    await insertEmails(emails, elementDetails.conference.id, undefined);
}

async function trySendTranscodeFailedEmail(elementData: ElementData, message: string) {
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
<p>There was a problem processing <b>${elementData.name}</b> (${elementDetails.item.title}) for ${elementDetails.conference.name}. Your ${elementType} is not currently accepted by Midspace's systems and currently will not be included in the conference pre-publications or live streams.</p>
<p>Error details: ${message}</p>
<p><a href="${magicItemLink}">You may try uploading a new version</a> but we recommend you forward this email to your conference's organisers and ask for technical assistance.</p>
<p>We have also sent ourselves a notification of this failure via email and we will assist you as soon as possible. Making Midspace work for you is our top priority! We will try to understand the error and solve the issue either by fixing our software or providing you instructions for how to work around it.</p>`;

            return {
                recipientName: person.name,
                emailAddress: person.email,
                reason: "item_transcode_failed",
                subject: `Submission ERROR: Failed to process ${elementData.name} at ${elementDetails.conference.name}`,
                htmlContents,
            };
        });

    {
        const htmlContents = `<p>Yep, this is the automated system here to tell you that the automation failed.</p>
        <pre>
failure         Failed to transcode video
message         ${message}
itemId          ${elementDetails.item.id}
itemTitle       ${elementDetails.item.title}
elementId       ${elementData.id}
elementName     ${elementData.name}
conferenceName  ${elementDetails.conference.name}
path            /item/${elementDetails.item.id}/element/${elementData.id}
        </pre>
<p>Good luck fixing me!</p>`;
        emails.push({
            recipientName: "System Administrator",
            emailAddress: process.env.FAILURE_NOTIFICATIONS_EMAIL_ADDRESS,
            reason: EmailReason.ItemTranscodeFailed,
            subject: `URGENT: SYSTEM ERROR: Failed to process ${elementData.name} at ${elementDetails.conference.name}`,
            htmlContents,
        });
    }

    await insertEmails(emails, elementData.conferenceId, undefined);
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
        result.data.content_Element[0].conference.configurations.length === 1
    ) {
        const value = result.data.content_Element[0].conference.configurations[0].value;
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

gql`
    query FindMatchingProgramPersonForUploader(
        $elementId: uuid!
        $elementAccessToken: String!
        $uploaderEmail: String!
    ) {
        content_Element(
            where: {
                id: { _eq: $elementId }
                accessToken: { _eq: $elementAccessToken }
                uploaders: { email: { _eq: $uploaderEmail } }
            }
        ) {
            id
            itemId
            conference {
                id
                programPeople(where: { email: { _eq: $uploaderEmail } }) {
                    id
                    accessToken
                    itemPeople {
                        id
                        itemId
                    }
                }
            }
        }
    }
`;

export async function handleGetProgramPersonAccessToken(
    args: getProgramPersonAccessTokenArgs
): Promise<MatchingPersonOutput> {
    const response = await apolloClient.query({
        query: FindMatchingProgramPersonForUploaderDocument,
        variables: {
            ...args,
        },
    });

    if (response.data.content_Element.length > 0) {
        const element = response.data.content_Element[0];

        if (element.conference.programPeople.length === 1) {
            return {
                accessToken: element.conference.programPeople[0].accessToken,
            };
        } else if (element.conference.programPeople.length > 0) {
            const person = element.conference.programPeople.find((person) =>
                person.itemPeople.some((itemPerson) => itemPerson.itemId === element.itemId)
            );
            if (person) {
                return {
                    accessToken: person.accessToken,
                };
            }
        }
    }

    return {};
}
