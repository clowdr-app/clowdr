import { gql } from "@apollo/client/core";
import assert from "assert";
import R from "ramda";
import {
    ContentItemAddNewVersionDocument,
    GetContentItemByRequiredItemDocument,
} from "../generated/graphql";
import { apolloClient } from "../graphqlClient";
import { startTranscode } from "../lib/transcode";
import { startTranscribe } from "../lib/transcribe";
import { ContentItemData, Payload } from "../types/event";

gql`
    mutation ContentItemAddNewVersion($id: uuid!, $newVersion: jsonb!) {
        update_ContentItem_by_pk(
            pk_columns: { id: $id }
            _append: { data: $newVersion }
        ) {
            id
        }
    }
`;

export async function handleContentItemUpdated(
    payload: Payload<ContentItemData>
): Promise<void> {
    const oldRow = payload.event.data.old;
    const newRow = payload.event.data.new;

    if (!newRow?.data) {
        console.error("handleContentItemUpdated: New content was empty");
        return;
    }

    const oldVersion = oldRow?.data[oldRow.data.length - 1];
    const currentVersion = newRow.data[newRow.data.length - 1];

    // If new version is not a video
    if (currentVersion.data.baseType !== "video") {
        console.log("Content item updated: was not a VideoBroadcast");
        return;
    }

    // If there is a new video source URL, start transcoding
    if (
        (oldVersion &&
            oldVersion.data.baseType === "video" &&
            oldVersion.data.s3Url !== currentVersion.data.s3Url) ||
        (!oldVersion && currentVersion.data.s3Url)
    ) {
        const transcodeResult = await startTranscode(
            currentVersion.data.s3Url,
            newRow.id
        );

        // Update data item with new version
        const newVersion = R.clone(currentVersion);
        assert(
            newVersion.data.type === currentVersion.data.type,
            "Clone failed (this should never happen!)"
        ); // give TypeScript's inference a nudge

        newVersion.createdAt = Date.now();
        newVersion.createdBy = "system";
        newVersion.data.transcode = {
            jobId: transcodeResult.jobId,
            status: "IN_PROGRESS",
            updatedTimestamp: transcodeResult.timestamp.getTime(),
        };

        const mutateResult = await apolloClient.mutate({
            mutation: ContentItemAddNewVersionDocument,
            variables: {
                id: newRow.id,
                newVersion,
            },
        });

        assert(
            mutateResult.data?.update_ContentItem_by_pk?.id,
            "Failed to record transcode initialisation"
        );
    } else {
        console.log("Content item video URL has not changed.");
    }

    // If there is a new transcode URL, begin transcribing it
    if (
        (oldVersion &&
            oldVersion.data.baseType === "video" &&
            currentVersion.data.transcode?.s3Url &&
            oldVersion.data.transcode?.s3Url !==
                currentVersion.data.transcode.s3Url) ||
        (!oldVersion && currentVersion.data.transcode?.s3Url)
    ) {
        await startTranscribe(currentVersion.data.transcode.s3Url, newRow.id);
    }

    // If there are new en_US subtitles, notify the uploaders
    // todo
}

gql`
    query GetContentItemByRequiredItem($accessToken: String!) {
        ContentItem(
            where: {
                requiredContentItem: { accessToken: { _eq: $accessToken } }
            }
        ) {
            id
            contentTypeName
            data
            layoutData
            name
        }
    }
`;

export async function handleGetByRequiredItem(
    args: getContentItemArgs
): Promise<Array<GetContentItemOutput>> {
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
