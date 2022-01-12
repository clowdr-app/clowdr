import { AspectRatio, Button, Center, Image, Text, Tooltip, useColorModeValue, VStack } from "@chakra-ui/react";
import type { ElementDataBlob } from "@midspace/shared-types/content";
import { isElementDataBlob } from "@midspace/shared-types/content";
import AmazonS3URI from "amazon-s3-uri";
import * as R from "ramda";
import React, { useMemo } from "react";
import { useHistory } from "react-router-dom";
import type { SponsorBoothsList_ItemFragment } from "../../../../../generated/graphql";
import { Content_ElementType_Enum } from "../../../../../generated/graphql";
import { defaultOutline_AsBoxShadow } from "../../../../Chakra/Outline";
import { useAuthParameters } from "../../../../GQL/AuthParameters";
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

export default function SponsorTile({ sponsor }: { sponsor: SponsorBoothsList_ItemFragment }): JSX.Element {
    const { conferencePath } = useAuthParameters();

    const shadow = useColorModeValue("md", "light-md");
    const history = useHistory();
    const logoUrl = useMemo(
        () => (sponsor.logo.length > 0 ? getLogoUrlFromData(sponsor.logo[0].data) : null),
        [sponsor.logo]
    );
    return (
        <Button
            as={VStack}
            h="auto"
            border="2px solid"
            borderColor="gray.400"
            boxShadow={shadow}
            borderRadius="xl"
            w="100%"
            cursor="pointer"
            spacing={2}
            p={0}
            m="3px"
            overflow="hidden"
            onClick={() => {
                if (sponsor.room) {
                    history.push(`${conferencePath}/room/${sponsor.room.id}`);
                } else {
                    history.push(`${conferencePath}/item/${sponsor.id}`);
                }
            }}
            onKeyUp={(ev) => {
                if (ev.key === "Enter") {
                    if (sponsor.room) {
                        history.push(`${conferencePath}/room/${sponsor.room.id}`);
                    } else {
                        history.push(`${conferencePath}/item/${sponsor.id}`);
                    }
                }
            }}
            pos="relative"
            bgColor="gray.50"
            _hover={{
                bgColor: "gray.100",
            }}
            _focus={{
                bgColor: "gray.100",
                boxShadow: defaultOutline_AsBoxShadow,
            }}
            _active={{
                bgColor: "gray.200",
            }}
            color="black"
            tabIndex={0}
        >
            <Tooltip label={sponsor.title}>
                {logoUrl ? (
                    <Image src={logoUrl} alt={sponsor.title} p={5} maxW="100%" maxH="100%" objectFit="contain" />
                ) : (
                    <AspectRatio ratio={16 / 9} w="100%">
                        <Center>
                            <Text whiteSpace="normal" fontSize="2xl">
                                {sponsor.title}
                            </Text>
                        </Center>
                    </AspectRatio>
                )}
            </Tooltip>
            {/* <FAIcon iconStyle="s" icon="star" color="gold" pos="absolute" top={0} left={2} fontSize="xl" /> */}
            {sponsor.room ? <RoomPresenceGrid roomId={sponsor.room.id} noGapFill /> : undefined}
        </Button>
    );
}
