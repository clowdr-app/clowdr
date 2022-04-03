import { Image } from "@chakra-ui/react";
import type { ElementDataBlob } from "@midspace/shared-types/content";
import { isElementDataBlob } from "@midspace/shared-types/content";
import AmazonS3URI from "amazon-s3-uri";
import * as R from "ramda";
import React, { useMemo } from "react";
import type { SponsorBoothsList_ItemFragment } from "../../../../generated/graphql";
import { Content_ElementType_Enum } from "../../../../generated/graphql";
import Card from "../../../Card";
import { useAuthParameters } from "../../../GQL/AuthParameters";
import RoomPresenceGrid from "./RoomPresenceGrid";

function getLogoUrlFromData(data: any): string | null {
    if (isElementDataBlob(data)) {
        const blob = data as ElementDataBlob;
        const latestData = R.last(blob)?.data;

        if (latestData?.type === Content_ElementType_Enum.ImageUrl) {
            return latestData.url;
        } else if (latestData?.type === Content_ElementType_Enum.ImageFile) {
            try {
                const { bucket, key } = new AmazonS3URI(latestData.s3Url);
                return `https://s3.${import.meta.env.VITE_AWS_REGION}.amazonaws.com/${bucket}/${key}`;
            } catch {
                return null;
            }
        }
    }

    return null;
}

export default function SponsorTile({
    sponsor,
    showLogo = true,
}: {
    sponsor: SponsorBoothsList_ItemFragment;
    showLogo?: boolean;
}): JSX.Element {
    const { conferencePath } = useAuthParameters();

    const logoUrl = useMemo(
        () => (sponsor.logo.length > 0 ? getLogoUrlFromData(sponsor.logo[0].data) : null),
        [sponsor.logo]
    );
    return (
        <Card
            h="auto"
            heading={sponsor.title}
            to={sponsor.room ? `${conferencePath}/room/${sponsor.room.id}` : `${conferencePath}/item/${sponsor.id}`}
            pos="relative"
            w="100%"
        >
            {logoUrl && showLogo ? (
                <Image src={logoUrl} alt={sponsor.title} p={5} maxW="100%" maxH="100%" objectFit="contain" />
            ) : undefined}
            {/* <FAIcon iconStyle="s" icon="star" color="gold" pos="absolute" top={0} left={2} fontSize="xl" /> */}
            {sponsor.room ? <RoomPresenceGrid roomId={sponsor.room.id} noGapFill /> : undefined}
        </Card>
    );
}
