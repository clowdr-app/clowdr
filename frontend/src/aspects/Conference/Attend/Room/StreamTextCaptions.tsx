import { ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Heading, Link, Text, useColorModeValue, useToken } from "@chakra-ui/react";
import React, { useMemo } from "react";
import Color from "tinycolor2";
import { ExternalLinkButton } from "../../../Chakra/LinkButton";
import { useRestorableState } from "../../../Generic/useRestorableState";
import { FormattedMessage, useIntl } from "react-intl";

export default function StreamTextCaptions({
    streamTextEventId,
}: {
    streamTextEventId: string | undefined | null;
}): JSX.Element {
    const intl = useIntl();
    const streamTextBgColour = useColorModeValue("StreamText.backgroundColor-light", "StreamText.backgroundColor-dark");
    const streamTextFgColour = useColorModeValue("StreamText.foregroundColor-light", "StreamText.foregroundColor-dark");
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
                                colorScheme="PrimaryActionButton"
                                size="sm"
                                mr={[0, 0, 2]}
                                onClick={() => {
                                    setEnableStreamTextCaptions(false);
                                }}
                                aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.StreamTextCaptions.HideCaptions', defaultMessage: "Hide StreamText.Net live captions" })}
                            >
                                <FormattedMessage
                                    id="Conference.Attend.Room.StreamTextCaptions.Hide"
                                    defaultMessage="Hide"
                                />
                                <ChevronUpIcon fontSize="xl" m={0} ml={1} />
                            </Button>
                        ) : (
                            <Button
                                colorScheme="PrimaryActionButton"
                                size="sm"
                                mr={[0, 0, 2]}
                                onClick={() => {
                                    setEnableStreamTextCaptions(true);
                                }}
                                aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.StreamTextCaptions.ShowCaptions', defaultMessage: "Show StreamText.Net live captions" })}
                            >
                                <FormattedMessage
                                    id="Conference.Attend.Room.StreamTextCaptions.Show"
                                    defaultMessage="Show"
                                />
                                <ChevronDownIcon fontSize="xl" m={0} ml={1} />
                            </Button>
                        )}
                        <Heading as="h4" pt={2} pb={[2, 2, 0]} mx="auto" fontSize="md">
                            {
                                enableStreamTextCaptions
                                    ? intl.formatMessage({ id: 'Conference.Attend.Room.StreamTextCaptions.Captions', defaultMessage: "StreamText.Net live captions" })
                                    : intl.formatMessage({ id: 'Conference.Attend.Room.StreamTextCaptions.CaptionsAvailable', defaultMessage: "StreamText.Net live captions are available" })
                            }
                        </Heading>
                        <ExternalLinkButton
                            isExternal
                            to={src}
                            w="100%"
                            colorScheme="PrimaryActionButton"
                            size="sm"
                            linkProps={{ ml: [0, 0, 2] }}
                            aria-label={intl.formatMessage({ id: 'Conference.Attend.Room.StreamTextCaptions.CaptionsWindow', defaultMessage: "Open StreamText.Net live captions in a new window" })}
                        >
                            <FormattedMessage
                                id="Conference.Attend.Room.StreamTextCaptions.OpenNewWindow"
                                defaultMessage="Open in new window"
                            />
                            <ExternalLinkIcon ml={1} />
                        </ExternalLinkButton>
                    </Flex>
                    {enableStreamTextCaptions ? (
                        <>
                            <iframe src={src} style={{ width: "100%", height: "max(15vh, 250px)" }} />
                            <Text p={2} fontSize="xs">
                                <FormattedMessage
                                    id="Conference.Attend.Room.StreamTextCaptions.ServicedProvidedBy"
                                    defaultMessage="This service is provied by {url} and is not affiliated with Midspace. If you experience problems with the StreamText
                                    captions, please contact your conference organizers."
                                    values={{
                                        url: (
                                            <Link href="https://streamtext.net" isExternal>
                                                StreamText.Net
                                                <sup>
                                                    <ExternalLinkIcon />
                                                </sup>
                                            </Link>
                                        )
                                    }}
                                />
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
