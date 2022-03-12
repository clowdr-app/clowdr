import { keyframes, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import FAIcon from "../../../Chakra/FAIcon";
import { ExternalLinkButton } from "../../../Chakra/LinkButton";
import { defaultOutline_AsBoxShadow } from "../../../Chakra/Outline";
import { useRealTime } from "../../../Hooks/useRealTime";
import { formatRemainingTime } from "./formatRemainingTime";

export default function JoinZoomButton({
    zoomUrl,
    scheduledStartTime,
}: {
    zoomUrl: {
        url: string;
        name: string;
    };
    scheduledStartTime?: number;
}): JSX.Element {
    const zoomButtonBgKeyframes = keyframes`
0% {
    background-position: 0% 100%;
}
50% {
    background-position: 100% 0%;
}
100% {
    background-position: 0% 100%;
}
    `;
    const shadow = useColorModeValue("lg", "light-md");

    const now = useRealTime(1000);
    const secondsTillStartStr = scheduledStartTime
        ? formatRemainingTime((scheduledStartTime - now) / 1000, false)
        : undefined;

    return (
        <ExternalLinkButton
            to={zoomUrl.url}
            isExternal={true}
            mt={20}
            mb={4}
            mx={2}
            p={8}
            linkProps={{
                textAlign: "center",
                minH: "18em",
            }}
            whiteSpace="normal"
            h="auto"
            lineHeight="150%"
            fontSize="1.5em"
            colorScheme="PrimaryActionButton"
            color="PrimaryActionButton.textColor"
            borderRadius="2xl"
            shadow={shadow}
            animation={`${zoomButtonBgKeyframes} 10s ease-in-out infinite`}
            transition="none"
            background="linear-gradient(135deg, rgba(195,0,146,1) 20%, rgba(0,105,231,1) 50%, rgba(195,0,146,1) 80%);"
            backgroundSize="400% 400%"
            _hover={{
                background:
                    "linear-gradient(135deg, rgba(168,0,126,1) 20%, rgba(0,82,180,1) 50%, rgba(168,0,126,1) 80%);",
                backgroundSize: "400% 400%",
            }}
            _focus={{
                background:
                    "linear-gradient(135deg, rgba(168,0,126,1) 20%, rgba(0,82,180,1) 50%, rgba(168,0,126,1) 80%);",
                backgroundSize: "400% 400%",
                boxShadow: defaultOutline_AsBoxShadow,
            }}
            _active={{
                background:
                    "linear-gradient(135deg, rgba(118,0,89,1) 20%, rgba(0,55,121,1) 50%, rgba(118,0,89,1) 80%);",
                backgroundSize: "400% 400%",
            }}
        >
            <FAIcon iconStyle="s" icon="link" ml="auto" mr={4} />
            {secondsTillStartStr ? (
                <>
                    Starts in {secondsTillStartStr}
                    <br />
                </>
            ) : undefined}
            Click to join {zoomUrl.name}
            <FAIcon iconStyle="s" icon="mouse-pointer" ml={4} />
        </ExternalLinkButton>
    );
}
