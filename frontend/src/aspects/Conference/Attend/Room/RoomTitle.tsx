import { Heading, Image } from "@chakra-ui/react";
import type { ElementDataBlob } from "@midspace/shared-types/content";
import { Content_ElementType_Enum, isElementDataBlob } from "@midspace/shared-types/content";
import AmazonS3URI from "amazon-s3-uri";
import * as R from "ramda";
import React, { useMemo } from "react";
import { Twemoji } from "react-emoji-render";
import type { RoomPage_RoomDetailsFragment } from "../../../../generated/graphql";

export function RoomTitle({ roomDetails }: { roomDetails: RoomPage_RoomDetailsFragment }): JSX.Element {
    const sponsorLogoUrl = useMemo((): string | null => {
        try {
            if (!roomDetails.item?.elements || !roomDetails.item.elements.length) {
                return null;
            }

            const dataBlob = roomDetails.item.elements[0].data;

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
                return `https://s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${bucket}/${key}`;
            }
        } catch {
            return null;
        }
    }, [roomDetails.item?.elements]);

    return roomDetails.item ? (
        <>
            {sponsorLogoUrl ? (
                <Image
                    src={sponsorLogoUrl}
                    alt={`${roomDetails.item.title} logo`}
                    maxWidth="20rem"
                    bgColor="Room.sponsorLogoBackgroundColor"
                    p={5}
                    borderRadius="md"
                />
            ) : (
                <Heading as="h1" textAlign="left" size="lg" mr={4}>
                    <Twemoji className="twemoji" text={roomDetails.item.title} />
                </Heading>
            )}
        </>
    ) : (
        <Heading as="h1" id="page-heading" textAlign="left" size="lg" mr={4}>
            {roomDetails.name}
        </Heading>
    );
}
