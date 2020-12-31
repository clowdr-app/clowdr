import { ContentBaseType } from "@clowdr-app/shared-types/build/content";
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

    const itemsWithoutPreviewTranscode = contentGroup.items
        .filter((item) => videoContentTypes.includes(item.typeName))
        .map((item) => R.last(item.data))
        .filter(
            (latestVersion) =>
                latestVersion &&
                videoContentTypes.includes(latestVersion.data.type) &&
                latestVersion.data.baseType === ContentBaseType.Video &&
                !latestVersion.data.transcode
        );

    if (itemsWithoutPreviewTranscode.length > 0) {
        // There are still video items that do not have a preview transcode.
        return false;
    }

    return true;
}
