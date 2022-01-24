import {
    Alert,
    AlertIcon,
    Box,
    Button,
    Heading,
    HStack,
    Text,
    useColorModeValue,
    useToken,
    VStack,
} from "@chakra-ui/react";
import { formatRelative } from "date-fns";
import React, { useMemo } from "react";
import { Twemoji } from "react-emoji-render";
import type { Room_EventSummaryFragment } from "../../../../../generated/graphql";
import EmojiFloatContainer from "../../../../Emoji/EmojiFloatContainer";
import { useRealTime } from "../../../../Generic/useRealTime";
import StreamTextCaptions from "../StreamTextCaptions";
import { isEventNow, isEventSoon } from "./isEventAt";
import { VonageBackstage } from "./VonageBackstage";
import { FormattedMessage, useIntl } from "react-intl";

export default function Backstage({
    event,
    selectedEventId,
    setSelectedEventId,
    roomChatId,
    onLeave,
    hlsUri,
}: {
    roomChatId: string | undefined | null;
    event: Room_EventSummaryFragment;
    selectedEventId: string | null;
    setSelectedEventId: (value: string | null) => void;
    onLeave?: () => void;
    hlsUri: string | undefined;
}): JSX.Element {
    const intl = useIntl();
    const offAirColor = useColorModeValue("Backstage.offAirBorderColor-light", "Backstage.offAirBorderColor-dark");
    const offAirBorderColour = useToken("colors", offAirColor);

    const onAirColor = useColorModeValue("Backstage.onAirBorderColor-light", "Backstage.onAirBorderColor-dark");
    const onAirBorderColour = useToken("colors", onAirColor);

    const now = useRealTime(5000);
    const isNow = isEventNow(now, event);
    const isSoon = isEventSoon(now, event);
    const isActive = isNow || isSoon;
    const category = isNow ? "Happening now" : isSoon ? "Starting soon" : "Ended";
    const borderColour = isNow ? onAirBorderColour : offAirBorderColour;
    const title = event?.item ? `${event.item.title}${event.name.length ? ` (${event.name})` : ""}` : event.name;
    const isSelected = event.id === selectedEventId;
    const summaryInfo = useMemo(
        () => (
            <HStack
                key={event.id}
                border={`1px ${borderColour} solid`}
                width="max-content"
                maxW="100%"
                w="100%"
                justifyContent="space-between"
                p={4}
                alignItems="center"
                borderRadius="md"
            >
                <Heading as="h3" size="md" width="min-content" textAlign="right" mr={8} whiteSpace="normal">
                    {category}
                </Heading>
                <VStack px={8} alignItems="left" flexGrow={1}>
                    <Heading as="h4" size="md" textAlign="left" mt={2} mb={1} whiteSpace="normal">
                        <Twemoji className="twemoji" text={title} />
                    </Heading>

                    <Text my={2} fontStyle="italic" whiteSpace="normal">
                        {formatRelative(Date.parse(event.startTime), Date.now())}
                    </Text>
                </VStack>
                <Button
                    colorScheme={isSelected ? "DestructiveActionButton" : "PrimaryActionButton"}
                    onClick={() => (isSelected ? setSelectedEventId(null) : setSelectedEventId(event.id))}
                    height="min-content"
                    py={4}
                    whiteSpace="normal"
                    variant={isSelected ? "outline" : "solid"}
                >
                    <Text fontSize="lg" whiteSpace="normal">
                        {isSelected
                            ? intl.formatMessage({ id: 'Conference.Attend.Room.Stream.Backstage.Exit', defaultMessage: "Exit this backstage" })
                            : selectedEventId
                            ? intl.formatMessage({ id: 'Conference.Attend.Room.Stream.Backstage.Switch', defaultMessage: "Switch to this backstage" })
                            : intl.formatMessage({ id: 'Conference.Attend.Room.Stream.Backstage.Show', defaultMessage: "Show this backstage" })}
                    </Text>
                </Button>
            </HStack>
        ),
        [borderColour, category, event.id, event.startTime, isSelected, selectedEventId, setSelectedEventId, title]
    );

    const vonageBackstage = useMemo(
        () => <VonageBackstage eventId={event.id} onLeave={onLeave} hlsUri={hlsUri} />,
        [event.id, onLeave, hlsUri]
    );
    const area = useMemo(
        () =>
            isSelected ? (
                <Box mt={2} p={2} border={isNow ? "solid " + onAirBorderColour : undefined} borderWidth={4}>
                    {vonageBackstage}
                    <StreamTextCaptions streamTextEventId={event.streamTextEventId} />
                    <EmojiFloatContainer chatId={roomChatId ?? ""} xDurationMs={4000} yDurationMs={10000} />
                </Box>
            ) : !isActive ? (
                <Alert status="warning" mb={8}>
                    <AlertIcon />
                    <FormattedMessage
                        id="Conference.Attend.Room.Stream.Backstage.EventFinished"
                        defaultMessage="This event has now finished. Once you close this backstage, you will not be able to rejoin it."
                    />
                </Alert>
            ) : undefined,
        [isActive, isNow, isSelected, vonageBackstage, roomChatId, event.streamTextEventId, onAirBorderColour]
    );

    return (
        <>
            {summaryInfo}
            {area}
        </>
    );
}
