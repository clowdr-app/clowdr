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
    useColorModeValue,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import { Content_ElementType_Enum, ElementDataBlob, isElementDataBlob } from "@clowdr-app/shared-types/build/content";
import { ImmediateSwitchData } from "@clowdr-app/shared-types/build/video/immediateSwitchData";
import { plainToClass } from "class-transformer";
import { validateSync } from "class-validator";
import * as R from "ramda";
import React, { useMemo } from "react";
import { useLiveIndicator_GetElementQuery, useLiveIndicator_GetLatestQuery } from "../../../../../../generated/graphql";
import { FAIcon } from "../../../../../Icons/FAIcon";
import { formatRemainingTime } from "../../formatRemainingTime";
import StreamPreview from "./StreamPreview";

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

export function LiveIndicator({
    live,
    now,
    secondsUntilLive,
    secondsUntilOffAir,
    eventId,
    isConnected,
    hlsUri,
}: {
    live: boolean;
    now: number;
    secondsUntilLive: number;
    secondsUntilOffAir: number;
    eventId: string;
    isConnected: boolean;
    hlsUri: string | undefined;
}): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const shouldModalBeOpen = isOpen && secondsUntilLive > 10;

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

    const { data: _currentElementData } = useLiveIndicator_GetElementQuery({
        variables: {
            elementId: latestSwitchData?.data.kind === "video" ? latestSwitchData.data.elementId : null,
        },
        skip: latestSwitchData?.data.kind !== "video",
    });
    const currentElementData = latestSwitchData?.data.kind === "video" ? _currentElementData : undefined;

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

    const currentInput = useMemo(():
        | "filler"
        | "rtmp_push"
        | "video"
        | "video_ending"
        | "video_unknown_duration"
        | null => {
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
                    return "video_unknown_duration";
                }
                const switchedToVideoAt = Date.parse(latestImmediateSwitchData.video_ImmediateSwitch[0].executedAt);
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
                        <Text>Video</Text>
                    </>
                );
            case "video_unknown_duration":
                return (
                    <>
                        <FAIcon icon="play" iconStyle="s" fontSize="lg" />
                        <Text>Video or live</Text>
                        <Text fontSize="xs">Unable to load video duration; the backstage may be live again.</Text>
                    </>
                );
            case "video_ending":
                return (
                    <>
                        <FAIcon icon="play" iconStyle="s" fontSize="lg" />
                        <Text>Video (ending soon)</Text>
                    </>
                );
        }
    }, [currentInput, isConnected]);

    const bgColor = useColorModeValue("gray.100", "gray.800");
    const infoModal = useMemo(
        () => (
            <Modal isOpen={shouldModalBeOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalBody>
                        <VStack>
                            <Heading fontSize="lg">
                                You will be live the moment the indicator says &ldquo;Backstage is live&rdquo;.
                            </Heading>
                            <Text>Please avoid asking the audience when you are live.</Text>
                            <Text>
                                The audience sees the stream with a bit of lag - anywhere from 5 to 30 seconds depending
                                on where they are in the world. So they can&apos;t give you real-time feedback about the
                                stream. Also, if there were a technical glitch (meaning your stream was not live) you
                                can trust that the audience will quickly start telling you via the chat.
                            </Text>
                            <Text>
                                If the countdown says the backstage is live and you are connected, then you are live in
                                front of the entire conference and should start your presentation or Q&amp;A session.
                            </Text>
                            <Text>(Also, please open the chat sidebar ahead of time, while you are off air.)</Text>
                        </VStack>
                    </ModalBody>
                </ModalContent>
            </Modal>
        ),
        [onClose, shouldModalBeOpen]
    );
    const liveIndicactor = useMemo(
        () =>
            live ? (
                <HStack
                    alignItems="stretch"
                    justifyContent="flex-start"
                    mx="auto"
                    flexWrap="wrap"
                    pos="sticky"
                    top={0}
                    bgColor={bgColor}
                    zIndex={10000}
                    overflow="visible"
                >
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
                        <StatLabel>Time until end</StatLabel>
                        <StatNumber>{formatRemainingTime(secondsUntilOffAir)}</StatNumber>
                    </Stat>
                </HStack>
            ) : (
                <HStack
                    alignItems="stretch"
                    justifyContent="flex-start"
                    mx="auto"
                    flexWrap="wrap"
                    pos="sticky"
                    top={0}
                    bgColor={bgColor}
                    zIndex={10000}
                    overflow="visible"
                >
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
                                    <StatLabel>Time until start</StatLabel>
                                    <StatNumber>{formatRemainingTime(secondsUntilLive)}</StatNumber>
                                </Stat>
                            ) : (
                                <></>
                            )}
                            {secondsUntilLive > 10 ? (
                                <Button onClick={onOpen} h="auto" maxH="auto" p={3} colorScheme="blue" size="sm">
                                    What should I do?
                                </Button>
                            ) : undefined}
                        </>
                    ) : (
                        <Badge fontSize="lg" colorScheme="blue" fontWeight="bold" p={4}>
                            <Text>Backstage is off air</Text>
                        </Badge>
                    )}
                </HStack>
            ),
        [bgColor, isConnected, live, onOpen, secondsUntilLive, secondsUntilOffAir, whatIsLiveText]
    );
    const isLiveOnAir = live && currentInput !== "video" && currentInput !== "filler";
    const streamPreview = useMemo(
        () => <StreamPreview hlsUri={hlsUri} isLive={live} isLiveOnAir={isLiveOnAir} />,
        [hlsUri, live, isLiveOnAir]
    );

    return (
        <>
            {streamPreview}
            {liveIndicactor}
            {infoModal}
        </>
    );
}
