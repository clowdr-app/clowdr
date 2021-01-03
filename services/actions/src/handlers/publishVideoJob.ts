// import { gql } from "@apollo/client/core";
// import { AWSJobStatus, ContentBaseType } from "@clowdr-app/shared-types/build/content";
// import AmazonS3URI from "amazon-s3-uri";
// import assert from "assert";
// import fetch from "node-fetch";
// import { parseSync, stringifySync } from "subtitle";
// import { CompletePublishVideoJobDocument, FailPublishVideoJobDocument } from "../generated/graphql";
// import { apolloClient } from "../graphqlClient";
// import { getS3TextObject } from "../lib/aws/s3";
// import { addNewContentItemVersion, getLatestVersion } from "../lib/contentItem";
// import * as VimeoClient from "../lib/vimeoClient";
// import { Payload } from "../types/hasura/event";

// gql`
//     mutation CompletePublishVideoJob($publishVideoJobId: uuid!, $vimeoVideoUrl: String!) {
//         update_job_queues_PublishVideoJob_by_pk(
//             pk_columns: { id: $publishVideoJobId }
//             _set: { vimeoVideoUrl: $vimeoVideoUrl, jobStatusName: "COMPLETED" }
//         ) {
//             id
//         }
//     }

//     mutation FailPublishVideoJob($publishVideoJobId: uuid!) {
//         update_job_queues_PublishVideoJob_by_pk(
//             pk_columns: { id: $publishVideoJobId }
//             _set: { jobStatusName: "FAILED" }
//         ) {
//             id
//         }
//     }

//     query GetContentItem($contentItemId: uuid!) {
//         ContentItem_by_pk(id: $contentItemId) {
//             id
//             data
//             name
//         }
//     }
// `;

// VimeoClient.defaults.headers = {
//     Authorization: `bearer ${process.env.VIMEO_ACCESS_TOKEN}`,
// };

// VimeoClient.defaults.fetch = fetch as any;

// export async function handlePublishVideoJobInserted(payload: Payload<PublishVideoJobData>): Promise<void> {
//     assert(payload.event.data.new, "Payload must contain new row data");
//     assert(!payload.event.data.old, "Payload must not contain old data");

//     try {
//         console.log("Pretending to upload content item to Vimeo", payload.event.data.new.contentItemId);

//         const { latestVersion } = await getLatestVersion(payload.event.data.new.contentItemId);

//         if (!latestVersion) {
//             throw new Error("The content item does not have a latest version");
//         }

//         if (
//             latestVersion.data.baseType !== ContentBaseType.Video ||
//             !latestVersion.data.transcode ||
//             latestVersion.data.subtitles["en_US"].status !== AWSJobStatus.Completed
//         ) {
//             console.error("Latest version invalid", payload.event.data.new.id, JSON.stringify(latestVersion));
//             throw new Error("The content item is not ready to be published");
//         }

//         const _vttSubtitles = await getVTTSubtitles(latestVersion.data.subtitles["en_US"].s3Url);

//         const result = await VimeoClient.developerTutorial();
//         console.log("Vimeo API result", result.data);

//         // publish to Vimeo here and get URL
//         const vimeoVideoUrl = "http://www.example.org/";

//         const newVersion = createNewVersionFromPublishToVimeo(latestVersion, vimeoVideoUrl);
//         await addNewContentItemVersion(payload.event.data.new.contentItemId, newVersion);

//         await apolloClient.mutate({
//             mutation: CompletePublishVideoJobDocument,
//             variables: {
//                 publishVideoJobId: payload.event.data.new.id,
//                 vimeoVideoUrl,
//             },
//         });
//     } catch (e) {
//         console.error("PublishVideoJob failed to execute.", e);
//         await apolloClient.mutate({
//             mutation: FailPublishVideoJobDocument,
//             variables: { publishVideoJobId: payload.event.data.new.id },
//         });
//     }
// }

// async function getVTTSubtitles(s3SrtSubtitlesUrl: string): Promise<string> {
//     const { bucket, key } = new AmazonS3URI(s3SrtSubtitlesUrl);

//     assert(bucket, "Could not determine S3 bucket for subtitles");
//     assert(key, "Could not determine S3 key for subtitles");

//     const srtSubtitles = await getS3TextObject(bucket, key);
//     const subtitlesNodes = parseSync(srtSubtitles);
//     return stringifySync(subtitlesNodes, { format: "WebVTT" });
// }
