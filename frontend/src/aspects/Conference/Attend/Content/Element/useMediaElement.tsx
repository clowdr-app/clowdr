import { WebVTTConverter } from "@clowdr-app/srt-webvtt";
import type { AudioElementBlob, ElementDataBlob, VideoElementBlob } from "@midspace/shared-types/content";
import { Content_ElementType_Enum, ElementBaseType, isElementDataBlob } from "@midspace/shared-types/content";
import { gql } from "@urql/core";
import AmazonS3URI from "amazon-s3-uri";
import * as R from "ramda";
import { useMemo } from "react";
import { useAsync } from "react-async-hook";
import type { UseMediaElement_MediaElementFragment } from "../../../../../generated/graphql";

gql`
    fragment useMediaElement_MediaElement on content_Element {
        typeName
        data
    }
`;

export function parseMediaElement(element?: UseMediaElement_MediaElementFragment): {
    error?: Error;
    mediaElementBlob?: VideoElementBlob | AudioElementBlob;
} {
    if (!element) {
        return {};
    }

    const blob: ElementDataBlob = element.data;

    if (
        ![
            Content_ElementType_Enum.VideoBroadcast,
            Content_ElementType_Enum.VideoFile,
            Content_ElementType_Enum.VideoPrepublish,
        ].includes(element.typeName) ||
        !isElementDataBlob(blob)
    ) {
        return {
            error: new Error("Element is not of a valid type."),
        };
    }

    const latestVersion = R.last(blob)?.data;

    if (!latestVersion || latestVersion.baseType !== ElementBaseType.Video) {
        return {
            error: new Error("Element is not of a valid type."),
        };
    }

    return {
        mediaElementBlob: latestVersion,
    };
}

export interface VideoElementDetails {
    video: {
        url?: string;
        isHls?: boolean;
        error?: Error;
    };
    subtitles: {
        loading: boolean;
        error?: Error;
        url?: string;
    };
}

export function parseMediaElementUrl(elementData: VideoElementBlob | AudioElementBlob): VideoElementDetails["video"] {
    try {
        let s3Url = "transcode" in elementData ? elementData.transcode?.s3Url : undefined;

        if (!s3Url && elementData.s3Url) {
            s3Url = elementData.s3Url;
        }

        if (!s3Url) {
            return { error: new Error("No S3 URL specified.") };
        }
        const { bucket, key } = new AmazonS3URI(s3Url);

        if (!bucket || !key) {
            return { error: new Error("S3 URL could not be parsed.") };
        }

        return {
            url: `https://s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${bucket}/${key}`,
            isHls: Boolean(key.endsWith(".m3u8")),
        };
    } catch (error) {
        return {
            error: error instanceof Error ? error : new Error("Error creating S3 URL."),
        };
    }
}

export async function parseMediaElementSubtitlesUrl(
    elementData: VideoElementBlob | AudioElementBlob
): Promise<string | undefined> {
    if (!elementData.subtitles["en_US"] || !elementData.subtitles["en_US"].s3Url?.length) {
        return undefined;
    } else {
        try {
            const { bucket, key } = new AmazonS3URI(elementData.subtitles["en_US"].s3Url);
            const s3Url = `https://s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${bucket}/${key}`;

            const response = await fetch(s3Url);

            if (!response.ok) {
                throw new Error(`Could not retrieve subtitles file: ${response.status}`);
            }

            const blob = await response.blob();

            return await new WebVTTConverter(blob).getURL();
        } catch (e) {
            console.error("Failure while parsing subtitle location", e);
            throw new Error("Failure while parsing subtitle location");
        }
    }
}

export function useMediaElementUrls(elementData: VideoElementBlob | AudioElementBlob): VideoElementDetails {
    const video = useMemo(() => parseMediaElementUrl(elementData), [elementData]);

    const subtitles = useAsync(
        async () => parseMediaElementSubtitlesUrl(elementData),
        [elementData.subtitles["en_US"]]
    );

    return {
        video,
        subtitles: {
            loading: subtitles.loading,
            error: subtitles.error,
            url: subtitles.result,
        },
    };
}
