import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Heading, Link, Text, useColorModeValue, useToken } from "@chakra-ui/react";
import React, { useMemo } from "react";
import Color from "tinycolor2";
import { ExternalLinkButton } from "../../../Chakra/LinkButton";
import { useRestorableState } from "../../../Generic/useRestorableState";

export default function StreamTextCaptions({
    streamTextEventId,
}: {
    streamTextEventId: string | undefined | null;
}): JSX.Element {
    const streamTextBgColour = useColorModeValue("gray.50", "gray.900");
    const streamTextFgColour = useColorModeValue("black", "white");
    const streamTextBgColourRaw = useToken("colors", streamTextBgColour);
    const streamTextFgColourRaw = useToken("colors", streamTextFgColour);
    const [enableStreamTextCaptions, setEnableStreamTextCaptions] = useRestorableState<boolean>(
        "enableStreamTextCaptions",
        true,
        (v) => (v ? "true" : "false"),
        (v) => v === "true"
    );
    const streamTextEl = useMemo(() => {
        if (streamTextEventId) {
            const bgColourObj = Color(streamTextBgColourRaw);
            const fgColourObj = Color(streamTextFgColourRaw);
            const bgColourHex = bgColourObj.toHex();
            const fgColourHex = fgColourObj.toHex();
            const src = `//www.streamtext.net/player/?event=${streamTextEventId}&title=false&chat=false&footer=false&bgc=${bgColourHex}&fgc=${fgColourHex}`;
            return (
                <Box border="1px solid" borderColor={fgColourHex}>
                    <Flex
                        flexWrap="wrap"
                        pb={enableStreamTextCaptions ? 2 : 0}
                        flexDir={["column", "column", "row"]}
                        justifyContent="stretch"
                    >
                        {enableStreamTextCaptions ? (
                            <Button
                                colorScheme="purple"
                                size="sm"
                                mr={[0, 0, 2]}
                                onClick={() => {
                                    setEnableStreamTextCaptions(false);
                                }}
                                aria-label="Hide StreamText.Net live captions"
                            >
                                Hide
                                <ChevronUpIcon fontSize="xl" m={0} ml={1} />
                            </Button>
                        ) : (
                            <Button
                                colorScheme="purple"
                                size="sm"
                                mr={[0, 0, 2]}
                                onClick={() => {
                                    setEnableStreamTextCaptions(true);
                                }}
                                aria-label="Show StreamText.Net live captions"
                            >
                                Show
                                <ChevronDownIcon fontSize="xl" m={0} ml={1} />
                            </Button>
                        )}
                        <Heading as="h4" pt={2} pb={[2, 2, 0]} mx="auto" fontSize="md">
                            StreamText.Net live captions{enableStreamTextCaptions ? "" : " are available"}
                        </Heading>
                        <ExternalLinkButton
                            isExternal
                            to={src}
                            w="100%"
                            colorScheme="purple"
                            size="sm"
                            linkProps={{ ml: [0, 0, 2] }}
                            aria-label="Open StreamText.Net live captions in a new window"
                        >
                            Open in new window
                            <ExternalLinkIcon ml={1} />
                        </ExternalLinkButton>
                    </Flex>
                    {enableStreamTextCaptions ? (
                        <>
                            <iframe src={src} style={{ width: "100%", height: "max(15vh, 250px)" }} />
                            <Text p={2} fontSize="xs">
                                This service is provied by{" "}
                                <Link href="https://streamtext.net" isExternal>
                                    StreamText.Net
                                    <sup>
                                        <ExternalLinkIcon />
                                    </sup>
                                </Link>{" "}
                                and is not affiliated with Midspace. If you experience problems with the StreamText
                                captions, please contact your conference organizers.
                            </Text>
                        </>
                    ) : undefined}
                </Box>
            );
        }
        return <></>;
    }, [
        streamTextEventId,
        streamTextBgColourRaw,
        streamTextFgColourRaw,
        enableStreamTextCaptions,
        setEnableStreamTextCaptions,
    ]);

    return streamTextEl;
}
