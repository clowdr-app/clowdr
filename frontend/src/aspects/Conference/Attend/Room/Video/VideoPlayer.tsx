import { gql } from "@apollo/client";
import { Alert, AlertIcon, AspectRatio, Skeleton } from "@chakra-ui/react";
import {
    Content_ElementType_Enum,
    ElementBaseType,
    ElementDataBlob,
    isElementDataBlob,
    VideoElementBlob,
} from "@clowdr-app/shared-types/build/content";
import * as R from "ramda";
import React, { useMemo } from "react";
import { useVideoPlayer_GetElementQuery } from "../../../../../generated/graphql";
import { LinkButton } from "../../../../Chakra/LinkButton";
import { FAIcon } from "../../../../Icons/FAIcon";
import { useConference } from "../../../useConference";
import { VideoElement } from "../../Content/Element/VideoElement";

export function VideoPlayer({ elementId }: { elementId: string }): JSX.Element {
    gql`
        query VideoPlayer_GetElement($elementId: uuid!) {
            content_Element_by_pk(id: $elementId) {
                id
                typeName
                isHidden
                data
                name
                item {
                    id
                    title
                }
            }
        }
    `;

    const { data, error, loading } = useVideoPlayer_GetElementQuery({
        variables: {
            elementId,
        },
    });

    const videoElementBlob = useMemo((): VideoElementBlob | null => {
        if (
            !data?.content_Element_by_pk ||
            ![
                Content_ElementType_Enum.VideoBroadcast,
                Content_ElementType_Enum.VideoFile,
                Content_ElementType_Enum.VideoPrepublish,
            ].includes(data.content_Element_by_pk.typeName)
        ) {
            return null;
        }

        const blob: ElementDataBlob = data.content_Element_by_pk.data;

        if (!isElementDataBlob(blob)) {
            return null;
        }

        const latestVersion = R.last(blob)?.data;

        if (!latestVersion || latestVersion.baseType !== ElementBaseType.Video) {
            return null;
        }

        return latestVersion;
    }, [data?.content_Element_by_pk]);

    const conference = useConference();
    const itemPath = data?.content_Element_by_pk?.item ? `/conference/${conference.id}/` : undefined;

    return (
        <>
            {data?.content_Element_by_pk?.item && itemPath ? (
                <LinkButton to={itemPath} my={2}>
                    {data.content_Element_by_pk.item.title}
                    <FAIcon icon="external-link-alt" iconStyle="s" ml={3} />
                </LinkButton>
            ) : undefined}
            <AspectRatio maxW="100%" ratio={16 / 9}>
                <>
                    <Skeleton isLoaded={!loading}>
                        {videoElementBlob ? (
                            <VideoElement elementId={elementId} videoElementData={videoElementBlob} />
                        ) : undefined}
                        {error ? (
                            <Alert status="error">
                                <AlertIcon />
                                Could not load video
                            </Alert>
                        ) : undefined}
                    </Skeleton>
                </>
            </AspectRatio>
        </>
    );
}
