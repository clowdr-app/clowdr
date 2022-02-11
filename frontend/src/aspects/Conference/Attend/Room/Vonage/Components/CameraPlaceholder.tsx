import { Box, Image } from "@chakra-ui/react";
import React from "react";
import type { RegistrantDataFragment } from "../../../../../../generated/graphql";
import { backgroundImage } from "../resources";

export default function CameraPlaceholderImage({
    zIndex,
    registrant,
}: {
    zIndex?: number;
    registrant?: RegistrantDataFragment | null;
}): JSX.Element {
    return registrant?.profile?.photoURL_350x350 ? (
        <Image
            position="absolute"
            top={0}
            left={0}
            w="100%"
            h="100%"
            overflow="hidden"
            objectFit="cover"
            objectPosition="center"
            src={registrant?.profile.photoURL_350x350}
            alt={`Profile picture of ${registrant?.displayName}`}
            opacity={0.8}
            zIndex={zIndex}
        />
    ) : (
        <Box
            position="absolute"
            width="100%"
            height="100%"
            bgColor="black"
            bgImage={backgroundImage}
            bgRepeat="no-repeat"
            bgSize="auto 76%"
            bgPos="center bottom"
            opacity="0.25"
            top="0"
            zIndex={zIndex}
        />
    );
}
