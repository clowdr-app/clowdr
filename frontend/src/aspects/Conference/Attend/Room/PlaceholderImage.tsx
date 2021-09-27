import { Box, Image } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { backgroundImage } from "../../../Vonage/resources";
import { useRegistrant } from "../../RegistrantsContext";

export default function PlaceholderImage({
    connectionData,
    zIndex,
}: {
    connectionData?: string;
    zIndex?: number;
}): JSX.Element {
    const registrantIdObj = useMemo(() => {
        if (!connectionData) {
            return null;
        }
        try {
            const data = JSON.parse(connectionData);
            return data["registrantId"] ? { registrant: data["registrantId"] } : null;
        } catch (e) {
            console.warn("Couldn't parse registrant ID from Vonage subscriber data");
            return null;
        }
    }, [connectionData]);

    const registrant = useRegistrant(registrantIdObj);

    return registrant?.profile?.photoURL_350x350 ? (
        <Image
            position="absolute"
            width="100%"
            height="100%"
            objectFit="cover"
            objectPosition="center"
            top="0"
            left="0"
            src={registrant?.profile.photoURL_350x350}
            overflow="hidden"
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
