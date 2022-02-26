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
import { gql } from "@urql/core";
import React, { useMemo } from "react";
import { useContext } from "use-context-selector";
import FAIcon from "../../../../../Chakra/FAIcon";
import { formatRemainingTime } from "../../formatRemainingTime";
import { BackstageContext } from "../BackstageContext";

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
            eventId
        }
    }

    query LiveIndicator_GetElement($elementId: uuid!) {
        content_Element_by_pk(id: $elementId) {
            id
            data
        }
    }
`;

export function LiveIndicator(): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const { startTime, endTime, currentInput, now, live, connected } = useContext(BackstageContext);

    const secondsUntilLive = (startTime - now) / 1000;
    const secondsUntilOffAir = (endTime - now) / 1000;
    const shouldModalBeOpen = isOpen && secondsUntilLive > 10;

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
                            <Text fontSize={!connected ? "xs" : undefined}>Backstage is live</Text>
                            {!connected ? <Text>You are not connected</Text> : undefined}
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
                        <VStack>
                            <HStack>
                                <FAIcon icon="play" iconStyle="s" fontSize="lg" />
                                <Text>Video or live</Text>
                            </HStack>
                            <Text fontSize="xs" textTransform="none">
                                Video duration unknown (not prepared for broadcast);
                                <br />
                                the backstage may be live again.
                            </Text>
                        </VStack>
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
    }, [currentInput, connected]);

    const bgColor = useColorModeValue("gray.100", "gray.800");
    const infoModal = useMemo(
        () => (
            <Modal isOpen={shouldModalBeOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        You will be live the moment the indicator says &ldquo;Backstage is live&rdquo;.
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <VStack alignItems="left" spacing={6}>
                            <VStack alignItems="left" spacing={1}>
                                <Text fontWeight="bold">The audience sees the stream with a bit of delay.</Text>
                                <Text>
                                    This is normally 5-30 seconds depending on where they are in the world. Don&apos;t
                                    wait for the audience to tell you they can see you - or they will see you sitting
                                    there silently for up to thirty seconds!
                                </Text>
                            </VStack>
                            <VStack alignItems="left" spacing={1}>
                                <Text fontWeight="bold">Pay attention to the countdown clock.</Text>
                                <Text>
                                    If it says the backstage is live, then you are live in front of the entire
                                    conference and should start your presentation or Q&amp;A session.
                                </Text>
                            </VStack>
                            <VStack alignItems="left" spacing={1}>
                                <Text fontWeight="bold">Open the chat sidebar now.</Text>
                                <Text>
                                    It&apos;s a good idea to have the chat open so that you can read feedback from the
                                    audience.
                                </Text>
                            </VStack>
                        </VStack>
                    </ModalBody>
                    <ModalFooter>
                        <Button size="sm" colorScheme="PrimaryActionButton" onClick={onClose}>
                            Close
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
                        fontSize={connected ? "lg" : "md"}
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
                        <StatLabel>Time until end</StatLabel>
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
                                p={2}
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
                                    <Text fontSize={!connected ? "xs" : undefined}>Backstage is off-air</Text>
                                    {!connected ? <Text>You are not connected</Text> : undefined}
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
                                    <StatLabel>Time until start</StatLabel>
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
                                    flexShrink={1}
                                    maxW="15ch"
                                >
                                    How do I use the backstage?
                                </Button>
                            ) : undefined}
                        </>
                    ) : (
                        <Badge fontSize="lg" colorScheme="SecondaryActionButton" fontWeight="bold" p={2}>
                            <Text>Backstage is off air</Text>
                        </Badge>
                    )}
                </>
            ),
        [connected, live, onOpen, secondsUntilLive, secondsUntilOffAir, whatIsLiveText]
    );

    return (
        <HStack
            alignItems="flex-start"
            justifyContent="flex-start"
            mx={0}
            flexWrap="wrap"
            pos="sticky"
            top={0}
            zIndex={10000}
            overflow="visible"
            gridRowGap={2}
        >
            <HStack
                p={1}
                bgColor={bgColor}
                alignItems="center"
                justifyContent="flex-start"
                flexWrap="wrap"
                pos="sticky"
                top={0}
                zIndex={10000}
                overflow="visible"
                gridRowGap={2}
                mx={0}
            >
                {liveIndicactor}
                {infoModal}
            </HStack>
        </HStack>
    );
}
