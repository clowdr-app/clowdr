// const videoContentTypes = [ContentType_Enum.VideoBroadcast, ContentType_Enum.VideoPrepublish];

// /**
//  * Given a content group, are we ready to publish its videos? (i.e. to Vimeo)
//  */
// export function readyToPublishVideos(contentGroup: ContentGroupDescriptor): boolean {
//     // Are there any video required items without a corresponding content item?
//     const videoRequiredItems = contentGroup.requiredItems.filter((item) => videoContentTypes.includes(item.typeName));
//     const missingVideoRequiredItems = videoRequiredItems.filter(
//         (requiredItem) => !contentGroup.items.find((item) => item.requiredContentId === requiredItem.id)
//     );

//     if (missingVideoRequiredItems.length > 0) {
//         // There are still video items that need to be uploaded by a user.
//         return false;
//     }

//     const unpublishableItems = contentGroup.items
//         .filter((item) => videoContentTypes.includes(item.typeName))
//         .filter((item) => contentItemPublishState(item.data) === ContentItemPublishState.NotPublishable);

//     if (unpublishableItems.length > 0) {
//         // There are still video items that do not have a preview transcode and subtitles.
//         return false;
//     }

//     return true;
// }

// // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
// export function contentItemPublishStateWrapper(contentItemDataBlob: any): ContentItemPublishState {
//     // todo: determine if this is possible
//     // if (!isContentItemDataBlob(contentItemDataBlob)) {
//     //     return ContentItemPublishState.NotPublishable;
//     // }
//     return contentItemPublishState(contentItemDataBlob);
// }
