import { ContentBaseType, ContentItemDataBlob } from "@clowdr-app/shared-types/build/content";
import * as R from "ramda";
import { ContentType_Enum } from "../../../../generated/graphql";
import type { ContentGroupDescriptor } from "./Types";

const videoContentTypes = [ContentType_Enum.VideoBroadcast, ContentType_Enum.VideoPrepublish];

/**
 * Given a content group, are we ready to publish its videos? (i.e. to Vimeo)
 */
export function readyToPublishVideos(contentGroup: ContentGroupDescriptor): boolean {
    // Are there any video required items without a corresponding content item?
    const videoRequiredItems = contentGroup.requiredItems.filter((item) => videoContentTypes.includes(item.typeName));
    const missingVideoRequiredItems = videoRequiredItems.filter(
        (requiredItem) => !contentGroup.items.find((item) => item.requiredContentId === requiredItem.id)
    );

    if (missingVideoRequiredItems.length > 0) {
        // There are still video items that need to be uploaded by a user.
        return false;
    }

    const unpublishableItems = contentGroup.items
        .filter((item) => videoContentTypes.includes(item.typeName))
        .filter((item) => contentItemPublishStateInternal(item.data) === ContentItemPublishState.NotPublishable);

    if (unpublishableItems.length > 0) {
        // There are still video items that do not have a preview transcode and subtitles.
        return false;
    }

    return true;
}

export enum ContentItemPublishState {
    Publishable,
    AlreadyPublished,
    NotPublishable,
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function contentItemPublishState(contentItemDataBlob: any): ContentItemPublishState {
    // todo: determine if this is possible
    // if (!isContentItemDataBlob(contentItemDataBlob)) {
    //     return ContentItemPublishState.NotPublishable;
    // }
    return contentItemPublishStateInternal(contentItemDataBlob);
}

function contentItemPublishStateInternal(data: ContentItemDataBlob): ContentItemPublishState {
    const latestVersion = R.last(data);

    if (!latestVersion) {
        return ContentItemPublishState.NotPublishable;
    }

    if (latestVersion.data.baseType !== ContentBaseType.Video) {
        return ContentItemPublishState.NotPublishable;
    }

    if (latestVersion.data.vimeoUpload) {
        return ContentItemPublishState.AlreadyPublished;
    }

    return latestVersion.data.transcode && Object.keys(latestVersion.data.subtitles).length > 0
        ? ContentItemPublishState.Publishable
        : ContentItemPublishState.NotPublishable;
}
