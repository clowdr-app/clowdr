import { AspectRatio, Button, Center, Image, Text, Tooltip, useColorModeValue, VStack } from "@chakra-ui/react";
import { ElementDataBlob, isElementDataBlob } from "@clowdr-app/shared-types/build/content";
import AmazonS3URI from "amazon-s3-uri";
import * as R from "ramda";
import React, { useMemo } from "react";
import { useHistory } from "react-router-dom";
import { Content_ElementType_Enum, SponsorBoothsList_ItemFragment } from "../../../../../generated/graphql";
import { FAIcon } from "../../../../Icons/FAIcon";
import { useConference } from "../../../useConference";
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
                return `https://s3.${import.meta.env.SNOWPACK_PUBLIC_AWS_REGION}.amazonaws.com/${bucket}/${key}`;
            } catch {
                return null;
            }
        }
    }

    return null;
}

export default function SponsorTile({ sponsor }: { sponsor: SponsorBoothsList_ItemFragment }): JSX.Element {
    const conference = useConference();

    const shadow = useColorModeValue("md", "light-md");
    const bgColour = useColorModeValue("gray.100", "gray.800");
    const history = useHistory();
    const logoUrl = useMemo(() => (sponsor.logo.length > 0 ? getLogoUrlFromData(sponsor.logo[0].data) : null), [
        sponsor.logo,
    ]);
    return (
        <Button
            as={VStack}
            h="auto"
            border="2px solid"
            borderColor="gray.400"
            boxShadow={shadow}
            bgColor={bgColour}
            borderRadius="xl"
            w="100%"
            cursor="pointer"
            spacing={2}
            px={0}
            py={0}
            overflow="hidden"
            onClick={() => {
                if (sponsor.rooms.length > 0) {
                    history.push(`/conference/${conference.slug}/room/${sponsor.rooms[0].id}`);
                } else {
                    history.push(`/conference/${conference.slug}/item/${sponsor.id}`);
                }
            }}
            pos="relative"
        >
            <Tooltip label={sponsor.title}>
                {logoUrl ? (
                    <Image src={logoUrl} alt={sponsor.title} maxW="100%" maxH="100%" objectFit="contain" />
                ) : (
                    <AspectRatio ratio={16 / 9} w="100%" bgColor="gray.50" color="black">
                        <Center>
                            <Text whiteSpace="normal" fontSize="2xl">
                                {sponsor.title}
                            </Text>
                        </Center>
                    </AspectRatio>
                )}
            </Tooltip>
            <FAIcon iconStyle="s" icon="star" color="gold" pos="absolute" top={0} left={2} fontSize="xl" />
            {sponsor.rooms.length > 0 ? <RoomPresenceGrid roomId={sponsor.rooms[0].id} noGapFill /> : undefined}
        </Button>
    );
}
