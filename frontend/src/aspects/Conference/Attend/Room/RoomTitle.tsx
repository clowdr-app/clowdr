import { Heading, Image } from "@chakra-ui/react";
import { ContentItemDataBlob, ContentType_Enum, isContentItemDataBlob } from "@clowdr-app/shared-types/build/content";
import * as R from "ramda";
import React, { useMemo } from "react";
import type { RoomPage_RoomDetailsFragment } from "../../../../generated/graphql";

export function RoomTitle({ roomDetails }: { roomDetails: RoomPage_RoomDetailsFragment }): JSX.Element {
    const sponsorLogoUrl = useMemo((): string | null => {
        if (
            !roomDetails.originatingContentGroup?.contentItems ||
            !roomDetails.originatingContentGroup.contentItems.length
        ) {
            return null;
        }

        const dataBlob = roomDetails.originatingContentGroup.contentItems[0].data;

        if (!isContentItemDataBlob(dataBlob)) {
            return null;
        }

        const contentItemDataBlob = dataBlob as ContentItemDataBlob;

        const latestVersion = R.last(contentItemDataBlob);

        if (!latestVersion) {
            return null;
        }

        if (latestVersion.data.type !== ContentType_Enum.ImageUrl) {
            return null;
        }

        return latestVersion.data.url;
    }, [roomDetails.originatingContentGroup?.contentItems]);

    return roomDetails.originatingContentGroup ? (
        <>
            {sponsorLogoUrl ? (
                <Image src={sponsorLogoUrl} ml={5} maxWidth="20rem" mt={5} bgColor="white" p={5} borderRadius="md" />
            ) : (
                <></>
            )}
            <Heading as="h2" textAlign="left" mt={5} ml={5}>
                {roomDetails.originatingContentGroup.title}
            </Heading>
        </>
    ) : (
        <Heading as="h2" textAlign="left" mt={5} ml={5}>
            {roomDetails.name}
        </Heading>
    );
}
