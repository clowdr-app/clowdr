import { gql } from "@apollo/client";
import {
    Badge,
    Button,
    HStack,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Stat,
    StatLabel,
    StatNumber,
    Text,
    useColorModeValue,
    useDisclosure,
    VStack,
} from "@chakra-ui/react";
import type { ElementDataBlob } from "@clowdr-app/shared-types/build/content";
import { Content_ElementType_Enum, isElementDataBlob } from "@clowdr-app/shared-types/build/content";
import { ImmediateSwitchData } from "@clowdr-app/shared-types/build/video/immediateSwitchData";
import { plainToClass } from "class-transformer";
import { validateSync } from "class-validator";
import * as R from "ramda";
import React, { useMemo } from "react";
import type { RoomEventDetailsFragment } from "../../../../../../generated/graphql";
import { useLiveIndicator_GetElementQuery, useLiveIndicator_GetLatestQuery } from "../../../../../../generated/graphql";
import { useRealTime } from "../../../../../Generic/useRealTime";
import { FAIcon } from "../../../../../Icons/FAIcon";
import { formatRemainingTime } from "../../formatRemainingTime";
import StreamPreview from "./StreamPreview";
import { FormattedMessage, useIntl } from "react-intl";

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
    isConnected,
    hlsUri,
    event,
}: {
    isConnected: boolean;
    hlsUri: string | undefined;
    event: RoomEventDetailsFragment;
}): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();

    const startTime = useMemo(() => Date.parse(event.startTime), [event.startTime]);
    const endTime = useMemo(() => Date.parse(event.endTime), [event.endTime]);
    const realNow = useRealTime(1000);
    const now = realNow + 2000; // adjust for expected RTMP delay
    const live = now >= startTime && now <= endTime;
    const secondsUntilLive = (startTime - now) / 1000;
    const secondsUntilOffAir = (endTime - now) / 1000;
    const shouldModalBeOpen = isOpen && secondsUntilLive > 10;

    const { data: latestImmediateSwitchData } = useLiveIndicator_GetLatestQuery({
        variables: {
            eventId: event.id,
        },
        pollInterval: 30000,
        skip: !isConnected,
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
                        <Text>
                            <FormattedMessage
                                id="Conference.Attend.Room.Stream.Controls.LiveIndicator.UncertainInput"
                                defaultMessage="Uncertain input"
                            />
                        </Text>
                    </>
                );
            case "filler":
                return (
                    <>
                        <FAIcon icon="play" iconStyle="s" fontSize="lg" />
                        <Text>
                            <FormattedMessage
                                id="Conference.Attend.Room.Stream.Controls.LiveIndicator.FillerVideo"
                                defaultMessage="Filler video"
                            />
                        </Text>
                    </>
                );
            case "rtmp_push":
                return (
                    <>
                        <FAIcon icon="broadcast-tower" iconStyle="s" fontSize="lg" />
                        <VStack>
                            <Text fontSize={!isConnected ? "xs" : undefined}>
                                <FormattedMessage
                                    id="Conference.Attend.Room.Stream.Controls.LiveIndicator.BackstageIsLive"
                                    defaultMessage="Backstage is live"
                                />
                            </Text>
                            {!isConnected
                                ?
                                    <Text>
                                        <FormattedMessage
                                            id="Conference.Attend.Room.Stream.Controls.LiveIndicator.YoureNotConnected"
                                            defaultMessage="You are not connected"
                                        />
                                    </Text>
                                : undefined}
                        </VStack>
                    </>
                );
            case "video":
                return (
                    <>
                        <FAIcon icon="play" iconStyle="s" fontSize="lg" />
                        <Text>
                            <FormattedMessage
                                id="Conference.Attend.Room.Stream.Controls.LiveIndicator.Video"
                                defaultMessage="Video"
                            />
                        </Text>
                    </>
                );
            case "video_unknown_duration":
                return (
                    <>
                        <VStack>
                            <HStack>
                                <FAIcon icon="play" iconStyle="s" fontSize="lg" />
                                <Text>
                                    <FormattedMessage
                                        id="Conference.Attend.Room.Stream.Controls.LiveIndicator.VideoOrLive"
                                        defaultMessage="Video or live"
                                    />
                                </Text>
                            </HStack>
                            <Text fontSize="xs" textTransform="none">
                                <FormattedMessage
                                    id="Conference.Attend.Room.Stream.Controls.LiveIndicator.VideoDurationUnknown"
                                    defaultMessage="Video duration unknown (not prepared for broadcast);"
                                />
                                <br />
                                <FormattedMessage
                                    id="Conference.Attend.Room.Stream.Controls.LiveIndicator.BackstageMayBeLive"
                                    defaultMessage="the backstage may be live again."
                                />
                            </Text>
                        </VStack>
                    </>
                );
            case "video_ending":
                return (
                    <>
                        <FAIcon icon="play" iconStyle="s" fontSize="lg" />
                        <Text>
                            <FormattedMessage
                                id="Conference.Attend.Room.Stream.Controls.LiveIndicator.VideoEnding"
                                defaultMessage="Video (ending soon)"
                            />
                        </Text>
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
                    <ModalHeader>
                        <FormattedMessage
                            id="Conference.Attend.Room.Stream.Controls.LiveIndicator.YoullBeLive"
                            defaultMessage='You will be live the moment the indicator says "Backstage is live".'
                        />
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack alignItems="left" spacing={6}>
                            <VStack alignItems="left" spacing={1}>
                                <Text fontWeight="bold">
                                    <FormattedMessage
                                        id='Conference.Attend.Room.Stream.Controls.LiveIndicator.AudienceSeesDelay'
                                        defaultMessage='The audience sees the stream with a bit of delay.'
                                    />
                                </Text>
                                <Text>
                                    <FormattedMessage
                                        id='Conference.Attend.Room.Stream.Controls.LiveIndicator.DelayNotice'
                                        defaultMessage="This is normally 5-30 seconds depending on where they are in the world. Don't
                                        wait for the audience to tell you they can see you - or they will see you sitting
                                        there silently for up to thirty seconds!"
                                    />
                                </Text>
                            </VStack>
                            <VStack alignItems="left" spacing={1}>
                                <Text fontWeight="bold">
                                    <FormattedMessage
                                        id='Conference.Attend.Room.Stream.Controls.LiveIndicator.PayAttentionClock'
                                        defaultMessage="Pay attention to the countdown clock."
                                    />
                                </Text>
                                <Text>
                                    <FormattedMessage
                                        id='Conference.Attend.Room.Stream.Controls.LiveIndicator.BackstageLiveMessage'
                                        defaultMessage='If it says the backstage is live, then you are live in front of the entire
                                        conference and should start your presentation or Q&A session.'
                                    />
                                </Text>
                            </VStack>
                            <VStack alignItems="left" spacing={1}>
                                <Text fontWeight="bold">
                                    <FormattedMessage
                                        id='Conference.Attend.Room.Stream.Controls.LiveIndicator.OpenChatSidebar'
                                        defaultMessage='Open the chat sidebar now.'
                                    />
                                </Text>
                                <Text>
                                    <FormattedMessage
                                        id='Conference.Attend.Room.Stream.Controls.LiveIndicator.GoodIdeaChatOpen'
                                        defaultMessage="It's a good idea to have the chat open so that you can read feedback from the
                                        audience."
                                    />
                                </Text>
                            </VStack>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button size="sm" colorScheme="PrimaryActionButton" onClick={onClose}>
                            <FormattedMessage
                                id='Conference.Attend.Room.Stream.Controls.LiveIndicator.Close'
                                defaultMessage='Close'
                            />
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        ),
        [onClose, shouldModalBeOpen]
    );
    const liveIndicactor = useMemo(
        () =>
            live ? (
                <>
                    <Badge
                        fontSize={isConnected ? "lg" : "md"}
                        colorScheme="Backstage-LiveIndicator-OnAirLabel"
                        fontWeight="bold"
                        p="1em"
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                    >
                        <HStack>{whatIsLiveText}</HStack>
                    </Badge>
                    <Stat fontSize="md" ml="auto" flexGrow={1} textAlign="center" p="2px">
                        <StatLabel>
                            <FormattedMessage
                                id='Conference.Attend.Room.Stream.Controls.LiveIndicator.TimeUntilEnd'
                                defaultMessage='Time until end'
                            />
                        </StatLabel>
                        <StatNumber>{formatRemainingTime(secondsUntilOffAir)}</StatNumber>
                    </Stat>
                </>
            ) : (
                <>
                    {secondsUntilLive > 0 ? (
                        <>
                            <Badge
                                fontSize="lg"
                                colorScheme="Backstage-LiveIndicator-OffAirLabel"
                                fontWeight="bold"
                                p={4}
                                backgroundColor={
                                    secondsUntilLive < 10
                                        ? secondsUntilLive % 2 >= 1
                                            ? "Backstage-LiveIndicator-10sCountdown.backgroundColor1"
                                            : "Backstage-LiveIndicator-10sCountdown.backgroundColor2"
                                        : undefined
                                }
                                color={
                                    secondsUntilLive < 10 ? "Backstage-LiveIndicator-10sCountdown.textColor" : undefined
                                }
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                            >
                                <VStack>
                                    <Text fontSize={!isConnected ? "xs" : undefined}>
                                        <FormattedMessage
                                            id='Conference.Attend.Room.Stream.Controls.LiveIndicator.BackstageOffAir'
                                            defaultMessage='Backstage is off-air'
                                        />
                                    </Text>
                                    {!isConnected
                                        ? <Text>
                                                <FormattedMessage
                                                    id='Conference.Attend.Room.Stream.Controls.LiveIndicator.YoureNotConnected'
                                                    defaultMessage='You are not connected'
                                                />
                                          </Text>
                                        : undefined}
                                </VStack>
                            </Badge>
                            {secondsUntilLive < 1200 ? (
                                <Stat
                                    fontSize="md"
                                    ml="auto"
                                    flexGrow={1}
                                    textAlign="center"
                                    color={
                                        secondsUntilLive < 10
                                            ? "Backstage-LiveIndicator-10sCountdown.textColor"
                                            : undefined
                                    }
                                    backgroundColor={
                                        secondsUntilLive < 10
                                            ? secondsUntilLive % 2 >= 1
                                                ? "Backstage-LiveIndicator-10sCountdown.backgroundColor1"
                                                : "Backstage-LiveIndicator-10sCountdown.backgroundColor2"
                                            : undefined
                                    }
                                    p="2px"
                                    display="flex"
                                    flexDir="column"
                                    justifyContent="center"
                                >
                                    <StatLabel>
                                        <FormattedMessage
                                            id='Conference.Attend.Room.Stream.Controls.LiveIndicator.TimeUntilStart'
                                            defaultMessage='Time until start'
                                        />
                                    </StatLabel>
                                    <StatNumber
                                        css={{
                                            fontFeatureSettings: "tnum",
                                            fontVariantNumeric: "tabular-nums",
                                        }}
                                    >
                                        {formatRemainingTime(secondsUntilLive)}
                                    </StatNumber>
                                </Stat>
                            ) : (
                                <></>
                            )}
                            {secondsUntilLive > 10 ? (
                                <Button
                                    onClick={onOpen}
                                    h="auto"
                                    maxH="auto"
                                    p={3}
                                    colorScheme="SecondaryActionButton"
                                    size="sm"
                                    whiteSpace="normal"
                                    wordWrap="break-word"
                                    flexShrink={1}
                                    maxW="15ch"
                                >
                                    <FormattedMessage
                                        id='Conference.Attend.Room.Stream.Controls.LiveIndicator.HowDoIUse'
                                        defaultMessage='How do I use the backstage?'
                                    />
                                </Button>
                            ) : undefined}
                        </>
                    ) : (
                        <Badge fontSize="lg" colorScheme="SecondaryActionButton" fontWeight="bold" p={4}>
                            <Text>
                                <FormattedMessage
                                    id='Conference.Attend.Room.Stream.Controls.LiveIndicator.OffTheAir'
                                    defaultMessage='Backstage is off air'
                                />
                            </Text>
                        </Badge>
                    )}
                </>
            ),
        [isConnected, live, onOpen, secondsUntilLive, secondsUntilOffAir, whatIsLiveText]
    );
    const isLiveOnAir = live && currentInput !== "video" && currentInput !== "filler";
    const streamPreview = useMemo(
        () => <StreamPreview hlsUri={hlsUri} isLive={live} isLiveOnAir={isLiveOnAir} />,
        [hlsUri, live, isLiveOnAir]
    );

    return (
        <HStack
            alignItems="flex-start"
            justifyContent="flex-start"
            mx="auto"
            flexWrap="wrap"
            pos="sticky"
            top={0}
            zIndex={10000}
            overflow="visible"
            gridRowGap={2}
        >
            {streamPreview}
            <HStack
                p={1}
                bgColor={bgColor}
                alignItems="flex-start"
                justifyContent="flex-start"
                mx="auto"
                flexWrap="wrap"
                pos="sticky"
                top={0}
                zIndex={10000}
                overflow="visible"
                gridRowGap={2}
            >
                {liveIndicactor}
                {infoModal}
            </HStack>
        </HStack>
    );
}
