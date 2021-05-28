import { gql } from "@apollo/client";
import {
    Badge,
    Button,
    Heading,
    HStack,
    Modal,
    ModalBody,
    ModalContent,
    ModalOverlay,
    Stat,
    StatLabel,
    StatNumber,
    Text,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import { Content_ElementType_Enum, ElementDataBlob, isElementDataBlob } from "@clowdr-app/shared-types/build/content";
import { ImmediateSwitchData } from "@clowdr-app/shared-types/build/video/immediateSwitchData";
import { plainToClass } from "class-transformer";
import { validateSync } from "class-validator";
import * as R from "ramda";
import React, { useMemo } from "react";
import { useLiveIndicator_GetElementQuery, useLiveIndicator_GetLatestQuery } from "../../../../../generated/graphql";
import { roundDownToNearest } from "../../../../Generic/MathUtils";
import { FAIcon } from "../../../../Icons/FAIcon";

export function formatRemainingTime(seconds: number): string {
    const NearestHoursInS = roundDownToNearest(seconds, 60 * 60);
    const IntermediateSeconds = seconds - NearestHoursInS;
    const NearestMinutesInS = roundDownToNearest(IntermediateSeconds, 60);
    const NearestSeconds = IntermediateSeconds - NearestMinutesInS;
    const Hours = (NearestHoursInS / (60 * 60)).toFixed(0).padStart(2, "0");
    const Minutes = (NearestMinutesInS / 60).toFixed(0).padStart(2, "0");
    const Seconds = NearestSeconds.toFixed(0).padStart(2, "0");
    return `${Hours}:${Minutes}:${Seconds}`;
}

export function LiveIndicator({
    live,
    now,
    secondsUntilLive,
    secondsUntilOffAir,
    eventId,
    isConnected,
}: {
    live: boolean;
    now: number;
    secondsUntilLive: number;
    secondsUntilOffAir: number;
    eventId: string;
    isConnected: boolean;
}): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const shouldModalBeOpen = isOpen && secondsUntilLive > 10;

    gql`
        query LiveIndicator_GetLatest($eventId: uuid!) {
            video_ImmediateSwitch(
                order_by: { executedAt: desc_nulls_last }
                where: { eventId: { _eq: $eventId }, executedAt: { _is_null: false } }
                limit: 1
            ) {
                id
                data
                executedAt
            }
        }

        query LiveIndicator_GetElement($elementId: uuid!) {
            content_Element_by_pk(id: $elementId) {
                id
                data
            }
        }
    `;

    const { data: latestImmediateSwitchData } = useLiveIndicator_GetLatestQuery({
        variables: {
            eventId,
        },
        pollInterval: 10000,
    });

    const latestSwitchData = useMemo(() => {
        if (!latestImmediateSwitchData?.video_ImmediateSwitch?.length) {
            return null;
        }

        const transformed = plainToClass(ImmediateSwitchData, {
            type: "switch",
            data: latestImmediateSwitchData.video_ImmediateSwitch[0].data,
        });

        const errors = validateSync(transformed);
        if (errors.length) {
            console.error("Invalid immediate switch", { errors, data: transformed });
            return null;
        }

        return transformed;
    }, [latestImmediateSwitchData]);

    const { data: currentElementData } = useLiveIndicator_GetElementQuery({
        variables: {
            elementId: latestSwitchData?.data.kind === "video" ? latestSwitchData.data.elementId : null,
        },
        skip: latestSwitchData?.data.kind !== "video",
    });

    const durationCurrentElement = useMemo((): number | null => {
        if (
            currentElementData?.content_Element_by_pk?.data &&
            isElementDataBlob(currentElementData.content_Element_by_pk.data)
        ) {
            const elementDataBlob: ElementDataBlob = currentElementData.content_Element_by_pk.data;
            const latestVersion = R.last(elementDataBlob);
            if (
                !latestVersion ||
                latestVersion.data.type !== Content_ElementType_Enum.VideoBroadcast ||
                !latestVersion.data.broadcastTranscode?.durationSeconds
            ) {
                return null;
            }

            return latestVersion.data.broadcastTranscode.durationSeconds;
        }
        return null;
    }, [currentElementData?.content_Element_by_pk?.data]);

    const currentInput = useMemo((): "filler" | "rtmp_push" | "video" | "video_ending" | null => {
        if (!latestSwitchData) {
            return "rtmp_push";
        }

        switch (latestSwitchData.data.kind) {
            case "filler":
                return "filler";
            case "rtmp_push":
                return "rtmp_push";
            case "video": {
                if (!latestImmediateSwitchData?.video_ImmediateSwitch?.[0]?.executedAt) {
                    return null;
                }
                if (!durationCurrentElement) {
                    return "video";
                }
                const switchedToVideoAt = Date.parse(latestImmediateSwitchData?.video_ImmediateSwitch[0].executedAt);
                if (now - switchedToVideoAt > durationCurrentElement * 1000) {
                    return "rtmp_push";
                } else if (now - switchedToVideoAt > (durationCurrentElement - 10) * 1000) {
                    return "video_ending";
                } else {
                    return "video";
                }
            }
        }

        return null;
    }, [durationCurrentElement, latestImmediateSwitchData?.video_ImmediateSwitch, latestSwitchData, now]);

    const whatIsLiveText = useMemo(() => {
        switch (currentInput) {
            case null:
                return (
                    <>
                        <FAIcon icon="question-circle" iconStyle="s" fontSize="lg" />
                        <Text>Uncertain input</Text>
                    </>
                );
            case "filler":
                return (
                    <>
                        <FAIcon icon="play" iconStyle="s" fontSize="lg" />
                        <Text>Filler video</Text>
                    </>
                );
            case "rtmp_push":
                return (
                    <>
                        <FAIcon icon="broadcast-tower" iconStyle="s" fontSize="lg" />
                        <VStack>
                            <Text fontSize={!isConnected ? "xs" : undefined}>Backstage is live</Text>
                            {!isConnected ? <Text>You are not connected</Text> : undefined}
                        </VStack>
                    </>
                );
            case "video":
                return (
                    <>
                        <FAIcon icon="play" iconStyle="s" fontSize="lg" />
                        <Text>Pre-recorded video</Text>
                    </>
                );
            case "video_ending":
                return (
                    <>
                        <FAIcon icon="play" iconStyle="s" fontSize="lg" />
                        <Text>Pre-recorded video (ending soon)</Text>
                    </>
                );
        }
    }, [currentInput, isConnected]);

    return (
        <>
            <Modal isOpen={shouldModalBeOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalBody>
                        <VStack>
                            <Heading>
                                You will be live the moment the indicator says &ldquo;Backstage is live&rdquo;.
                            </Heading>
                            <Text>DO NOT ASK THE AUDIENCE WHEN YOU ARE LIVE!</Text>
                            <Text>
                                The audience sees the stream with a bit of lag - anywhere from 5 to 30 seconds depending
                                on where they are in the world. So they can&apos;t give you real-time feedback about the
                                stream. Also, if there were a technical glitch (meaning your stream was not live) you
                                can trust that the audience will quickly start telling you via the chat!
                            </Text>
                            <Text>
                                So please trust the countdown - it is accurate and reliable. If it says the backstage is
                                live, then you are live in front of the entire conference and should start your
                                presentation or Q&amp;A session (or whatever it is you&apos;re here to do).
                            </Text>
                            <Text>
                                Please try not to be &ldquo;that person&rdquo; that wastes the first 2 minutes of their
                                stream trying to check &ldquo;am I live&rdquo;!
                            </Text>
                            <Text>
                                (Also, please open the chat sidebar while you are off air - i.e. ahead of time!)
                            </Text>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
            {live ? (
                <HStack alignItems="stretch" justifyContent="flex-start" mx="auto" flexWrap="wrap">
                    <Badge
                        fontSize={isConnected ? "lg" : "md"}
                        colorScheme="red"
                        fontWeight="bold"
                        p="1em"
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <HStack>{whatIsLiveText}</HStack>
                    </Badge>
                    <Stat fontSize="md" ml="auto" flexGrow={1} textAlign="center">
                        <StatLabel>Time remaining until event ends</StatLabel>
                        <StatNumber>{formatRemainingTime(secondsUntilOffAir)}</StatNumber>
                    </Stat>
                </HStack>
            ) : (
                <HStack alignItems="stretch" justifyContent="flex-start" mx="auto" flexWrap="wrap">
                    {secondsUntilLive > 0 ? (
                        <>
                            <Badge
                                fontSize="lg"
                                colorScheme="blue"
                                fontWeight="bold"
                                p={4}
                                backgroundColor={
                                    secondsUntilLive < 10 ? (secondsUntilLive % 2 >= 1 ? "red" : "black") : undefined
                                }
                                color={secondsUntilLive < 10 ? "white" : undefined}
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                            >
                                <VStack>
                                    <Text fontSize={!isConnected ? "xs" : undefined}>Backstage is off-air</Text>
                                    {!isConnected ? <Text>You are not connected</Text> : undefined}
                                </VStack>
                            </Badge>
                            {secondsUntilLive < 1200 ? (
                                <Stat
                                    fontSize="md"
                                    ml="auto"
                                    flexGrow={1}
                                    textAlign="center"
                                    color={secondsUntilLive < 10 ? "white" : undefined}
                                    p={2}
                                    backgroundColor={
                                        secondsUntilLive < 10
                                            ? secondsUntilLive % 2 >= 1
                                                ? "red"
                                                : "black"
                                            : undefined
                                    }
                                >
                                    <StatLabel>Time remaining until backstage is live</StatLabel>
                                    <StatNumber>{formatRemainingTime(secondsUntilLive)}</StatNumber>
                                </Stat>
                            ) : (
                                <></>
                            )}
                            {secondsUntilLive > 10 ? (
                                <Button onClick={onOpen} h="auto" maxH="auto" p={3} colorScheme="blue" size="sm">
                                    When will I be live?
                                    <br />
                                    Click to learn.
                                </Button>
                            ) : undefined}
                        </>
                    ) : (
                        <Badge fontSize="lg" colorScheme="blue" fontWeight="bold" p={4}>
                            <Text>Backstage is off air</Text>
                        </Badge>
                    )}
                </HStack>
            )}
        </>
    );
}
