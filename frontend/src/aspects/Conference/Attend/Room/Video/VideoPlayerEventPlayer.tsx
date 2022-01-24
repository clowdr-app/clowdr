import {
    Alert,
    AlertIcon,
    AspectRatio,
    CloseButton,
    Skeleton,
    Text,
    useFocusOnShow,
    useId,
    VStack,
} from "@chakra-ui/react";
import { contains, getRelatedTarget } from "@chakra-ui/utils";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { gql } from "urql";
import { useVideoPlayer_GetElementQuery } from "../../../../../generated/graphql";
import FAIcon from "../../../../Chakra/FAIcon";
import { LinkButton } from "../../../../Chakra/LinkButton";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
import { parseMediaElement } from "../../Content/Element/useMediaElement";
import { VideoElement } from "../../Content/Element/VideoElement";

export default function VideoPlayerEventPlayer({
    elementId,
    onPlay,
    onPause,
}: {
    elementId: string;
    onPlay?: () => void;
    onPause?: () => void;
}): JSX.Element {
    const { conferencePath } = useAuthParameters();
    gql`
        query VideoPlayer_GetElement($elementId: uuid!) {
            content_Element_by_pk(id: $elementId) {
                id
                item {
                    id
                    title
                }
                ...useMediaElement_MediaElement
            }
        }
    `;

    const [{ data, error, fetching: loading }] = useVideoPlayer_GetElementQuery({
        variables: {
            elementId,
        },
    });

    const { error: mediaElementError, mediaElementBlob } = parseMediaElement(data?.content_Element_by_pk ?? undefined);

    const itemPath = data?.content_Element_by_pk?.item
        ? `${conferencePath}/item/${data.content_Element_by_pk.item.id}`
        : undefined;

    const popoverRef = useRef<HTMLDivElement>(null);
    const [finished, setFinished] = useState<boolean>(false);
    useFocusOnShow(popoverRef, {
        shouldFocus: true,
        visible: finished,
    });
    const id = useId();

    useEffect(() => {
        setFinished(false);
    }, [elementId]);

    const popoverEl = useMemo(
        () => (
            <VStack
                bgColor="rgba(0, 0, 0, 0.7)"
                position="absolute"
                p={4}
                ref={popoverRef}
                id={id}
                onBlur={(event) => {
                    const relatedTarget = getRelatedTarget(event);
                    const targetIsPopover = contains(popoverRef.current, relatedTarget);
                    const isValidBlur = !targetIsPopover;

                    if (finished && isValidBlur) {
                        setFinished(false);
                    }
                }}
            >
                <CloseButton onClick={() => setFinished(false)} aria-controls={id} />
                <Text fontSize="2xl">Select another video below</Text>
                <FAIcon icon="hand-point-down" aria-hidden="true" iconStyle="r" fontSize="6xl" />
            </VStack>
        ),
        [finished, id]
    );

    return (
        <>
            {data?.content_Element_by_pk?.item && itemPath ? (
                <LinkButton to={itemPath} my={2}>
                    {data.content_Element_by_pk.item.title}
                    <FAIcon icon="external-link-alt" iconStyle="s" ml={3} />
                </LinkButton>
            ) : undefined}

            <AspectRatio w="min(100%, 90vh * (16 / 9))" maxW="100%" ratio={16 / 9}>
                <Skeleton isLoaded={!loading} position="relative">
                    {mediaElementBlob ? (
                        <>
                            {finished ? popoverEl : undefined}
                            <VideoElement
                                elementId={elementId}
                                elementData={mediaElementBlob}
                                onPause={() => {
                                    onPause?.();
                                }}
                                onFinish={() => {
                                    onPause?.();
                                    setFinished(true);
                                }}
                                onPlay={() => {
                                    onPlay?.();
                                    setFinished(false);
                                }}
                            />
                        </>
                    ) : undefined}
                    {error || mediaElementError ? (
                        <Alert status="error">
                            <AlertIcon />
                            Could not load video
                        </Alert>
                    ) : undefined}
                </Skeleton>
            </AspectRatio>
        </>
    );
}
