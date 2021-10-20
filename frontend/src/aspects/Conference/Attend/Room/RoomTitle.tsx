import { Heading, Image } from "@chakra-ui/react";
import type { ElementDataBlob} from "@clowdr-app/shared-types/build/content";
import { Content_ElementType_Enum, isElementDataBlob } from "@clowdr-app/shared-types/build/content";
import AmazonS3URI from "amazon-s3-uri";
import * as R from "ramda";
import React, { useMemo } from "react";
import { Twemoji } from "react-emoji-render";
import type { RoomPage_RoomDetailsFragment } from "../../../../generated/graphql";

export function RoomTitle({ roomDetails }: { roomDetails: RoomPage_RoomDetailsFragment }): JSX.Element {
    const sponsorLogoUrl = useMemo((): string | null => {
        try {
            if (!roomDetails.originatingItem?.elements || !roomDetails.originatingItem.elements.length) {
                return null;
            }

            const dataBlob = roomDetails.originatingItem.elements[0].data;

            if (!isElementDataBlob(dataBlob)) {
                return null;
            }

            const elementDataBlob = dataBlob as ElementDataBlob;

            const latestVersion = R.last(elementDataBlob);

            if (!latestVersion) {
                return null;
            }

            if (
                latestVersion.data.type !== Content_ElementType_Enum.ImageUrl &&
                latestVersion.data.type !== Content_ElementType_Enum.ImageFile
            ) {
                return null;
            }

            if (latestVersion.data.type === Content_ElementType_Enum.ImageUrl) {
                return latestVersion.data.url;
            } else {
                const { bucket, key } = new AmazonS3URI(latestVersion.data.s3Url);
                return `https://s3.${import.meta.env.SNOWPACK_PUBLIC_AWS_REGION}.amazonaws.com/${bucket}/${key}`;
            }
        } catch {
            return null;
        }
    }, [roomDetails.originatingItem?.elements]);

    return roomDetails.originatingItem ? (
        <>
            {sponsorLogoUrl ? (
                <Image
                    src={sponsorLogoUrl}
                    alt={`${roomDetails.originatingItem.title} logo`}
                    ml={5}
                    maxWidth="20rem"
                    mt={5}
                    bgColor="Room.sponsorLogoBackgroundColor"
                    p={5}
                    borderRadius="md"
                />
            ) : (
                <Heading as="h2" textAlign="left" mt={5} ml={5}>
                    <Twemoji className="twemoji" text={roomDetails.originatingItem.title} />
                </Heading>
            )}
        </>
    ) : (
        <Heading as="h1" id="page-heading" textAlign="left" mt={5} ml={5}>
            {roomDetails.name}
        </Heading>
    );
}
