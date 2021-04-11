import { Box } from "@chakra-ui/react";
import React from "react";
import { backgroundImage } from "../../../Vonage/resources";

export default function PlaceholderImage(): JSX.Element {
    return (
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
        />
    );
}
