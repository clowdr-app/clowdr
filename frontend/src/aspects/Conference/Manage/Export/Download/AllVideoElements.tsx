import { Button, ButtonGroup, List, ListItem, Spinner } from "@chakra-ui/react";
import { AuthHeader, HasuraRoleName } from "@midspace/shared-types/auth";
import type { ElementDataBlob } from "@midspace/shared-types/content";
import {
    AWSJobStatus,
    Content_ElementType_Enum,
    ElementBaseType,
    isElementDataBlob,
} from "@midspace/shared-types/content";
import { gql } from "@urql/core";
import AmazonS3URI from "amazon-s3-uri";
import * as R from "ramda";
import React, { useCallback, useContext, useMemo } from "react";
import { useDownloadVideos_GetAllVideosQuery } from "../../../../../generated/graphql";
import FAIcon from "../../../../Chakra/FAIcon";
import { makeContext } from "../../../../GQL/make-context";
import { useConference } from "../../../useConference";
import { VideoDownloadContext } from "./VideoDownloadContext";
import { VideoDownloadLink } from "./VideoDownloadLink";

gql`
    query DownloadVideos_GetAllVideos($conferenceId: uuid!) {
        content_Item(where: { conferenceId: { _eq: $conferenceId } }) {
            id
            conferenceId
            elements(where: { typeName: { _in: [TEXT, VIDEO_FILE, VIDEO_BROADCAST, VIDEO_PREPUBLISH] } }) {
                name
                id
                data
                typeName
                itemId
            }
            typeName
            title
        }
    }
`;

function elementDataToMaybeText(elementData: any): string | null {
    if (!isElementDataBlob(elementData)) {
        return null;
    }

    const latest = R.last(elementData);

    if (latest?.data?.baseType === ElementBaseType.Text) {
        return latest.data.text;
    }

    return null;
}

function toS3Url(s3Url: string): string | undefined {
    try {
        const { bucket, key } = new AmazonS3URI(s3Url);

        return `https://s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${bucket}/${key}`;
    } catch (err) {
        return undefined;
    }
}

export function AllVideoElements(): JSX.Element {
    const conference = useConference();
    const { reset } = useContext(VideoDownloadContext);
    const context = useMemo(
        () =>
            makeContext({
                [AuthHeader.Role]: HasuraRoleName.ConferenceOrganizer,
            }),
        []
    );
    const [result] = useDownloadVideos_GetAllVideosQuery({
        variables: {
            conferenceId: conference.id,
        },
        context,
    });

    const videoElements = useMemo(
        () =>
            result.data?.content_Item.flatMap((item) => {
                return item.elements
                    .filter(
                        (e) =>
                            [
                                Content_ElementType_Enum.VideoFile,
                                Content_ElementType_Enum.VideoBroadcast,
                                Content_ElementType_Enum.VideoPrepublish,
                            ].includes(e.typeName) && isElementDataBlob(e.data)
                    )
                    .map((element) => ({
                        item,
                        element,
                        text: R.fromPairs(
                            item.elements
                                .filter((e) => e.typeName === Content_ElementType_Enum.Text)
                                .map((e) => [e.name, elementDataToMaybeText(e.data)])
                        ),
                    }));
            }),
        [result.data?.content_Item]
    );

    const extractVideoUrl = useCallback((data: ElementDataBlob) => {
        const elementData = R.last(data)?.data;

        if (!elementData || elementData.baseType !== ElementBaseType.Video) {
            return undefined;
        }

        let s3Url = "transcode" in elementData ? elementData.transcode?.s3Url : undefined;

        if (!s3Url && elementData.s3Url) {
            s3Url = elementData.s3Url;
        }

        if (!s3Url) {
            return undefined;
        }

        return toS3Url(s3Url);
    }, []);

    const extractCaptionUrls = useCallback((data: ElementDataBlob) => {
        const elementData = R.last(data)?.data;

        if (!elementData || elementData.baseType !== ElementBaseType.Video) {
            return undefined;
        }

        const entries = Object.entries(elementData.subtitles)
            .filter(([, v]) => v.status === AWSJobStatus.Completed)
            .map(([k, v]): [string, string] => [k, toS3Url(v.s3Url) ?? ""])
            .filter(([, v]) => Boolean(v.length));

        return Object.fromEntries(entries);
    }, []);

    const downloadManifest = useCallback(() => {
        const manifest = videoElements?.map(({ element, item, text }) => ({
            elementId: element.id,
            itemId: item.id,
            itemTitle: item.title,
            elementName: element.name,
            fileName: extractVideoUrl(element.data),
            captionUrls: extractCaptionUrls(element.data),
            text,
        }));

        const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "text/json" });
        const link = document.createElement("a");

        link.download = "manifest.json";
        link.href = window.URL.createObjectURL(blob);
        link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");

        const evt = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
        });

        link.dispatchEvent(evt);
        link.remove();
    }, [extractCaptionUrls, extractVideoUrl, videoElements]);

    return (
        <>
            {result.fetching && <Spinner />}
            {result.data ? (
                <ButtonGroup mb={4}>
                    <Button
                        leftIcon={<FAIcon icon="download" iconStyle="s" />}
                        size="sm"
                        w="max-content"
                        onClick={downloadManifest}
                        colorScheme="PrimaryActionButton"
                    >
                        Download manifest
                    </Button>
                    <Button leftIcon={<FAIcon icon="redo" iconStyle="s" />} size="sm" w="max-content" onClick={reset}>
                        Reset
                    </Button>
                </ButtonGroup>
            ) : undefined}
            <List spacing={1}>
                {videoElements
                    ?.sort((a, b) => a.item.title.localeCompare(b.item.title))
                    ?.map(({ item, element }) => (
                        <ListItem key={element.id}>
                            <VideoDownloadLink
                                itemTitle={item.title}
                                elementName={element.name}
                                data={element.data}
                                elementId={element.id}
                                extractVideoUrl={extractVideoUrl}
                            />
                        </ListItem>
                    )) ?? <ListItem>No videos available to download.</ListItem>}
            </List>
        </>
    );
}
