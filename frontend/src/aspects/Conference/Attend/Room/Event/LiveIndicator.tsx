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
import React from "react";
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
    secondsUntilLive,
    secondsUntilOffAir,
}: {
    live: boolean;
    secondsUntilLive: number;
    secondsUntilOffAir: number;
}): JSX.Element {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const shouldModalBeOpen = isOpen && secondsUntilLive > 10;

    return (
        <>
            <Modal isOpen={shouldModalBeOpen} onClose={onClose} isCentered>
                <ModalOverlay />
                <ModalContent>
                    <ModalBody>
                        <VStack>
                            <Heading>
                                You will be live the moment the indicator says &ldquo;You are live&rdquo;.
                            </Heading>
                            <Text>DO NOT ASK THE AUDIENCE WHEN YOU ARE LIVE!</Text>
                            <Text>
                                The audience sees the stream with a bit of lag - anywhere from 5 to 30 seconds depending
                                on where they are in the world. So they can&apos;t give you real-time feedback about the
                                stream. Also, if there were a technical glitch (meaning your stream was not live) you
                                can trust that the audience will quickly start telling you via the chat!
                            </Text>
                            <Text>
                                So please trust the countdown - it is accurate and reliable. If it says you are live,
                                then you are live in front of the entire conference and should start your presentation
                                or Q&amp;A session (or whatever it is you&apos;re here to do).
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
                <HStack alignItems="flex-start" justifyContent="flex-start" mx="auto">
                    <Badge fontSize="lg" colorScheme="red" fontWeight="bold" p={4}>
                        <HStack>
                            <FAIcon icon="broadcast-tower" iconStyle="s" fontSize="lg" />
                            <Text mx={2}>You are live</Text>
                        </HStack>
                    </Badge>
                    <Stat fontSize="md" ml="auto" flexGrow={1} textAlign="center">
                        <StatLabel>Time remaining until you are off-air</StatLabel>
                        <StatNumber>{formatRemainingTime(secondsUntilOffAir)}</StatNumber>
                    </Stat>
                </HStack>
            ) : (
                <HStack alignItems="stretch" justifyContent="flex-start" mx="auto">
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
                                <Text>You are off-air</Text>
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
                                    <StatLabel>Time remaining until you are live</StatLabel>
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
                            <Text>You are off air</Text>
                        </Badge>
                    )}
                </HStack>
            )}
        </>
    );
}
